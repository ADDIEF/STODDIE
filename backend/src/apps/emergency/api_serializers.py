from rest_framework import serializers

from .models import ContactoEmergencia, EntidadEmergencia


class EntidadEmergenciaSerializer(serializers.ModelSerializer):
    id_entidad = serializers.IntegerField(source='pk', read_only=True)
    id_municipio = serializers.IntegerField(
        source='municipio_id',
        read_only=True,
    )

    class Meta:
        model = EntidadEmergencia
        fields = (
            'id_entidad',
            'id_municipio',
            'nombre_entidad',
            'tipo_entidad',
            'direccion',
            'latitud',
            'longitud',
            'es_activa',
        )
        read_only_fields = fields


class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    id_contacto = serializers.IntegerField(source='pk', read_only=True)
    id_entidad = serializers.IntegerField(source='entidad_id', read_only=True)

    class Meta:
        model = ContactoEmergencia
        fields = (
            'id_contacto',
            'id_entidad',
            'tipo_contacto',
            'valor_contacto',
            'horario',
            'es_activo',
        )
        read_only_fields = fields
