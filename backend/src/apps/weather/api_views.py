import logging

import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .api_serializers import FuenteMeteorologicaSerializer
from .models import FuenteMeteorologica

logger = logging.getLogger(__name__)

# Mapeo de weathercodes de Open-Meteo a descripciones en español
WMO_WEATHER_CODES = {
    0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nuboso", 3: "Nublado",
    45: "Niebla", 48: "Niebla con escarcha", 51: "Llovizna ligera", 53: "Llovizna moderada",
    55: "Llovizna densa", 56: "Llovizna congelante ligera", 57: "Llovizna congelante densa",
    61: "Lluvia ligera", 63: "Lluvia moderada", 65: "Lluvia intensa",
    66: "Lluvia congelante ligera", 67: "Lluvia congelante intensa",
    71: "Nieve ligera", 73: "Nieve moderada", 75: "Nieve intensa",
    77: "Granos de nieve", 80: "Chubascos ligeros", 81: "Chubascos moderados",
    82: "Chubascos violentos", 85: "Chubascos de nieve ligeros", 86: "Chubascos de nieve intensos",
    95: "Tormenta eléctrica", 96: "Tormenta con granizo ligero", 99: "Tormenta con granizo intenso",
}

def get_weather_description(code):
    return WMO_WEATHER_CODES.get(code, "Desconocido")

def get_wind_direction(degrees):
    if degrees is None:
        return "—"
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
    idx = round(degrees / 22.5) % 16
    return dirs[idx]


class FuenteMeteorologicaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuenteMeteorologica.objects.filter(es_activa=True).select_related(
        'usuario_registro'
    ).order_by('nombre_proveedor')
    serializer_class = FuenteMeteorologicaSerializer
    search_fields = ('nombre_proveedor', 'descripcion')
    ordering_fields = ('nombre_proveedor',)

    def _get_coords_from_params(self, request):
        latitud = request.query_params.get('latitud')
        longitud = request.query_params.get('longitud')
        departamento_id = request.query_params.get('departamento_id')
        zona_id = request.query_params.get('zona_id')

        if departamento_id:
            try:
                from apps.geography.models import Departamento
                dep = Departamento.objects.get(pk=departamento_id)
                if dep.latitud is not None and dep.longitud is not None:
                    return dep.latitud, dep.longitud, dep.nombre_departamento, dep
            except Departamento.DoesNotExist:
                pass

        if zona_id:
            try:
                from apps.geography.models import Zona
                zona = Zona.objects.select_related('municipio__departamento').get(pk=zona_id)
                if zona.municipio and zona.municipio.departamento:
                    dep = zona.municipio.departamento
                    if dep.latitud is not None and dep.longitud is not None:
                        return dep.latitud, dep.longitud, f"{zona.nombre_zona}, {dep.nombre_departamento}", dep
            except Zona.DoesNotExist:
                pass

        if latitud and longitud:
            try:
                lat = float(latitud)
                lng = float(longitud)
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    return lat, lng, f"({lat}, {lng})", None
            except (ValueError, TypeError):
                pass

        return None, None, None, None

    @action(detail=False, methods=('get',), permission_classes=(IsAuthenticated,))
    def forecast(self, request):
        """
        Consulta el clima actual, por hora y a 7 días para una ubicación dada.
        Acepta latitud/longitud, o departamento_id, o zona_id.
        """
        lat, lon, location_label, departamento = self._get_coords_from_params(request)

        if lat is None or lon is None:
            return Response(
                {'detail': 'Se requieren latitud y longitud, o departamento_id, o zona_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fuente = FuenteMeteorologica.objects.filter(es_activa=True).first()
        proveedor_nombre = fuente.nombre_proveedor if fuente else 'Open-Meteo'

        try:
            response = requests.get(
                'https://api.open-meteo.com/v1/forecast',
                params={
                    'latitude': lat,
                    'longitude': lon,
                    'current_weather': 'true',
                    'hourly': 'temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m,winddirection_10m',
                    'daily': 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,precipitation_sum,windspeed_10m_max',
                    'timezone': 'America/La_Paz',
                    'forecast_days': 7,
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()

            current = data.get('current_weather', {})
            hourly = data.get('hourly', {})
            daily = data.get('daily', {})

            # Hora actual
            now = current.get('time', '')
            current_hour_idx = 0
            if now and hourly.get('time'):
                for i, t in enumerate(hourly['time']):
                    if t == now:
                        current_hour_idx = i
                        break

            # Pronóstico por hora (próximas 24 horas)
            hourly_forecast = []
            if hourly.get('time'):
                for i in range(min(24, len(hourly['time']))):
                    idx = current_hour_idx + i
                    if idx >= len(hourly['time']):
                        break
                    code = hourly['weathercode'][idx] if hourly.get('weathercode') else None
                    hourly_forecast.append({
                        'hora': hourly['time'][idx][-5:] if len(hourly['time'][idx]) >= 5 else hourly['time'][idx],
                        'temperatura': hourly['temperature_2m'][idx],
                        'descripcion': get_weather_description(code),
                        'precipitacion_prob': hourly.get('precipitation_probability', [None])[idx] if hourly.get('precipitation_probability') else None,
                        'precipitacion_mm': None,
                        'viento_velocidad': hourly.get('windspeed_10m', [None])[idx] if hourly.get('windspeed_10m') else None,
                        'viento_direccion': hourly.get('winddirection_10m', [None])[idx] if hourly.get('winddirection_10m') else None,
                        'viento_direccion_texto': get_wind_direction(hourly.get('winddirection_10m', [None])[idx]) if hourly.get('winddirection_10m') else '—',
                        'humedad': hourly.get('relativehumidity_2m', [None])[idx] if hourly.get('relativehumidity_2m') else None,
                        'codigo_clima': code,
                    })

            # Pronóstico diario (7 días)
            daily_forecast = []
            if daily.get('time'):
                for i in range(min(7, len(daily['time']))):
                    code = daily['weathercode'][i] if daily.get('weathercode') else None
                    daily_forecast.append({
                        'fecha': daily['time'][i],
                        'dia_nombre': get_day_name(daily['time'][i]),
                        'temperatura_max': daily.get('temperature_2m_max', [None])[i] if daily.get('temperature_2m_max') else None,
                        'temperatura_min': daily.get('temperature_2m_min', [None])[i] if daily.get('temperature_2m_min') else None,
                        'descripcion': get_weather_description(code),
                        'precipitacion_prob': daily.get('precipitation_probability_max', [None])[i] if daily.get('precipitation_probability_max') else None,
                        'precipitacion_mm': daily.get('precipitation_sum', [None])[i] if daily.get('precipitation_sum') else None,
                        'viento_velocidad_max': daily.get('windspeed_10m_max', [None])[i] if daily.get('windspeed_10m_max') else None,
                        'codigo_clima': code,
                    })

            current_code = current.get('weathercode')
            resultado = {
                'proveedor': proveedor_nombre,
                'ubicacion': location_label,
                'latitud': lat,
                'longitud': lon,
                'clima_descripcion': departamento.clima_descripcion if departamento else None,
                'recomendaciones': departamento.recomendaciones if departamento else None,
                'actual': {
                    'temperatura': current.get('temperature'),
                    'sensacion_termica': current.get('apparent_temperature'),
                    'descripcion': get_weather_description(current_code),
                    'viento_velocidad': current.get('windspeed'),
                    'viento_direccion': current.get('winddirection'),
                    'viento_direccion_texto': get_wind_direction(current.get('winddirection')),
                    'fecha_hora': now,
                    'codigo_clima': current_code,
                },
                'por_hora': hourly_forecast,
                'pronostico_7_dias': daily_forecast,
                'fuente': 'https://open-meteo.com/',
            }

            return Response(resultado, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            logger.warning('Timeout consultando API meteorológica')
            return Response(
                {'detail': 'El servicio meteorológico tardó demasiado en responder.', 'proveedor': proveedor_nombre, 'disponible': False},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except requests.exceptions.ConnectionError:
            logger.warning('Error de conexión consultando API meteorológica')
            return Response(
                {'detail': 'No hay conexión con el servicio meteorológico.', 'proveedor': proveedor_nombre, 'disponible': False},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except requests.exceptions.RequestException as exc:
            logger.warning('Error consultando API meteorológica: %s', exc)
            return Response(
                {'detail': 'Error al consultar el servicio meteorológico.', 'proveedor': proveedor_nombre, 'disponible': False},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


def get_day_name(fecha_str):
    """Convierte '2026-11-09' a 'Hoy', 'Mañana', 'Lunes', etc."""
    from datetime import datetime, timedelta
    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
        hoy = datetime.now().date()
        manana = hoy + timedelta(days=1)
        if fecha.date() == hoy:
            return "Hoy"
        if fecha.date() == manana:
            return "Mañana"
        dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        return dias[fecha.weekday()]
    except Exception:
        return fecha_str
