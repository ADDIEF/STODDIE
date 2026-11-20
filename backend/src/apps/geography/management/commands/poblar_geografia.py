from django.core.management.base import BaseCommand

from apps.geography.models import (
    Departamento,
    Localidad,
    Municipio,
    Pais,
    Provincia,
    Zona,
)
from apps.geography.seed_data import ejecutar
from apps.incidents.models import Incidente


class Command(BaseCommand):
    help = 'Limpia duplicados y puebla la jerarquía Bolivia -> departamento -> provincia -> municipio -> localidad -> zona/barrio.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--solo-limpieza',
            action='store_true',
            help='Solo elimina zonas huérfanas y fusiona duplicados.',
        )
        parser.add_argument(
            '--solo-siembra',
            action='store_true',
            help='Solo inserta los datos que falten (sin limpiar duplicados).',
        )

    def handle(self, *args, **options):
        solo_limpieza = options['solo_limpieza']
        solo_siembra = options['solo_siembra']
        if solo_limpieza and solo_siembra:
            self.stderr.write('No puedes usar --solo-limpieza y --solo-siembra a la vez.')
            return

        modelos = {
            'Pais': Pais,
            'Departamento': Departamento,
            'Provincia': Provincia,
            'Municipio': Municipio,
            'Localidad': Localidad,
            'Zona': Zona,
            'Incidente': Incidente,
        }
        resumen = ejecutar(
            modelos,
            backfill=False,
            limpieza=not solo_siembra,
            sembrar=not solo_limpieza,
        )
        self.stdout.write(self.style.SUCCESS('Jerarquía geográfica procesada:'))
        for fase, datos in resumen.items():
            self.stdout.write(f'  {fase}: {datos}')
        self.stdout.write(
            '  totales -> '
            f'países={Pais.objects.count()}, '
            f'departamentos={Departamento.objects.count()}, '
            f'provincias={Provincia.objects.count()}, '
            f'municipios={Municipio.objects.count()}, '
            f'localidades={Localidad.objects.count()}, '
            f'zonas_barrios={Zona.objects.count()}'
        )
