"""Datos y utilidades idempotentes para la jerarquía geográfica de STODDIE.

El módulo no importa modelos concretos: recibe el diccionario de modelos (reales
o históricos de una migración) para poder reutilizarse tanto desde el comando
`poblar_geografia` como desde la migración de backfill.
"""

import re
import unicodedata
from collections import defaultdict

from django.core.exceptions import FieldDoesNotExist
from django.db import transaction

NOMBRE_PAIS = 'Bolivia'
CODIGO_ISO = 'BO'

# departamento -> provincia -> municipio -> {localidad: [zonas/barrios]}
# La primera localidad de cada municipio se considera la principal y es la que
# recibe las zonas ya existentes en la base durante el backfill.
JERARQUIA = {
    'La Paz': {
        'Murillo': {
            'La Paz': {
                'La Paz': [
                    'Centro', 'Sopocachi', 'Miraflores', 'Obrajes', 'Calacoto',
                    'Achumani', 'San Pedro', 'Tembladerani', 'Villa Fátima',
                    'Achachicala', 'San Miguel', 'Cota Cota', 'Chicagote',
                    'Calaguala', 'Irpavi', 'Alto Obrajes', 'Següencoma',
                ],
            },
            'El Alto': {
                'El Alto': [
                    'Ceja', 'Ciudad Satélite', 'Senkata', 'Villa 1ro de Mayo',
                    'Villa Ingenio', 'Villa El Carmen', 'Valle de las Chispas',
                    '16 de Julio', '8 de Marzo', 'Germán Busch', 'Villa Bolívar',
                    'Bella Vista', 'Ciudadela', 'Zona Central',
                ],
            },
            'Achocalla': {'Achocalla': ['Centro', 'Villa Nueva']},
        },
        'Ingavi': {
            'Viacha': {'Viacha': ['Central', 'San Pedro', 'Villa Nueva', 'Villa Esperanza']},
        },
        'Los Andes': {
            'Coroico': {'Coroico': ['Centro', 'Villa El Carmen']},
        },
    },
    'Santa Cruz': {
        'Andrés Ibáñez': {
            'Santa Cruz de la Sierra': {
                'Santa Cruz de la Sierra': [
                    'Plan 3000', 'Los Tajibos', 'Urubó', 'Cañada',
                    'Villa Primero de Mayo', 'Equipetrol', 'San Miguel',
                    'Las Palmas', 'El Guabí', 'Zona Norte',
                ],
            },
        },
        'Warnes': {
            'Warnes': {'Warnes': ['Central', 'San Pedro', 'Villa Bolívar', 'Villa Nueva']},
        },
        'Obispo Santistevan': {
            'Montero': {'Montero': ['Centro', 'San Miguel', 'Villa América', 'Villa Victoria']},
        },
    },
    'Cochabamba': {
        'Cercado': {
            'Cochabamba': {
                'Cochabamba': [
                    'Cala Cala', 'Ciudadela', 'San Antonio', 'Villa América',
                    'Villa Pagador', 'Linde', 'Villa El Carmen',
                ],
            },
        },
        'Quillacollo': {
            'Quillacollo': {'Quillacollo': ['Centro', 'Villa América', 'Villa Pagador', 'Villa El Carmen']},
        },
        'Chapare': {
            'Sacaba': {'Sacaba': ['Centro', 'San Pedro', 'Villa Primero de Mayo', 'Villa El Carmen']},
        },
    },
    'Chuquisaca': {
        'Oropeza': {
            'Sucre': {
                'Sucre': [
                    'Central', 'Molino', 'Recoleta', 'San Roque',
                    'Villa Primero de Mayo', 'Las Mercedes',
                ],
            },
        },
        'Yamparáez': {
            'Yamparáez': {'Yamparáez': ['Centro', 'San Pedro', 'Villa Nueva']},
        },
        'Tomina': {
            'Zudáñez': {'Zudáñez': ['Central', 'San Roque', 'Villa Nueva']},
        },
    },
    'Tarija': {
        'Cercado': {
            'Tarija': {
                'Tarija': [
                    'Central', 'La Toma', 'Los Álamos', 'San Pedro',
                    'Villa Primero de Mayo', 'San Lorenzo',
                ],
            },
        },
        'Aniceto Arce': {
            'Bermejo': {'Bermejo': ['Centro', 'San Pedro', 'Villa Nueva']},
        },
        'Gran Chaco': {
            'Villa Montes': {'Villa Montes': ['Centro', 'San José', 'Villa Primero de Mayo']},
        },
    },
    'Potosí': {
        'Tomas Frías': {
            'Potosí': {
                'Potosí': [
                    'Central', 'San Antonio', 'San Pedro', 'Villa Primero de Mayo',
                    'Yura', 'Los Álamos',
                ],
            },
        },
        'Sud Chichas': {
            'Tupiza': {'Tupiza': ['Centro', 'San Pedro', 'Villa Nueva']},
        },
        'Modesto Omiste': {
            'Villazón': {'Villazón': ['Centro', 'San José', 'Villa Primero de Mayo']},
        },
    },
    'Oruro': {
        'Cercado': {
            'Oruro': {
                'Oruro': [
                    '1ro de Mayo', 'Central', 'San Pedro', 'Villa Constituyente',
                    'Villa San José', 'Villa El Carmen',
                ],
            },
        },
        'Challapata': {
            'Challapata': {'Challapata': ['Centro', 'San Pedro', 'Villa Primero de Mayo']},
        },
        'Sabaya': {
            'Sabaya': {'Sabaya': ['Central', 'San Pedro', 'Villa Nueva']},
        },
    },
    'Beni': {
        'Cercado': {
            'Trinidad': {
                'Trinidad': [
                    '1ro de Mayo', 'Central', 'San Pedro', 'San Roque',
                    'Villa Primero de Mayo', 'Villa El Carmen',
                ],
            },
        },
        'José Miguel de Velasco': {
            'Rurrenabaque': {'Rurrenabaque': ['Centro', 'San Pedro', 'Villa Nueva']},
        },
        'Moxos': {
            'San Ignacio': {'San Ignacio': ['Centro', 'San José', 'Villa Primero de Mayo']},
        },
    },
    'Pando': {
        'Abuná': {
            'Cobija': {
                'Cobija': [
                    '1ro de Mayo', 'Bella Flor', 'Centro', 'San Pedro',
                    'Villa Nueva', 'Villa Constituyente',
                ],
            },
        },
        'Manuripi': {
            'Filadelfia': {'Filadelfia': ['Centro', 'San Pedro', 'Villa Nueva']},
            'Puerto Rico': {'Puerto Rico': ['Central', 'San Roque', 'Villa Nueva']},
        },
    },
}


