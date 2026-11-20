import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geography', '0006_backfill_jerarquia'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='zona',
            name='uq_zona_municipio_nombre',
        ),
        migrations.RemoveConstraint(
            model_name='municipio',
            name='uq_municipio_departamento_nombre',
        ),
        migrations.RemoveField(
            model_name='zona',
            name='municipio',
        ),
        migrations.RemoveField(
            model_name='municipio',
            name='departamento',
        ),
        migrations.AlterField(
            model_name='departamento',
            name='pais',
            field=models.ForeignKey(
                db_column='id_pais',
                db_index=False,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='departamentos',
                to='geography.pais',
            ),
        ),
        migrations.AlterField(
            model_name='municipio',
            name='provincia',
            field=models.ForeignKey(
                db_column='id_provincia',
                db_index=False,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='municipios',
                to='geography.provincia',
            ),
        ),
        migrations.AlterField(
            model_name='zona',
            name='localidad',
            field=models.ForeignKey(
                db_column='id_localidad',
                db_index=False,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='zonas',
                to='geography.localidad',
            ),
        ),
        migrations.AddConstraint(
            model_name='municipio',
            constraint=models.UniqueConstraint(
                fields=('provincia', 'nombre_municipio'),
                name='uq_municipio_provincia_nombre',
            ),
        ),
        migrations.AddConstraint(
            model_name='zona',
            constraint=models.UniqueConstraint(
                fields=('localidad', 'nombre_zona'),
                name='uq_zona_localidad_nombre',
            ),
        ),
        migrations.AlterModelTable(
            name='zona',
            table='zonas_barrios',
        ),
    ]
