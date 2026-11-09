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

    @action(detail=False, methods=('get',), permission_classes=(IsAuthenticated,))
    def forecast(self, request):
        """
        Consulta el clima actual para una latitud y longitud dadas.
        Usa Open-Meteo (gratis, sin API key).
        Query params: latitud, longitud
        """
        latitud = request.query_params.get('latitud')
        longitud = request.query_params.get('longitud')

        if not latitud or not longitud:
            return Response(
                {'detail': 'Se requieren los parámetros latitud y longitud.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lat = float(latitud)
            lon = float(longitud)
        except ValueError:
            return Response(
                {'detail': 'Latitud y longitud deben ser valores numéricos válidos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if lat < -90 or lat > 90 or lon < -180 or lon > 180:
            return Response(
                {'detail': 'Coordenadas fuera de rango válido.'},
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