from rest_framework import serializers

from .models import FuenteMeteorologica


class FuenteMeteorologicaSerializer(serializers.ModelSerializer):
    id_fuente = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = FuenteMeteorologica
        fields = (
            'id_fuente',
            'nombre_proveedor',
            'url_referencia',
            'descripcion',
            'es_activa',
        )
        read_only_fields = fields
