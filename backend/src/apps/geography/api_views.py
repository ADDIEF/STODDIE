from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.api_serializers import parse_positive_integer

from .api_serializers import (
    DepartamentoSerializer,
    LocalidadSerializer,
    MunicipioSerializer,
    PaisSerializer,
    ProvinciaSerializer,
    ZonaSerializer,
)
from .models import Departamento, Localidad, Municipio, Pais, Provincia, Zona


class PaisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pais.objects.all().order_by('nombre_pais')
    serializer_class = PaisSerializer
    search_fields = ('nombre_pais', 'codigo_iso')
    ordering_fields = ('nombre_pais',)
    permission_classes = [AllowAny]


class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DepartamentoSerializer
    search_fields = ('nombre_departamento', 'pais__nombre_pais')
    ordering_fields = ('nombre_departamento',)
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Departamento.objects.select_related('pais').order_by('nombre_departamento')
        pais_id = self.request.query_params.get('id_pais')
        if pais_id is not None:
            queryset = queryset.filter(
                pais_id=parse_positive_integer(pais_id, 'id_pais')
            )
        return queryset


class ProvinciaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProvinciaSerializer
    search_fields = ('nombre_provincia', 'departamento__nombre_departamento')
    ordering_fields = ('nombre_provincia',)
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Provincia.objects.select_related(
            'departamento', 'departamento__pais',
        ).order_by('nombre_provincia')
        departamento_id = self.request.query_params.get('id_departamento')
        if departamento_id is not None:
            queryset = queryset.filter(
                departamento_id=parse_positive_integer(
                    departamento_id,
                    'id_departamento',
                )
            )
        return queryset


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MunicipioSerializer
    search_fields = (
        'nombre_municipio',
        'provincia__nombre_provincia',
        'provincia__departamento__nombre_departamento',
    )
    ordering_fields = ('nombre_municipio',)
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Municipio.objects.select_related(
            'provincia',
            'provincia__departamento',
            'provincia__departamento__pais',
        ).order_by('nombre_municipio')

        provincia_id = self.request.query_params.get('id_provincia')
        if provincia_id is not None:
            queryset = queryset.filter(
                provincia_id=parse_positive_integer(provincia_id, 'id_provincia')
            )

        # Filtro heredado: permite filtrar municipios directamente por departamento.
        departamento_id = self.request.query_params.get('id_departamento')
        if departamento_id is not None:
            queryset = queryset.filter(
                provincia__departamento_id=parse_positive_integer(
                    departamento_id,
                    'id_departamento',
                )
            )
        return queryset


class LocalidadViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LocalidadSerializer
    search_fields = (
        'nombre_localidad',
        'municipio__nombre_municipio',
        'municipio__provincia__departamento__nombre_departamento',
    )
    ordering_fields = ('nombre_localidad',)
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Localidad.objects.select_related(
            'municipio',
            'municipio__provincia',
            'municipio__provincia__departamento',
            'municipio__provincia__departamento__pais',
        ).order_by('nombre_localidad')

        municipio_id = self.request.query_params.get('id_municipio')
        if municipio_id is not None:
            queryset = queryset.filter(
                municipio_id=parse_positive_integer(municipio_id, 'id_municipio')
            )
        departamento_id = self.request.query_params.get('id_departamento')
        if departamento_id is not None:
            queryset = queryset.filter(
                municipio__provincia__departamento_id=parse_positive_integer(
                    departamento_id,
                    'id_departamento',
                )
            )
        return queryset


class ZonaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ZonaSerializer
    search_fields = (
        'nombre_zona',
        'referencia',
        'localidad__nombre_localidad',
        'localidad__municipio__nombre_municipio',
    )
    ordering_fields = ('nombre_zona',)
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Zona.objects.select_related(
            'localidad',
            'localidad__municipio',
            'localidad__municipio__provincia',
            'localidad__municipio__provincia__departamento',
            'localidad__municipio__provincia__departamento__pais',
        ).order_by('nombre_zona')

        localidad_id = self.request.query_params.get('id_localidad')
        if localidad_id is not None:
            queryset = queryset.filter(
                localidad_id=parse_positive_integer(localidad_id, 'id_localidad')
            )

        # Filtro heredado: zonas de un municipio (antes `Zona.municipio`).
        municipio_id = self.request.query_params.get('id_municipio')
        if municipio_id is not None:
            queryset = queryset.filter(
                localidad__municipio_id=parse_positive_integer(
                    municipio_id,
                    'id_municipio',
                )
            )
        departamento_id = self.request.query_params.get('id_departamento')
        if departamento_id is not None:
            queryset = queryset.filter(
                localidad__municipio__provincia__departamento_id=parse_positive_integer(
                    departamento_id,
                    'id_departamento',
                )
            )
        return queryset