def _tiene_campo(modelo, nombre):
    try:
        modelo._meta.get_field(nombre)
        return True
    except FieldDoesNotExist:
        return False


def normalizar_nombre(nombre):
    """Normaliza acentos, mayúsculas y ordinales para detectar duplicados."""
    texto = unicodedata.normalize('NFKD', nombre or '')
    texto = ''.join(caracter for caracter in texto if not unicodedata.combining(caracter))
    texto = texto.lower().strip()
    texto = re.sub(r'\s+', ' ', texto)
    texto = re.sub(r'\b1(?:ro|er|o|°|º)\b', 'primero', texto)
    return texto


def construir_indices():
    provincia_por_municipio = {}
    localidad_principal = {}
    for dep, provincias in JERARQUIA.items():
        for prov, municipios in provincias.items():
            for mun, localidades in municipios.items():
                provincia_por_municipio[(dep, mun)] = prov
                localidad_principal[(dep, mun)] = next(iter(localidades))
    return provincia_por_municipio, localidad_principal


def _asegurar_pais(modelos):
    pais, _ = modelos['Pais'].objects.get_or_create(
        nombre_pais=NOMBRE_PAIS,
        defaults={'codigo_iso': CODIGO_ISO},
    )
    return pais


def _backfill_departamentos(modelos, pais):
    actualizados = modelos['Departamento'].objects.filter(pais__isnull=True).update(pais=pais)
    return actualizados


def _backfill_municipios(modelos, indice_provincias):
    actualizados = 0
    municipios = modelos['Municipio'].objects.select_related('departamento').filter(provincia__isnull=True)
    for municipio in municipios:
        nombre_dep = municipio.departamento.nombre_departamento
        nombre_prov = indice_provincias.get(
            (nombre_dep, municipio.nombre_municipio),
            f'Provincia {nombre_dep}',
        )
        provincia, _ = modelos['Provincia'].objects.get_or_create(
            departamento=municipio.departamento,
            nombre_provincia=nombre_prov,
        )
        municipio.provincia = provincia
        municipio.save(update_fields=['provincia'])
        actualizados += 1
    return actualizados


def _backfill_zonas(modelos, indice_localidades):
    actualizados = 0
    zonas = modelos['Zona'].objects.select_related(
        'municipio', 'municipio__departamento',
    ).filter(localidad__isnull=True)
    for zona in zonas:
        municipio = zona.municipio
        if municipio is None:
            continue
        nombre_dep = municipio.departamento.nombre_departamento
        nombre_loc = indice_localidades.get(
            (nombre_dep, municipio.nombre_municipio),
            municipio.nombre_municipio,
        )
        localidad, _ = modelos['Localidad'].objects.get_or_create(
            municipio=municipio,
            nombre_localidad=nombre_loc,
        )
        zona.localidad = localidad
        zona.save(update_fields=['localidad'])
        actualizados += 1
    return actualizados


