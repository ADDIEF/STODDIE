from django.db import models


def unir_ruta(*partes):
    """Compone la ruta territorial sin repetir etiquetas consecutivas.

    Cada `parte` puede ser una ruta ya ensamblada (p. ej. la ruta del
    municipio), por eso se comparan las etiquetas individuales.
    """
    resultado = []
    for parte in partes:
        for etiqueta in str(parte or '').split(' - '):
            etiqueta = etiqueta.strip()
            if etiqueta and (not resultado or resultado[-1] != etiqueta):
                resultado.append(etiqueta)
    return ' - '.join(resultado)


class Pais(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_pais')
    nombre_pais = models.CharField(max_length=100, unique=True)
    codigo_iso = models.CharField(max_length=2, unique=True)

    class Meta:
        db_table = 'paises'
        verbose_name = 'country'
        verbose_name_plural = 'countries'
        ordering = ('nombre_pais',)

    def __str__(self):
        return self.nombre_pais


class Departamento(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_departamento')
    pais = models.ForeignKey(
        Pais,
        on_delete=models.PROTECT,
        db_column='id_pais',
        db_index=False,
        related_name='departamentos',
    )
    nombre_departamento = models.CharField(max_length=100, unique=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lat_min = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lat_max = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon_min = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon_max = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clima_descripcion = models.TextField(null=True, blank=True)
    recomendaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'departamentos'
        verbose_name = 'department'
        verbose_name_plural = 'departments'

    def __str__(self):
        return self.nombre_departamento

    def contiene_coordenada(self, lat, lon):
        if None in (self.lat_min, self.lat_max, self.lon_min, self.lon_max):
            return True
        return (
            float(self.lat_min) <= lat <= float(self.lat_max)
            and float(self.lon_min) <= lon <= float(self.lon_max)
        )


class Provincia(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_provincia')
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        db_column='id_departamento',
        db_index=False,
        related_name='provincias',
    )
    nombre_provincia = models.CharField(max_length=120)

    class Meta:
        db_table = 'provincias'
        constraints = [
            models.UniqueConstraint(
                fields=['departamento', 'nombre_provincia'],
                name='uq_provincia_departamento_nombre',
            ),
        ]
        verbose_name = 'province'
        verbose_name_plural = 'provinces'
        ordering = ('nombre_provincia',)

    def __str__(self):
        return self.nombre_provincia

    @property
    def ruta_territorial(self):
        departamento = self.departamento
        return unir_ruta(
            departamento.pais.nombre_pais,
            departamento.nombre_departamento,
            self.nombre_provincia,
        )


class Municipio(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_municipio')
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.PROTECT,
        db_column='id_provincia',
        db_index=False,
        related_name='municipios',
    )
    nombre_municipio = models.CharField(max_length=120)

    class Meta:
        db_table = 'municipios'
        constraints = [
            models.UniqueConstraint(
                fields=['provincia', 'nombre_municipio'],
                name='uq_municipio_provincia_nombre',
            ),
        ]
        verbose_name = 'municipality'
        verbose_name_plural = 'municipalities'

    def __str__(self):
        return self.nombre_municipio

    @property
    def departamento(self):
        return self.provincia.departamento

    @property
    def departamento_id(self):
        return self.provincia.departamento_id

    @property
    def ruta_territorial(self):
        provincia = self.provincia
        departamento = provincia.departamento
        return unir_ruta(
            departamento.pais.nombre_pais,
            departamento.nombre_departamento,
            provincia.nombre_provincia,
            self.nombre_municipio,
        )


class Localidad(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_localidad')
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.PROTECT,
        db_column='id_municipio',
        db_index=False,
        related_name='localidades',
    )
    nombre_localidad = models.CharField(max_length=120)

    class Meta:
        db_table = 'localidades'
        constraints = [
            models.UniqueConstraint(
                fields=['municipio', 'nombre_localidad'],
                name='uq_localidad_municipio_nombre',
            ),
        ]
        verbose_name = 'locality'
        verbose_name_plural = 'localities'
        ordering = ('nombre_localidad',)

    def __str__(self):
        return self.nombre_localidad

    @property
    def ruta_territorial(self):
        return unir_ruta(self.municipio.ruta_territorial, self.nombre_localidad)


class Zona(models.Model):
    """Barrio/zona urbana. La tabla conserva el nombre `zonas_barrios`."""

    id = models.AutoField(primary_key=True, db_column='id_zona')
    localidad = models.ForeignKey(
        Localidad,
        on_delete=models.PROTECT,
        db_column='id_localidad',
        db_index=False,
        related_name='zonas',
    )
    nombre_zona = models.CharField(max_length=120)
    referencia = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'zonas_barrios'
        constraints = [
            models.UniqueConstraint(
                fields=['localidad', 'nombre_zona'],
                name='uq_zona_localidad_nombre',
            ),
        ]
        verbose_name = 'zone'
        verbose_name_plural = 'zones'

    def __str__(self):
        return self.nombre_zona

    @property
    def municipio(self):
        return self.localidad.municipio

    @property
    def municipio_id(self):
        return self.localidad.municipio_id

    @property
    def departamento(self):
        return self.localidad.municipio.departamento

    @property
    def departamento_id(self):
        return self.localidad.municipio.departamento_id

    @property
    def ruta_territorial(self):
        return unir_ruta(self.localidad.ruta_territorial, self.nombre_zona)
