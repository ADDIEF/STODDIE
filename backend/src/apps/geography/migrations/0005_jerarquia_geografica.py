import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geography', '0004_departamento_lat_max_departamento_lat_min_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pais',
            fields=[
                ('id', models.AutoField(db_column='id_pais', primary_key=True, serialize=False)),
                ('nombre_pais', models.CharField(max_length=100, unique=True)),
                ('codigo_iso', models.CharField(max_length=2, unique=True)),
            ],
            options={
                'verbose_name': 'country',
                'verbose_name_plural': 'countries',
                'db_table': 'paises',
                'ordering': ('nombre_pais',),
            },
        ),
        migrations.CreateModel(
            name='Provincia',
            fields=[
                ('id', models.AutoField(db_column='id_provincia', primary_key=True, serialize=False)),
                ('nombre_provincia', models.CharField(max_length=120)),
                ('departamento', models.ForeignKey(
                    db_column='id_departamento',
                    db_index=False,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='provincias',
                    to='geography.departamento',
                )),
            ],
            options={
                'verbose_name': 'province',
                'verbose_name_plural': 'provinces',
                'db_table': 'provincias',
                'ordering': ('nombre_provincia',),
            },
        ),
        migrations.CreateModel(
            name='Localidad',
            fields=[
                ('id', models.AutoField(db_column='id_localidad', primary_key=True, serialize=False)),
                ('nombre_localidad', models.CharField(max_length=120)),
                ('municipio', models.ForeignKey(
                    db_column='id_municipio',
                    db_index=False,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='localidades',
                    to='geography.municipio',
                )),
            ],
            options={
                'verbose_name': 'locality',
                'verbose_name_plural': 'localities',
                'db_table': 'localidades',
                'ordering': ('nombre_localidad',),
            },
        ),
        migrations.AddConstraint(
            model_name='provincia',
            constraint=models.UniqueConstraint(
                fields=('departamento', 'nombre_provincia'),
                name='uq_provincia_departamento_nombre',
            ),
        ),
        migrations.AddConstraint(
            model_name='localidad',
            constraint=models.UniqueConstraint(
                fields=('municipio', 'nombre_localidad'),
                name='uq_localidad_municipio_nombre',
            ),
        ),
        migrations.AddField(
            model_name='departamento',
            name='pais',
            field=models.ForeignKey(
                db_column='id_pais',
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='departamentos',
                to='geography.pais',
            ),
        ),
        migrations.AddField(
            model_name='municipio',
            name='provincia',
            field=models.ForeignKey(
                db_column='id_provincia',
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='municipios',
                to='geography.provincia',
            ),
        ),
        migrations.AddField(
            model_name='zona',
            name='localidad',
            field=models.ForeignKey(
                db_column='id_localidad',
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='zonas',
                to='geography.localidad',
            ),
        ),
    ]