def limpiar_geografia(modelos):
    """Elimina zonas huérfanas y fusiona duplicados dentro de una misma localidad."""
    Zona = modelos['Zona']
    Localidad = modelos['Localidad']
    Incidente = modelos['Incidente']

    huerfanas = list(
        Zona.objects.exclude(localidad_id__in=Localidad.objects.values_list('id', flat=True))
    )
    for zona in huerfanas:
        Incidente.objects.filter(zona=zona).update(zona=None)
        zona.delete()

    grupos = defaultdict(list)
    for zona in Zona.objects.select_related('localidad').order_by('id'):
        clave = (zona.localidad_id, normalizar_nombre(zona.nombre_zona))
        grupos[clave].append(zona)

    fusionadas = 0
    for grupos_localidad in grupos.values():
        if len(grupos_localidad) < 2:
            continue
        canonica = next(
            (
                zona for zona in grupos_localidad
                if Incidente.objects.filter(zona=zona).exists()
            ),
            grupos_localidad[0],
        )
        for zona in grupos_localidad:
            if zona.pk == canonica.pk:
                continue
            Incidente.objects.filter(zona=zona).update(zona=canonica)
            zona.delete()
            fusionadas += 1

    return {'huerfanas': len(huerfanas), 'fusionadas': fusionadas}


def poblar_geografia(modelos, pais=None):
    """Inserta/actualiza toda la jerarquía usando get_or_create (idempotente)."""
    Pais = modelos['Pais']
    Departamento = modelos['Departamento']
    Provincia = modelos['Provincia']
    Municipio = modelos['Municipio']
    Localidad = modelos['Localidad']
    Zona = modelos['Zona']

    pais = pais or _asegurar_pais(modelos)
    conteos = {'departamentos': 0, 'provincias': 0, 'municipios': 0, 'localidades': 0, 'zonas': 0}

    for nombre_dep, provincias in JERARQUIA.items():
        departamento, creado = Departamento.objects.get_or_create(
            nombre_departamento=nombre_dep,
            defaults={'pais': pais},
        )
        if not creado and getattr(departamento, 'pais_id', None) is None:
            departamento.pais = pais
            departamento.save(update_fields=['pais'])
        conteos['departamentos'] += int(creado)

        for nombre_prov, municipios in provincias.items():
            provincia, creado = Provincia.objects.get_or_create(
                departamento=departamento,
                nombre_provincia=nombre_prov,
            )
            conteos['provincias'] += int(creado)

            for nombre_mun, localidades in municipios.items():
                datos_municipio = {
                    'provincia': provincia,
                    'nombre_municipio': nombre_mun,
                }
                # Durante la migración de backfill la columna legacy sigue siendo NOT NULL.
                if _tiene_campo(Municipio, 'departamento'):
                    datos_municipio['defaults'] = {
                        'departamento': provincia.departamento,
                    }
                municipio, creado = Municipio.objects.get_or_create(**datos_municipio)
                conteos['municipios'] += int(creado)

                for nombre_loc, zonas in localidades.items():
                    localidad, creado = Localidad.objects.get_or_create(
                        municipio=municipio,
                        nombre_localidad=nombre_loc,
                    )
                    conteos['localidades'] += int(creado)

                    for nombre_zona in zonas:
                        datos_zona = {
                            'localidad': localidad,
                            'nombre_zona': nombre_zona,
                        }
                        if _tiene_campo(Zona, 'municipio'):
                            datos_zona['defaults'] = {'municipio': localidad.municipio}
                        _, creado = Zona.objects.get_or_create(**datos_zona)
                        conteos['zonas'] += int(creado)

    return conteos


@transaction.atomic
def ejecutar(modelos, *, backfill=False, limpieza=True, sembrar=True):
    """Ejecuta las tres fases. Devuelve un resumen para mostrar/reportar."""
    resumen = {'backfill': {}, 'limpieza': {}, 'sembrado': {}}
    indice_provincias, indice_localidades = construir_indices()

    pais = _asegurar_pais(modelos)
    if backfill:
        resumen['backfill'] = {
            'departamentos': _backfill_departamentos(modelos, pais),
            'municipios': _backfill_municipios(modelos, indice_provincias),
            'zonas': _backfill_zonas(modelos, indice_localidades),
        }

    if limpieza:
        resumen['limpieza'] = limpiar_geografia(modelos)

    if sembrar:
        resumen['sembrado'] = poblar_geografia(modelos, pais=pais)
        # El sembrado puede introducir variantes de un mismo barrio; se fusionan.
        resumen['limpieza_post_siembra'] = limpiar_geografia(modelos)

    return resumen
