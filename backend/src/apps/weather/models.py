from django.conf import settings
from django.db import models


class FuenteMeteorologica(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_fuente')
    usuario_registro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario_registro',
        db_index=False,
    )
    nombre_proveedor = models.CharField(max_length=100, unique=True)
    url_referencia = models.CharField(max_length=250, null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    es_activa = models.BooleanField(default=True, db_default=True)

    class Meta:
        db_table = 'fuentes_meteorologicas'
        indexes = [
            models.Index(
                fields=['usuario_registro'],
                name='idx_fuente_usuario_reg',
            ),
        ]
        verbose_name = 'weather source'
        verbose_name_plural = 'weather sources'

    def __str__(self):
        return self.nombre_proveedor
