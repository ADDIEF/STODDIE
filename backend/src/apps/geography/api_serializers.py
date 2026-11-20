from rest_framework import serializers

from .models import Departamento, Localidad, Municipio, Pais, Provincia, Zona


class PaisSerializer(serializers.ModelSerializer):
    id_pais = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = Pais
        fields = ('id_pais', 'nombre_pais', 'codigo_iso')
        read_only_fields = fields


class DepartamentoSerializer(serializers.ModelSerializer):
    id_departamento = serializers.IntegerField(source='pk', read_only=True)
    id_pais = serializers.IntegerField(source='pais_id', read_only=True)
    nombre_pais = serializers.CharField(source='pais.nombre_pais', read_only=True)

    class Meta:
        model = Departamento
        fields = (
            'id_departamento', 'id_pais', 'nombre_pais', 'nombre_departamento',
            'latitud', 'longitud', 'lat_min', 'lat_max', 'lon_min', 'lon_max',
            'clima_descripcion', 'recomendaciones',
        )
        read_only_fields = fields


class ProvinciaSerializer(serializers.ModelSerializer):
    id_provincia = serializers.IntegerField(source='pk', read_only=True)
    id_departamento = serializers.IntegerField(source='departamento_id', read_only=True)
    nombre_departamento = serializers.CharField(
        source='departamento.nombre_departamento',
        read_only=True,
    )
    ruta_territorial = serializers.CharField(read_only=True)

    class Meta:
        model = Provincia
        fields = (
            'id_provincia', 'id_departamento', 'nombre_departamento',
            'nombre_provincia', 'ruta_territorial',
        )
        read_only_fields = fields


class MunicipioSerializer(serializers.ModelSerializer):
    id_municipio = serializers.IntegerField(source='pk', read_only=True)
    id_provincia = serializers.IntegerField(source='provincia_id', read_only=True)
    nombre_provincia = serializers.CharField(source='provincia.nombre_provincia', read_only=True)
    id_departamento = serializers.IntegerField(source='departamento_id', read_only=True)
    nombre_departamento = serializers.CharField(
        source='provincia.departamento.nombre_departamento',
        read_only=True,
    )
    ruta_territorial = serializers.CharField(read_only=True)

    class Meta:
        model = Municipio
        fields = (
            'id_municipio', 'id_provincia', 'nombre_provincia',
            'id_departamento', 'nombre_departamento', 'nombre_municipio',
            'ruta_territorial',
        )
        read_only_fields = fields


class LocalidadSerializer(serializers.ModelSerializer):
    id_localidad = serializers.IntegerField(source='pk', read_only=True)
    id_municipio = serializers.IntegerField(source='municipio_id', read_only=True)
    nombre_municipio = serializers.CharField(source='municipio.nombre_municipio', read_only=True)
    id_provincia = serializers.IntegerField(source='municipio.provincia_id', read_only=True)
    nombre_provincia = serializers.CharField(
        source='municipio.provincia.nombre_provincia',
        read_only=True,
    )
    id_departamento = serializers.IntegerField(
        source='municipio.provincia.departamento_id',
        read_only=True,
    )
    nombre_departamento = serializers.CharField(
        source='municipio.provincia.departamento.nombre_departamento',
        read_only=True,
    )
    ruta_territorial = serializers.CharField(read_only=True)

    class Meta:
        model = Localidad
        fields = (
            'id_localidad', 'nombre_localidad', 'id_municipio', 'nombre_municipio',
            'id_provincia', 'nombre_provincia', 'id_departamento',
            'nombre_departamento', 'ruta_territorial',
        )
        read_only_fields = fields


class ZonaSerializer(serializers.ModelSerializer):
    id_zona = serializers.IntegerField(source='pk', read_only=True)
    id_localidad = serializers.IntegerField(source='localidad_id', read_only=True)
    nombre_localidad = serializers.CharField(source='localidad.nombre_localidad', read_only=True)
    id_municipio = serializers.IntegerField(source='municipio_id', read_only=True)
    nombre_municipio = serializers.CharField(
        source='localidad.municipio.nombre_municipio',
        read_only=True,
    )
    id_provincia = serializers.IntegerField(
        source='localidad.municipio.provincia_id',
        read_only=True,
    )
    nombre_provincia = serializers.CharField(
        source='localidad.municipio.provincia.nombre_provincia',
        read_only=True,
    )
    id_departamento = serializers.IntegerField(source='departamento_id', read_only=True)
    nombre_departamento = serializers.CharField(
        source='localidad.municipio.provincia.departamento.nombre_departamento',
        read_only=True,
    )
    nombre_pais = serializers.CharField(
        source='localidad.municipio.provincia.departamento.pais.nombre_pais',
        read_only=True,
    )
    ruta_territorial = serializers.CharField(read_only=True)

    class Meta:
        model = Zona
        fields = (
            'id_zona', 'nombre_zona', 'referencia',
            'id_localidad', 'nombre_localidad',
            'id_municipio', 'nombre_municipio',
            'id_provincia', 'nombre_provincia',
            'id_departamento', 'nombre_departamento', 'nombre_pais',
            'ruta_territorial',
        )
        read_only_fields = fields
