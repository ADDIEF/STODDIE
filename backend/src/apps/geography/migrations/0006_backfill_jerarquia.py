from django.db import migrations

from apps.geography.seed_data import ejecutar


MODELOS = {
    'Pais': ('geography', 'Pais'),
    'Departamento': ('geography', 'Departamento'),
    'Provincia': ('geography', 'Provincia'),
    'Municipio': ('geography', 'Municipio'),
    'Localidad': ('geography', 'Localidad'),
    'Zona': ('geography', 'Zona'),
    'Incidente': ('incidents', 'Incidente'),
}


def forwards(apps, schema_editor):
    modelos = {clave: apps.get_model(*ruta) for clave, ruta in MODELOS.items()}
    ejecutar(modelos, backfill=True, limpieza=True, sembrar=True)


def backwards(apps, schema_editor):
    # La siembra es aditiva: no se revierte para no perder referencias de incidentes.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('geography', '0005_jerarquia_geografica'),
        ('incidents', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
