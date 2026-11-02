from django.conf import settings
from django.contrib.postgres.functions import TransactionNow
from django.db import models
from django.utils import timezone


class TipoRiesgo(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_tipo_riesgo')
    nombre_riesgo = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    es_activo = models.BooleanField(default=True, db_default=True)

    class Meta:
        db_table = 'tipos_riesgo'
        verbose_name = 'risk type'
        verbose_name_plural = 'risk types'

    def __str__(self):
        return self.nombre_riesgo


class NivelSeveridad(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_nivel_severidad')
    nombre_nivel = models.CharField(max_length=40, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    orden = models.SmallIntegerField()

    class Meta:
        db_table = 'niveles_severidad'
        verbose_name = 'severity level'
        verbose_name_plural = 'severity levels'

    def __str__(self):
        return self.nombre_nivel


class EstadoIncidente(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_estado')
    nombre_estado = models.CharField(max_length=40, unique=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'estados_incidente'
        verbose_name = 'incident status'
        verbose_name_plural = 'incident statuses'

    def __str__(self):
        return self.nombre_estado


class Incidente(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_incidente')
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario',
        db_index=False,
    )
    tipo_riesgo = models.ForeignKey(
        TipoRiesgo,
        on_delete=models.DO_NOTHING,
        db_column='id_tipo_riesgo',
        db_index=False,
    )
    nivel_severidad = models.ForeignKey(
        NivelSeveridad,
        on_delete=models.DO_NOTHING,
        db_column='id_nivel_severidad',
        null=True,
        blank=True,
        db_index=False,
    )
    estado = models.ForeignKey(
        EstadoIncidente,
        on_delete=models.DO_NOTHING,
        db_column='id_estado',
        db_index=False,
    )
    zona = models.ForeignKey(
        'geography.Zona',
        on_delete=models.DO_NOTHING,
        db_column='id_zona',
        null=True,
        blank=True,
        db_index=False,
    )
    descripcion = models.TextField()
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    referencia_ubicacion = models.CharField(
        max_length=200,
        null=True,
        blank=True,
    )
    fecha_reporte = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )
    fecha_actualizacion = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )

    class Meta:
        db_table = 'incidentes'
        indexes = [
            models.Index(fields=['usuario'], name='idx_inc_usuario'),
            models.Index(fields=['tipo_riesgo'], name='idx_inc_tipo_riesgo'),
            models.Index(fields=['nivel_severidad'], name='idx_inc_severidad'),
            models.Index(fields=['estado'], name='idx_inc_estado'),
            models.Index(fields=['zona'], name='idx_inc_zona'),
            models.Index(fields=['fecha_reporte'], name='idx_inc_fecha_reporte'),
        ]
        verbose_name = 'incident'
        verbose_name_plural = 'incidents'


class HistorialEstado(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_historial')
    incidente = models.ForeignKey(
        Incidente,
        on_delete=models.DO_NOTHING,
        db_column='id_incidente',
        db_index=False,
    )
    estado_anterior = models.ForeignKey(
        EstadoIncidente,
        on_delete=models.DO_NOTHING,
        db_column='id_estado_anterior',
        null=True,
        blank=True,
        related_name='historial_como_estado_anterior',
        db_index=False,
    )
    estado_nuevo = models.ForeignKey(
        EstadoIncidente,
        on_delete=models.DO_NOTHING,
        db_column='id_estado_nuevo',
        related_name='historial_como_estado_nuevo',
        db_index=False,
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario',
        null=True,
        blank=True,
        db_index=False,
    )
    fecha_cambio = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )
    observacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'historial_estados'
        indexes = [
            models.Index(
                fields=['incidente', 'fecha_cambio'],
                name='idx_hist_incidente_fecha',
            ),
            models.Index(fields=['usuario'], name='idx_hist_usuario'),
        ]
        verbose_name = 'status history entry'
        verbose_name_plural = 'status history'


class ComentarioIncidente(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_comentario')
    incidente = models.ForeignKey(
        Incidente,
        on_delete=models.DO_NOTHING,
        db_column='id_incidente',
        db_index=False,
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario',
        db_index=False,
    )
    comentario = models.TextField()
    fecha_comentario = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )

    class Meta:
        db_table = 'comentarios_incidente'
        indexes = [
            models.Index(
                fields=['incidente', 'fecha_comentario'],
                name='idx_com_incidente_fecha',
            ),
            models.Index(fields=['usuario'], name='idx_com_usuario'),
        ]
        verbose_name = 'incident comment'
        verbose_name_plural = 'incident comments'
