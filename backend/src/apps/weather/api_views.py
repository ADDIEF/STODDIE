from rest_framework import viewsets

from .api_serializers import FuenteMeteorologicaSerializer
from .models import FuenteMeteorologica


class FuenteMeteorologicaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuenteMeteorologica.objects.filter(es_activa=True).select_related(
        'usuario_registro'
    ).order_by('nombre_proveedor')
    serializer_class = FuenteMeteorologicaSerializer
    search_fields = ('nombre_proveedor', 'descripcion')
    ordering_fields = ('nombre_proveedor',)
