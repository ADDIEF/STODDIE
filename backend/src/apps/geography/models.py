from django.db import models


class Departamento(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_departamento')
    nombre_departamento = models.CharField(max_length=100, unique=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clima_descripcion = models.TextField(null=True, blank=True)
    recomendaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'departamentos'
        verbose_name = 'department'
        verbose_name_plural = 'departments'

    def __str__(self):
        return self.nombre_departamento


class Municipio(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_municipio')
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.DO_NOTHING,
        db_column='id_departamento',
        db_index=False,
    )
    nombre_municipio = models.CharField(max_length=120)

    class Meta:
        db_table = 'municipios'
        constraints = [
            models.UniqueConstraint(
                fields=['departamento', 'nombre_municipio'],
                name='uq_municipio_departamento_nombre',
            ),
        ]
        verbose_name = 'municipality'
        verbose_name_plural = 'municipalities'

    def __str__(self):
        return self.nombre_municipio


class Zona(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_zona')
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.DO_NOTHING,
        db_column='id_municipio',
        db_index=False,
    )
    nombre_zona = models.CharField(max_length=120)
    referencia = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'zonas'
        constraints = [
            models.UniqueConstraint(
                fields=['municipio', 'nombre_zona'],
                name='uq_zona_municipio_nombre',
            ),
        ]
        verbose_name = 'zone'
        verbose_name_plural = 'zones'

    def __str__(self):
        return self.nombre_zona
