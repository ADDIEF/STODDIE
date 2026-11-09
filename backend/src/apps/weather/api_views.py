import logging

import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .api_serializers import FuenteMeteorologicaSerializer
from .models import FuenteMeteorologica

logger = logging.getLogger(__name__)


class FuenteMeteorologicaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuenteMeteorologica.objects.filter(es_activa=True).select_related(
        'usuario_registro'
    ).order_by('nombre_proveedor')
    serializer_class = FuenteMeteorologicaSerializer
    search_fields = ('nombre_proveedor', 'descripcion')
    ordering_fields = ('nombre_proveedor',)

    def _get_coords_from_params(self, request):
        """
        Obtiene latitud/longitud de los query params.
        Acepta latitud/longitud directamente, o departamento_id, o zona_id.
        """
        latitud = request.query_params.get('latitud')
        longitud = request.query_params.get('longitud')
        departamento_id = request.query_params.get('departamento_id')
        zona_id = request.query_params.get('zona_id')

        if departamento_id:
            try:
                from apps.geography.models import Departamento
                dep = Departamento.objects.get(pk=departamento_id)
                if dep.latitud is not None and dep.longitud is not None:
                    return dep.latitud, dep.longitud, dep.nombre_departamento
            except Departamento.DoesNotExist:
                pass

        if zona_id:
            try:
                from apps.geography.models import Zona
                zona = Zona.objects.select_related('municipio__departamento').get(pk=zona_id)
                if zona.municipio and zona.municipio.departamento:
                    dep = zona.municipio.departamento
                    if dep.latitud is not None and dep.longitud is not None:
                        return dep.latitud, dep.longitud, f"{zona.nombre_zona}, {dep.nombre_departamento}"
            except Zona.DoesNotExist:
                pass

        if latitud and longitud:
            try:
                lat = float(latitud)
                lng = float(longitud)
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    return lat, lng, f"({lat}, {lng})"
            except (ValueError, TypeError):
                pass

        return None, None, None

    @action(detail=False, methods=('get',), permission_classes=(IsAuthenticated,))
    def forecast(self, request):
        """
        Consulta el clima actual para una ubicación dada.
        Acepta latitud/longitud, o departamento_id, o zona_id.
        Usa Open-Meteo (gratis, sin API key).
        """
        lat, lon, location_label = self._get_coords_from_params(request)

        if lat is None or lon is None:
            return Response(
                {'detail': 'Se requieren latitud y longitud, o departamento_id, o zona_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Intentar obtener la fuente activa para identificar el proveedor
        fuente = FuenteMeteorologica.objects.filter(es_activa=True).first()
        proveedor_nombre = fuente.nombre_proveedor if fuente else 'Open-Meteo'

        try:
            response = requests.get(
                'https://api.open-meteo.com/v1/forecast',
                params={
                    'latitude': lat,
                    'longitude': lon,
                    'current_weather': 'true',
                    'timezone': 'America/La_Paz',
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            current = data.get('current_weather', {})
            resultado = {
                'proveedor': proveedor_nombre,
                'latitud': lat,
                'longitud': lon,
                'ubicacion': location_label,
                'temperatura': current.get('temperature'),
                'viento_velocidad': current.get('windspeed'),
                'viento_direccion': current.get('winddirection'),
                'codigo_clima': current.get('weathercode'),
                'fecha_hora': current.get('time'),
                'fuente': 'https://open-meteo.com/',
            }

            return Response(resultado, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            logger.warning('Timeout consultando API meteorológica')
            return Response(
                {
                    'detail': 'El servicio meteorológico tardó demasiado en responder.',
                    'proveedor': proveedor_nombre,
                    'disponible': False,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except requests.exceptions.ConnectionError:
            logger.warning('Error de conexión consultando API meteorológica')
            return Response(
                {
                    'detail': 'No hay conexión con el servicio meteorológico.',
                    'proveedor': proveedor_nombre,
                    'disponible': False,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except requests.exceptions.RequestException as exc:
            logger.warning('Error consultando API meteorológica: %s', exc)
            return Response(
                {
                    'detail': 'Error al consultar el servicio meteorológico.',
                    'proveedor': proveedor_nombre,
                    'disponible': False,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )