from rest_framework import viewsets

from apps.api_serializers import parse_positive_integer

from .api_serializers import (
    DepartamentoSerializer,
    MunicipioSerializer,
    ZonaSerializer,
)
from .models import Departamento, Municipio, Zona


class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Departamento.objects.all().order_by('nombre_departamento')
    serializer_class = DepartamentoSerializer
    search_fields = ('nombre_departamento',)
    ordering_fields = ('nombre_departamento',)


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MunicipioSerializer
    search_fields = ('nombre_municipio',)
    ordering_fields = ('nombre_municipio',)

    def get_queryset(self):
        queryset = Municipio.objects.select_related('departamento').order_by(
            'nombre_municipio'
        )
        department_id = self.request.query_params.get('id_departamento')
        if department_id is not None:
            queryset = queryset.filter(
                departamento_id=parse_positive_integer(
                    department_id,
                    'id_departamento',
                )
            )
        return queryset


class ZonaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ZonaSerializer
    search_fields = ('nombre_zona', 'referencia')
    ordering_fields = ('nombre_zona',)

    def get_queryset(self):
        queryset = Zona.objects.select_related(
            'municipio',
            'municipio__departamento',
        ).order_by('nombre_zona')
        municipality_id = self.request.query_params.get('id_municipio')
        if municipality_id is not None:
            queryset = queryset.filter(
                municipio_id=parse_positive_integer(
                    municipality_id,
                    'id_municipio',
                )
            )
        return queryset
