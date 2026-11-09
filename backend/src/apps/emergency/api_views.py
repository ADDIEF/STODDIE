from rest_framework import viewsets

from apps.api_serializers import parse_positive_integer

from .api_serializers import (
    ContactoEmergenciaSerializer,
    EntidadEmergenciaSerializer,
)
from .models import ContactoEmergencia, EntidadEmergencia


class EntidadEmergenciaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EntidadEmergenciaSerializer
    search_fields = ('nombre_entidad', 'tipo_entidad', 'direccion')
    ordering_fields = ('nombre_entidad',)

    def get_queryset(self):
        queryset = EntidadEmergencia.objects.filter(es_activa=True).select_related(
            'departamento', 'municipio'
        ).order_by('nombre_entidad')
        user = self.request.user
        # Si es administrador, ve todas las entidades de todos los departamentos
        if user.is_staff or user.roles.filter(nombre_rol='Administrador').exists():
            return queryset
        # Si es ciudadano con departamento asignado, solo ve entidades de su departamento
        if user.departamento_id:
            queryset = queryset.filter(departamento_id=user.departamento_id)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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
