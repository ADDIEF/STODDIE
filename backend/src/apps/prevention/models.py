from django.db import models
from django.contrib.postgres.functions import TransactionNow
from django.utils import timezone


class CategoriaPrevencion(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_categoria')
    nombre_categoria = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    es_activa = models.BooleanField(default=True, db_default=True)

    class Meta:
        db_table = 'categorias_prevencion'
        verbose_name = 'prevention category'
        verbose_name_plural = 'prevention categories'

    def __str__(self):
        return self.nombre_categoria


class GuiaPrevencion(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_guia')
    categoria = models.ForeignKey(
        'prevention.CategoriaPrevencion',
        on_delete=models.DO_NOTHING,
        db_column='id_categoria',
        db_index=False,
    )
    titulo = models.CharField(max_length=150)
    contenido = models.TextField()
    fecha_actualizacion = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )
    es_activa = models.BooleanField(default=True, db_default=True)
    tipos_riesgo = models.ManyToManyField(
        'incidents.TipoRiesgo',
        through='GuiaTipoRiesgo',
        related_name='guias_prevencion',
    )

    class Meta:
        db_table = 'guias_prevencion'
        indexes = [
            models.Index(fields=['categoria'], name='idx_guia_categoria'),
            models.Index(fields=['titulo'], name='idx_guia_titulo'),
        ]
        verbose_name = 'prevention guide'
        verbose_name_plural = 'prevention guides'

    def __str__(self):
        return self.titulo


class GuiaTipoRiesgo(models.Model):
    pk = models.CompositePrimaryKey('guia_id', 'tipo_riesgo_id')
    guia = models.ForeignKey(
        GuiaPrevencion,
        on_delete=models.DO_NOTHING,
        db_column='id_guia',
        db_index=False,
    )
    tipo_riesgo = models.ForeignKey(
        'incidents.TipoRiesgo',
        on_delete=models.DO_NOTHING,
        db_column='id_tipo_riesgo',
        db_index=False,
    )

    class Meta:
        db_table = 'guias_tipos_riesgo'
        verbose_name = 'guide risk type'
        verbose_name_plural = 'guide risk types'
