from decimal import Decimal

from rest_framework import serializers

from apps.api_serializers import StrictModelSerializer, StrictSerializer
from apps.geography.models import Zona

from .models import (
    ComentarioIncidente,
    EstadoIncidente,
    HistorialEstado,
    Incidente,
    NivelSeveridad,
    TipoRiesgo,
)


class TipoRiesgoSerializer(serializers.ModelSerializer):
    id_tipo_riesgo = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = TipoRiesgo
        fields = ('id_tipo_riesgo', 'nombre_riesgo', 'descripcion', 'es_activo')
        read_only_fields = fields


class NivelSeveridadSerializer(serializers.ModelSerializer):
    id_nivel_severidad = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = NivelSeveridad
        fields = (
            'id_nivel_severidad',
            'nombre_nivel',
            'descripcion',
            'orden',
        )
        read_only_fields = fields


class EstadoIncidenteSerializer(serializers.ModelSerializer):
    id_estado = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = EstadoIncidente
        fields = ('id_estado', 'nombre_estado', 'descripcion')
        read_only_fields = fields


class IncidenteReadSerializer(serializers.ModelSerializer):
    id_incidente = serializers.IntegerField(source='pk', read_only=True)
    id_usuario = serializers.IntegerField(source='usuario_id', read_only=True)
    id_tipo_riesgo = serializers.IntegerField(
        source='tipo_riesgo_id',
        read_only=True,
    )
    id_nivel_severidad = serializers.IntegerField(
        source='nivel_severidad_id',
        read_only=True,
    )
    id_estado = serializers.IntegerField(source='estado_id', read_only=True)
    id_zona = serializers.IntegerField(source='zona_id', read_only=True)
    tipo_riesgo_nombre = serializers.CharField(
        source='tipo_riesgo.nombre_riesgo',
        read_only=True,
        default='',
    )
    nivel_severidad_nombre = serializers.SerializerMethodField()
    estado_nombre = serializers.CharField(
        source='estado.nombre_estado',
        read_only=True,
        default='',
    )
    zona_nombre = serializers.SerializerMethodField()

    def get_nivel_severidad_nombre(self, obj):
        if obj.nivel_severidad_id:
            return obj.nivel_severidad.nombre_nivel if obj.nivel_severidad else ''
        return 'Sin definir'

    def get_zona_nombre(self, obj):
        if obj.zona_id:
            return obj.zona.nombre_zona if obj.zona else ''
        return 'Sin zona'

    class Meta:
        model = Incidente
        fields = (
            'id_incidente',
            'id_usuario',
            'id_tipo_riesgo',
            'tipo_riesgo_nombre',
            'id_nivel_severidad',
            'nivel_severidad_nombre',
            'id_estado',
            'estado_nombre',
            'id_zona',
            'zona_nombre',
            'descripcion',
            'latitud',
            'longitud',
            'referencia_ubicacion',
            'fecha_reporte',
            'fecha_actualizacion',
        )
        read_only_fields = fields


class IncidenteCreateSerializer(StrictModelSerializer):
    tipo_riesgo = serializers.PrimaryKeyRelatedField(
        queryset=TipoRiesgo.objects.filter(es_activo=True),
    )
    nivel_severidad = serializers.PrimaryKeyRelatedField(
        queryset=NivelSeveridad.objects.all(),
        required=False,
        allow_null=True,
    )
    zona = serializers.PrimaryKeyRelatedField(
        queryset=Zona.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Incidente
        fields = (
            'tipo_riesgo',
            'nivel_severidad',
            'zona',
            'descripcion',
            'latitud',
            'longitud',
            'referencia_ubicacion',
        )

    def validate_latitud(self, value):
        if not Decimal('-90') <= value <= Decimal('90'):
            raise serializers.ValidationError(
                'Latitude must be between -90 and 90.'
            )
        return value

    def validate_longitud(self, value):
        if not Decimal('-180') <= value <= Decimal('180'):
            raise serializers.ValidationError(
                'Longitude must be between -180 and 180.'
            )
        return value


class IncidenteUpdateSerializer(StrictModelSerializer):
    zona = serializers.PrimaryKeyRelatedField(
        queryset=Zona.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Incidente
        fields = (
            'zona',
            'descripcion',
            'latitud',
            'longitud',
            'referencia_ubicacion',
        )

    def validate_latitud(self, value):
        if not Decimal('-90') <= value <= Decimal('90'):
            raise serializers.ValidationError(
                'Latitude must be between -90 and 90.'
            )
        return value

    def validate_longitud(self, value):
        if not Decimal('-180') <= value <= Decimal('180'):
            raise serializers.ValidationError(
                'Longitude must be between -180 and 180.'
            )
        return value


class EstadoUpdateSerializer(StrictSerializer):
    id_estado = serializers.PrimaryKeyRelatedField(
        source='estado',
        queryset=EstadoIncidente.objects.all(),
    )
    observacion = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
    )


class HistorialEstadoSerializer(serializers.ModelSerializer):
    id_historial = serializers.IntegerField(source='pk', read_only=True)
    id_incidente = serializers.IntegerField(
        source='incidente_id',
        read_only=True,
    )
    id_estado_anterior = serializers.IntegerField(
        source='estado_anterior_id',
        read_only=True,
    )
    id_estado_nuevo = serializers.IntegerField(
        source='estado_nuevo_id',
        read_only=True,
    )
    id_usuario = serializers.IntegerField(source='usuario_id', read_only=True)

    class Meta:
        model = HistorialEstado
        fields = (
            'id_historial',
            'id_incidente',
            'id_estado_anterior',
            'id_estado_nuevo',
            'id_usuario',
            'fecha_cambio',
            'observacion',
        )
        read_only_fields = fields


class ComentarioReadSerializer(serializers.ModelSerializer):
    id_comentario = serializers.IntegerField(source='pk', read_only=True)
    id_usuario = serializers.IntegerField(source='usuario_id', read_only=True)
    id_incidente = serializers.IntegerField(
        source='incidente_id',
        read_only=True,
    )

    class Meta:
        model = ComentarioIncidente
        fields = (
            'id_comentario',
            'id_incidente',
            'id_usuario',
            'comentario',
            'fecha_comentario',
        )
        read_only_fields = fields


class ComentarioCreateSerializer(StrictModelSerializer):
    class Meta:
        model = ComentarioIncidente
        fields = ('comentario',)
