from rest_framework import serializers

from .models import Departamento, Municipio, Zona


class DepartamentoSerializer(serializers.ModelSerializer):
    id_departamento = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = Departamento
        fields = ('id_departamento', 'nombre_departamento', 'latitud', 'longitud', 'clima_descripcion', 'recomendaciones')
        read_only_fields = fields


class MunicipioSerializer(serializers.ModelSerializer):
    id_municipio = serializers.IntegerField(source='pk', read_only=True)
    id_departamento = serializers.IntegerField(
        source='departamento_id',
        read_only=True,
    )

    class Meta:
        model = Municipio
        fields = ('id_municipio', 'id_departamento', 'nombre_municipio')
        read_only_fields = fields


class ZonaSerializer(serializers.ModelSerializer):
    id_zona = serializers.IntegerField(source='pk', read_only=True)
    id_municipio = serializers.IntegerField(source='municipio_id', read_only=True)

    class Meta:
        model = Zona
        fields = ('id_zona', 'id_municipio', 'nombre_zona', 'referencia')
        read_only_fields = fields
