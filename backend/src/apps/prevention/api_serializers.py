from rest_framework import serializers

from apps.api_serializers import StrictSerializer
from .models import CategoriaPrevencion, GuiaPrevencion


class CategoriaPrevencionSerializer(serializers.ModelSerializer):
    id_categoria = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = CategoriaPrevencion
        fields = ('id_categoria', 'nombre_categoria', 'descripcion', 'es_activa')
        read_only_fields = fields


class GuiaPrevencionSerializer(serializers.ModelSerializer):
    id_guia = serializers.IntegerField(source='pk', read_only=True)
    id_categoria = serializers.IntegerField(
        source='categoria_id',
        read_only=True,
    )
    ids_tipos_riesgo = serializers.PrimaryKeyRelatedField(
        source='tipos_riesgo',
        many=True,
        read_only=True,
    )

    class Meta:
        model = GuiaPrevencion
        fields = (
            'id_guia',
            'id_categoria',
            'titulo',
            'contenido',
            'fecha_actualizacion',
            'es_activa',
            'ids_tipos_riesgo',
        )
        read_only_fields = fields


class GuiaTipoRiesgoInputSerializer(StrictSerializer):
    id_tipo_riesgo = serializers.IntegerField(min_value=1)
