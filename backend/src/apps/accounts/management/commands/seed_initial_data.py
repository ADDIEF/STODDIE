from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Carga los datos iniciales de STODDIE para todo Bolivia sin duplicarlos."

    @transaction.atomic
    def handle(self, *args, **options):
        get_model = apps.get_model

        User = get_user_model()
        Role = get_model("accounts", "Role")
        Departamento = get_model("geography", "Departamento")
        Municipio = get_model("geography", "Municipio")
        Zona = get_model("geography", "Zona")
        TipoRiesgo = get_model("incidents", "TipoRiesgo")
        NivelSeveridad = get_model("incidents", "NivelSeveridad")
        EstadoIncidente = get_model("incidents", "EstadoIncidente")
        Categoria = get_model("prevention", "CategoriaPrevencion")
        Guia = get_model("prevention", "GuiaPrevencion")
        Fuente = get_model("weather", "FuenteMeteorologica")
        EntidadEmergencia = get_model("emergency", "EntidadEmergencia")
        ContactoEmergencia = get_model("emergency", "ContactoEmergencia")

        # Buscar o crear un usuario administrador para asociar registros
        admin = User.objects.filter(email="admin@stoddie.local").first()
        if not admin:
            admin = User.objects.filter(is_staff=True, is_superuser=True).first()
        if not admin:
            self.stdout.write(
                self.style.WARNING(
                    "No se encontró un usuario administrador. "
                    "Las fuentes meteorológicas se cargarán sin usuario de registro."
                )
            )

        # Roles
        rol_admin, _ = Role.objects.get_or_create(
            nombre_rol="Administrador",
            defaults={"descripcion": "Administración general del sistema"}
        )
        rol_ciudadano, _ = Role.objects.get_or_create(
            nombre_rol="Ciudadano",
            defaults={"descripcion": "Usuario ciudadano que reporta incidentes"}
        )

        if admin:
            admin.roles.add(rol_admin)

        # =====================================================================
        # 9 DEPARTAMENTOS DE BOLIVIA
        # =====================================================================
        departamentos_datos = [
            {
                "nombre": "La Paz",
                "latitud": -16.5, "longitud": -68.1,
                "lat_min": -17.5, "lat_max": -16.0, "lon_min": -69.5, "lon_max": -67.5,
                "clima": "Topografía accidentada de laderas y cuencas (La Paz) y planicie de gran altitud (El Alto). Altamente vulnerable a deslizamientos, riadas, granizadas y heladas.",
                "recomendaciones": "La Paz (Lluvias y laderas): Limpie canaletas y canalillos de su vivienda antes de diciembre y evite echar basura a las torrenteras para prevenir inundaciones. Si observa grietas en paredes o pisos, o el flujo de agua cambia de color, evacúe inmediatamente sin sacar pertenencias por riesgo de deslizamiento. No retorne a su vivienda hasta que las autoridades declaren zona segura.\nEl Alto (Heladas y granizadas): Refuerce los techos de calamina para evitar colapsos por acumulación de granizo. Aísle las tuberías de agua expuestas a la intemperie con papel periódico y plásticos para evitar que revienten por el congelamiento del agua durante la madrugada.",
                "municipios": [
                    {"nombre": "La Paz", "zonas": ["Centro", "Sopocachi", "Miraflores", "Obrajes", "Calacoto", "Achumani", "San Pedro", "Tembladerani", "Villa Fátima", "Achachicala"]},
                    {"nombre": "El Alto", "zonas": ["Ceja", "Ciudad Satélite", "Senkata", "Villa 1ro de Mayo", "Villa Ingenio"]},
                    {"nombre": "Viacha", "zonas": ["Central", "San Pedro", "Villa Nueva"]},
                ],
                "entidades": [
                    {"nombre": "Retén de Emergencias Municipal (SMGIR)", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, La Paz", "contactos": [("Teléfono", "114", "Atención 24 horas")]},
                    {"nombre": "Bomberos Antofagasta", "tipo": "Bomberos", "direccion": "Av. Antofagasta, La Paz", "contactos": [("Teléfono", "119", "24 horas"), ("Teléfono", "2204125", "Oficinas")]},
                    {"nombre": "Radio Patrullas", "tipo": "Policía", "direccion": "Zona Centro, La Paz", "contactos": [("Teléfono", "110", "24 horas")]},
                    {"nombre": "Red de Ambulancias SUMA", "tipo": "Salud", "direccion": "Zona Centro, La Paz", "contactos": [("Teléfono", "161", "24 horas")]},
                    {"nombre": "Defensa Civil", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, La Paz", "contactos": [("Teléfono", "113", "24 horas")]},
                ],
            },
            {
                "nombre": "Santa Cruz",
                "latitud": -17.8, "longitud": -63.1,
                "lat_min": -20.0, "lat_max": -16.0, "lon_min": -65.0, "lon_max": -61.0,
                "clima": "Clima tropical, caluroso y húmedo. Vulnerable a incendios forestales y urbanos en época seca, vientos huracanados (surazos fuertes) e inundaciones súbitas por saturación de drenaje en época de lluvias.",
                "recomendaciones": "Calor e Incendios: Evite encender fogatas, quemar basura o realizar chaqueos durante la época seca y de vientos fuertes (agosto-octubre). Mantenga los lotes baldíos libres de maleza seca.\nVientos Fuertes: Asegure calaminas, letreros y objetos en balcones que puedan desprenderse. Evite estacionar vehículos debajo de árboles frondosos o letreros antiguos.\nLluvias: Limpie las canaletas para evitar el estancamiento de agua, mitigando tanto el riesgo de inundación barrial como la proliferación del mosquito del dengue.",
                "municipios": [
                    {"nombre": "Santa Cruz de la Sierra", "zonas": ["Plan 3000", "Los Tajibos", "Urubó", "Cañada", "Villa Primero de Mayo"]},
                    {"nombre": "Warnes", "zonas": ["Central", "Villa Bolívar", "San Pedro"]},
                    {"nombre": "Montero", "zonas": ["Centro", "Villa América", "San Miguel"]},
                ],
                "entidades": [
                    {"nombre": "Departamento de Emergencias Municipales (DEM)", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Santa Cruz", "contactos": [("Teléfono", "800-125050", "24 horas")]},
                    {"nombre": "Bomberos de la Policía", "tipo": "Bomberos", "direccion": "Zona Centro, Santa Cruz", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Fundasol (Bomberos Voluntarios)", "tipo": "Bomberos", "direccion": "Zona Los Tajibos, Santa Cruz", "contactos": [("Teléfono", "342-9999", "24 horas")]},
                    {"nombre": "Cruz Roja", "tipo": "Salud", "direccion": "Zona Centro, Santa Cruz", "contactos": [("Teléfono", "162", "24 horas")]},
                ],
            },
            {
                "nombre": "Cochabamba",
                "latitud": -17.4, "longitud": -66.1,
                "lat_min": -18.5, "lat_max": -16.0, "lon_min": -67.0, "lon_max": -64.5,
                "clima": "Clima de valles templados y trópico. Riesgo de sequías prolongadas, incendios forestales (Parque Nacional Tunari) y riadas en el cono sur y el trópico.",
                "recomendaciones": "Sequía: Racionalice el uso del agua domiciliaria e implemente sistemas de recolección de agua de lluvia para riego y limpieza.\nIncendios Forestales: No arroje colillas de cigarro ni botellas de vidrio en zonas boscosas. Si vive cerca de áreas forestales, cree franjas de seguridad (cortafuegos) alrededor de su propiedad.\nRiadas: Evite asentamientos o construcciones en las franjas de seguridad (riberas) de los ríos, especialmente en el Trópico de Cochabamba.",
                "municipios": [
                    {"nombre": "Cochabamba", "zonas": ["Ciudadela", "Cala Cala", "Villa Pagador", "Villa América", "San Antonio"]},
                    {"nombre": "Quillacollo", "zonas": ["Centro", "Villa Pagador", "Villa América"]},
                    {"nombre": "Sacaba", "zonas": ["Centro", "Villa Primero de Mayo", "San Pedro"]},
                ],
                "entidades": [
                    {"nombre": "Bomberos", "tipo": "Bomberos", "direccion": "Zona Centro, Cochabamba", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "SAR-Bolivia (Búsqueda y Rescate)", "tipo": "Rescate", "direccion": "Zona Centro, Cochabamba", "contactos": [("Teléfono", "132", "24 horas"), ("Teléfono", "425-1192", "Oficinas")]},
                    {"nombre": "Unidad de Gestión de Riesgos (UGR) Gobernación", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Cochabamba", "contactos": [("Teléfono", "425-3000", "Oficinas")]},
                ],
            },
            {
                "nombre": "Chuquisaca",
                "latitud": -19.05, "longitud": -65.25,
                "lat_min": -21.0, "lat_max": -18.5, "lon_min": -66.5, "lon_max": -64.5,
                "clima": "Zonas de valle y chaco. Alta vulnerabilidad a sequías severas, granizadas destructivas para el sector agrícola y desbordes de ríos.",
                "recomendaciones": "Granizadas: Para zonas periurbanas y agrícolas, implemente mallas antigranizo para proteger los cultivos y refuerce cubiertas ligeras.\nTormentas: Aléjese de los lechos de los ríos y quebradas durante tormentas eléctricas y lluvias fuertes, ya que las crecidas (riadas) ocurren de manera repentina.",
                "municipios": [
                    {"nombre": "Sucre", "zonas": ["Recoleta", "Molino", "San Roque", "Villa Primero de Mayo", "Central"]},
                    {"nombre": "Yamparáez", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                    {"nombre": "Zudáñez", "zonas": ["Central", "Villa Nueva", "San Roque"]},
                ],
                "entidades": [
                    {"nombre": "Retén de Emergencias Sucre", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Sucre", "contactos": [("Teléfono", "114", "24 horas")]},
                    {"nombre": "Bomberos de la Policía", "tipo": "Bomberos", "direccion": "Zona Centro, Sucre", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Dirección Departamental de Riesgos", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Sucre", "contactos": [("Teléfono", "113", "24 horas")]},
                ],
            },
            {
                "nombre": "Tarija",
                "latitud": -21.53, "longitud": -64.73,
                "lat_min": -22.5, "lat_max": -21.0, "lon_min": -65.5, "lon_max": -63.5,
                "clima": "Clima templado en valles y caluroso en el chaco. Afectado por incendios forestales (Serranía de Sama), riadas y sequías.",
                "recomendaciones": "Incendios: Respete las prohibiciones de encender fuego en reservas naturales. Mantenga despejadas de vegetación seca las áreas circundantes a las viviendas periurbanas.\nSequía: Racionalice el agua potable y evite el lavado excesivo de aceras y vehículos.",
                "municipios": [
                    {"nombre": "Tarija", "zonas": ["Los Álamos", "La Toma", "Central", "Villa Primero de Mayo", "San Pedro"]},
                    {"nombre": "Bermejo", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                    {"nombre": "Villa Montes", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
                ],
                "entidades": [
                    {"nombre": "Bomberos de la Policía", "tipo": "Bomberos", "direccion": "Zona Centro, Tarija", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Grupo de Rescate Brasschaat / Voluntarios", "tipo": "Rescate", "direccion": "Zona Centro, Tarija", "contactos": [("Teléfono", "119", "24 horas"), ("Teléfono", "664-3333", "Oficinas")]},
                    {"nombre": "Defensa Civil", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Tarija", "contactos": [("Teléfono", "113", "24 horas")]},
                ],
            },
            {
                "nombre": "Potosí",
                "latitud": -19.58, "longitud": -65.75,
                "lat_min": -23.0, "lat_max": -19.0, "lon_min": -68.0, "lon_max": -65.0,
                "clima": "Clima árido, frío y de alta montaña. Riesgo extremo por nevadas severas, heladas, vientos fuertes y escasez de agua.",
                "recomendaciones": "Nevadas y Frío Extremo: Evite viajes interdepartamentales nocturnos durante alertas de nevadas. Acopie forraje y construya cobertizos para proteger al ganado de la congelación.\nVientos: Refuerce y amarre los techos de calamina de las viviendas. Mantenga un kit de emergencia con mantas térmicas y alimentos no perecederos.",
                "municipios": [
                    {"nombre": "Potosí", "zonas": ["San Antonio", "Central", "Yura", "Villa Primero de Mayo", "San Pedro"]},
                    {"nombre": "Tupiza", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                    {"nombre": "Villazón", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
                ],
                "entidades": [
                    {"nombre": "Bomberos y Rescate", "tipo": "Bomberos", "direccion": "Zona Centro, Potosí", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Policía Camionera / Tránsito", "tipo": "Policía", "direccion": "Zona Centro, Potosí", "contactos": [("Teléfono", "110", "Carreteras")]},
                    {"nombre": "Cruz Roja", "tipo": "Salud", "direccion": "Zona Centro, Potosí", "contactos": [("Teléfono", "162", "24 horas")]},
                ],
            },
            {
                "nombre": "Oruro",
                "latitud": -17.97, "longitud": -67.1,
                "lat_min": -22.0, "lat_max": -17.5, "lon_min": -69.5, "lon_max": -66.0,
                "clima": "Altiplano frío y seco. Riesgos de inundaciones lentas por desborde (cuenca del río Desaguadero), heladas intensas y sequía.",
                "recomendaciones": "Inundaciones por desborde: Construya defensivos o camellones de tierra para proteger viviendas y zonas de pastoreo cerca de cuerpos de agua. No intente cruzar zonas anegadas a pie ni en vehículo.\nHeladas: Utilice ropa térmica en capas, proteja vías respiratorias al salir de madrugada y asegure que las fuentes de calor (estufas) tengan ventilación para evitar intoxicación por monóxido de carbono.",
                "municipios": [
                    {"nombre": "Oruro", "zonas": ["San Pedro", "1ro de Mayo", "Villa Constituyente", "Villa San José", "Central"]},
                    {"nombre": "Challapata", "zonas": ["Centro", "Villa Primero de Mayo", "San Pedro"]},
                    {"nombre": "Sabaya", "zonas": ["Central", "Villa Nueva", "San Pedro"]},
                ],
                "entidades": [
                    {"nombre": "Bomberos", "tipo": "Bomberos", "direccion": "Zona Centro, Oruro", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Unidad de Defensa Civil", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Oruro", "contactos": [("Teléfono", "113", "24 horas")]},
                    {"nombre": "Radio Patrullas", "tipo": "Policía", "direccion": "Zona Centro, Oruro", "contactos": [("Teléfono", "110", "24 horas")]},
                ],
            },
            {
                "nombre": "Beni",
                "latitud": -15.0, "longitud": -65.0,
                "lat_min": -16.0, "lat_max": -10.5, "lon_min": -67.0, "lon_max": -63.0,
                "clima": "Tropical, muy caluroso y húmedo. Altísima vulnerabilidad a inundaciones extensas, desbordes de grandes ríos e incendios forestales en la Amazonía durante la temporada seca.",
                "recomendaciones": "Inundaciones: Edifique viviendas sobre palafitos o lomas artificiales. Mantenga siempre lista una embarcación menor o bote de rescate. Traslade al ganado a zonas altas designadas antes de que inicie la temporada de lluvias intensas (diciembre a marzo).\nSalud: Use mosquiteros y repelentes constantemente para prevenir brotes de dengue, zika y chikungunya tras las inundaciones.",
                "municipios": [
                    {"nombre": "Trinidad", "zonas": ["Central", "1ro de Mayo", "San Roque", "Villa Primero de Mayo", "San Pedro"]},
                    {"nombre": "Rurrenabaque", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                    {"nombre": "San Ignacio", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
                ],
                "entidades": [
                    {"nombre": "COE Departamental (Centro de Operaciones de Emergencia)", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Trinidad", "contactos": [("Teléfono", "113", "24 horas"), ("Teléfono", "462-2222", "Oficinas")]},
                    {"nombre": "Bomberos Voluntarios Trinidad", "tipo": "Bomberos", "direccion": "Zona Centro, Trinidad", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Fuerza Naval Boliviana (Capitanías de Puerto)", "tipo": "Rescate", "direccion": "Puertos locales, Beni", "contactos": [("Teléfono", "110", "Rescates fluviales")]},
                ],
            },
            {
                "nombre": "Pando",
                "latitud": -11.0, "longitud": -67.0,
                "lat_min": -12.5, "lat_max": -9.5, "lon_min": -69.5, "lon_max": -66.5,
                "clima": "Selva amazónica, clima cálido y altamente lluvioso. Amenazas constantes de desbordes súbitos de ríos (como el río Acre), lluvias torrenciales e incendios forestales.",
                "recomendaciones": "Crecida de Ríos: Mantenga un monitoreo constante del nivel de los ríos fronterizos. Evacúe inmediatamente a los albergues temporales habilitados ante la primera alerta de rebalse, llevando únicamente documentos personales guardados en bolsas impermeables.\nLluvias: Elimine cualquier recipiente que pueda acumular agua en patios y techos para evitar criaderos de mosquitos.",
                "municipios": [
                    {"nombre": "Cobija", "zonas": ["Centro", "1ro de Mayo", "Bella Flor", "San Pedro", "Villa Nueva"]},
                    {"nombre": "Filadelfia", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                    {"nombre": "Puerto Rico", "zonas": ["Central", "Villa Nueva", "San Roque"]},
                ],
                "entidades": [
                    {"nombre": "Policía Departamental", "tipo": "Policía", "direccion": "Zona Centro, Cobija", "contactos": [("Teléfono", "110", "24 horas")]},
                    {"nombre": "Bomberos", "tipo": "Bomberos", "direccion": "Zona Centro, Cobija", "contactos": [("Teléfono", "119", "24 horas")]},
                    {"nombre": "Unidad de Gestión de Riesgos Municipal (Cobija)", "tipo": "Gestión de Riesgos", "direccion": "Zona Centro, Cobija", "contactos": [("Teléfono", "Alcaldía", "Emergencias")]},
                ],
            },
        ]

        departamentos_db = {}
        municipios_db = {}

        for dep_data in departamentos_datos:
            departamento, created = Departamento.objects.get_or_create(
                nombre_departamento=dep_data["nombre"],
                defaults={
                    "latitud": dep_data["latitud"],
                    "longitud": dep_data["longitud"],
                    "lat_min": dep_data.get("lat_min"),
                    "lat_max": dep_data.get("lat_max"),
                    "lon_min": dep_data.get("lon_min"),
                    "lon_max": dep_data.get("lon_max"),
                    "clima_descripcion": dep_data["clima"],
                    "recomendaciones": dep_data["recomendaciones"],
                },
            )
            if not created:
                departamento.latitud = dep_data["latitud"]
                departamento.longitud = dep_data["longitud"]
                departamento.lat_min = dep_data.get("lat_min")
                departamento.lat_max = dep_data.get("lat_max")
                departamento.lon_min = dep_data.get("lon_min")
                departamento.lon_max = dep_data.get("lon_max")
                departamento.clima_descripcion = dep_data["clima"]
                departamento.recomendaciones = dep_data["recomendaciones"]
                departamento.save()
            departamentos_db[dep_data["nombre"]] = departamento

            for mun_data in dep_data["municipios"]:
                municipio, _ = Municipio.objects.get_or_create(
                    departamento=departamento,
                    nombre_municipio=mun_data["nombre"],
                )
                municipios_db[f"{dep_data['nombre']}|{mun_data['nombre']}"] = municipio

                for zona_nombre in mun_data["zonas"]:
                    Zona.objects.get_or_create(
                        municipio=municipio,
                        nombre_zona=zona_nombre,
                    )

        # Tipos de riesgo
        riesgos = {
            "Deslizamiento": "Movimiento de tierra o material en pendientes.",
            "Inundación": "Acumulación o desbordamiento de agua en zonas habitadas.",
            "Riada / Desborde": "Crecida repentina o desbordamiento de cursos de agua.",
            "Helada / Granizada": "Fenómenos meteorológicos que pueden afectar a personas y bienes.",
            "Incendio Forestal / Urbano": "Fuego no controlado en áreas forestales o urbanas.",
        }

        riesgos_db = {}
        for nombre, descripcion in riesgos.items():
            riesgos_db[nombre], _ = TipoRiesgo.objects.get_or_create(
                nombre_riesgo=nombre,
                defaults={"descripcion": descripcion, "es_activo": True}
            )

        # Niveles de severidad
        severidades = [
            ("Leve", "Afectación menor.", 1),
            ("Moderado", "Afectación que requiere atención.", 2),
            ("Grave", "Afectación importante que requiere intervención.", 3),
            ("Crítico", "Situación de alto riesgo que requiere atención urgente.", 4),
        ]

        for nombre, descripcion, orden in severidades:
            NivelSeveridad.objects.get_or_create(
                nombre_nivel=nombre,
                defaults={"descripcion": descripcion, "orden": orden}
            )

        # Estados de incidente
        estados = {
            "Pendiente": "Incidente registrado y pendiente de revisión.",
            "En Revisión": "Incidente en proceso de evaluación.",
            "Confirmado": "Incidente verificado.",
            "Resuelto": "Incidente atendido o solucionado.",
            "Falso / Rechazado": "Reporte descartado después de su evaluación.",
        }

        for nombre, descripcion in estados.items():
            EstadoIncidente.objects.get_or_create(
                nombre_estado=nombre,
                defaults={"descripcion": descripcion}
            )

        # Categorías y guías de prevención
        categorias = {
            "Preparación (Antes)": "Medidas preventivas antes de una emergencia.",
            "Acción (Durante)": "Recomendaciones para actuar durante una emergencia.",
            "Recuperación (Después)": "Medidas posteriores a una emergencia.",
        }

        categorias_db = {}
        for nombre, descripcion in categorias.items():
            categorias_db[nombre], _ = Categoria.objects.get_or_create(
                nombre_categoria=nombre,
                defaults={"descripcion": descripcion, "es_activa": True}
            )

        guias = [
            {
                "titulo": "Mantenimiento de sumideros",
                "categoria": "Preparación (Antes)",
                "contenido": "Antes de la temporada de lluvias, revisa y limpia canaletas y desagües de tu vivienda. No arrojes basura a los sumideros ni a los canales de drenaje.",
                "riesgos": ["Inundación"],
            },
            {
                "titulo": "Evacuación por deslizamiento",
                "categoria": "Acción (Durante)",
                "contenido": "Si observas grietas nuevas en paredes o terrenos, movimientos de tierra o señales de inestabilidad, aléjate de la zona y busca un lugar seguro. No arriesgues tu vida intentando recuperar pertenencias.",
                "riesgos": ["Deslizamiento"],
            },
            {
                "titulo": "Retorno seguro después de una riada",
                "categoria": "Recuperación (Después)",
                "contenido": "No regreses a una zona inundada hasta que las autoridades indiquen que es seguro. Evita el contacto con agua contaminada y revisa los daños antes de volver a utilizar la vivienda.",
                "riesgos": ["Riada / Desborde", "Inundación"],
            },
        ]

        for dato in guias:
            guia, _ = Guia.objects.get_or_create(
                categoria=categorias_db[dato["categoria"]],
                titulo=dato["titulo"],
                defaults={
                    "contenido": dato["contenido"],
                    "fecha_actualizacion": timezone.now(),
                    "es_activa": True,
                }
            )
            guia.tipos_riesgo.add(
                *[riesgos_db[nombre] for nombre in dato["riesgos"]]
            )

        # Fuentes meteorológicas
        fuentes = [
            ("SENAMHI", "https://senamhi.gob.bo/", "Servicio Nacional de Meteorología e Hidrología de Bolivia."),
            ("OpenWeatherMap", "https://openweathermap.org/", "Proveedor de información meteorológica mediante servicios web."),
            ("Open-Meteo", "https://open-meteo.com/", "API meteorológica gratuita sin clave de acceso requerida."),
        ]

        for nombre, url, descripcion in fuentes:
            Fuente.objects.get_or_create(
                nombre_proveedor=nombre,
                defaults={
                    "usuario_registro": admin,
                    "url_referencia": url,
                    "descripcion": descripcion,
                    "es_activa": True,
                }
            )

        # =====================================================================
        # ENTIDADES Y CONTACTOS DE EMERGENCIA POR DEPARTAMENTO
        # =====================================================================

        for dep_data in departamentos_datos:
            if dep_data["nombre"] not in departamentos_db:
                continue
            departamento = departamentos_db[dep_data["nombre"]]

            for entidad_dato in dep_data.get("entidades", []):
                entidad, _ = EntidadEmergencia.objects.get_or_create(
                    nombre_entidad=entidad_dato["nombre"],
                    defaults={
                        "departamento": departamento,
                        "tipo_entidad": entidad_dato["tipo"],
                        "direccion": entidad_dato["direccion"],
                        "latitud": dep_data["latitud"],
                        "longitud": dep_data["longitud"],
                        "es_activa": True,
                    }
                )

                for tipo, valor, horario in entidad_dato["contactos"]:
                    ContactoEmergencia.objects.get_or_create(
                        entidad=entidad,
                        tipo_contacto=tipo,
                        valor_contacto=valor,
                        defaults={
                            "horario": horario,
                            "es_activo": True,
                        }
                    )

        self.stdout.write(self.style.SUCCESS(
            "Carga inicial de STODDIE para Bolivia completada correctamente."
        ))

        for app in [
            "accounts", "geography", "incidents",
            "prevention", "emergency", "weather"
        ]:
            self.stdout.write(f"\n{app.upper()}")

            for model in apps.get_app_config(app).get_models():
                self.stdout.write(
                    f"{model.__name__}: {model.objects.count()} registros"
                )
