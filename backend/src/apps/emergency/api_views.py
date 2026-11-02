from rest_framework import viewsets

from apps.api_serializers import parse_positive_integer

from .api_serializers import (
    ContactoEmergenciaSerializer,
    EntidadEmergenciaSerializer,
)
from .models import ContactoEmergencia, EntidadEmergencia


class EntidadEmergenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EntidadEmergencia.objects.filter(es_activa=True).select_related(
        'municipio'
    ).order_by('nombre_entidad')
    serializer_class = EntidadEmergenciaSerializer
    search_fields = ('nombre_entidad', 'tipo_entidad', 'direccion')
    ordering_fields = ('nombre_entidad',)

    def get_queryset(self):
        queryset = super().get_queryset()
        municipality_id = self.request.query_params.get('id_municipio')
        if municipality_id is not None:
            queryset = queryset.filter(
                municipio_id=parse_positive_integer(
                    municipality_id,
                    'id_municipio',
                )
            )
        return queryset


class ContactoEmergenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContactoEmergencia.objects.filter(
        es_activo=True,
        entidad__es_activa=True,
    ).select_related('entidad').order_by('entidad__nombre_entidad', 'tipo_contacto')
    serializer_class = ContactoEmergenciaSerializer
    search_fields = ('tipo_contacto', 'valor_contacto', 'entidad__nombre_entidad')
    ordering_fields = ('tipo_contacto', 'valor_contacto')

    def get_queryset(self):
        queryset = super().get_queryset()
        entity_id = self.request.query_params.get('id_entidad')
        if entity_id is not None:
            queryset = queryset.filter(
                entidad_id=parse_positive_integer(entity_id, 'id_entidad')
            )
        return queryset
