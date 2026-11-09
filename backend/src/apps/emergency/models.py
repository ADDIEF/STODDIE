from django.db import models


class EntidadEmergencia(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_entidad')
    departamento = models.ForeignKey(
        'geography.Departamento',
        on_delete=models.DO_NOTHING,
        db_column='id_departamento',
        null=True,
        blank=True,
        db_index=False,
    )
    municipio = models.ForeignKey(
        'geography.Municipio',
        on_delete=models.DO_NOTHING,
        db_column='id_municipio',
        null=True,
        blank=True,
        db_index=False,
    )
    nombre_entidad = models.CharField(max_length=150)
    tipo_entidad = models.CharField(max_length=80)
    direccion = models.CharField(max_length=200, null=True, blank=True)
    latitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    es_activa = models.BooleanField(default=True, db_default=True)

    class Meta:
        db_table = 'entidades_emergencia'
        indexes = [
            models.Index(fields=['departamento'], name='idx_ent_departamento'),
            models.Index(fields=['municipio'], name='idx_ent_municipio'),
            models.Index(fields=['nombre_entidad'], name='idx_ent_nombre'),
        ]
        verbose_name = 'emergency entity'
        verbose_name_plural = 'emergency entities'

    def __str__(self):
        return self.nombre_entidad


class ContactoEmergencia(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_contacto')
    entidad = models.ForeignKey(
        EntidadEmergencia,
        on_delete=models.DO_NOTHING,
        db_column='id_entidad',
        db_index=False,
    )
    tipo_contacto = models.CharField(max_length=40)
    valor_contacto = models.CharField(max_length=120)
    horario = models.CharField(max_length=120, null=True, blank=True)
    es_activo = models.BooleanField(default=True, db_default=True)

    class Meta:
        db_table = 'contactos_emergencia'
        indexes = [
            models.Index(fields=['entidad'], name='idx_contacto_entidad'),
        ]
        verbose_name = 'emergency contact'
        verbose_name_plural = 'emergency contacts'
