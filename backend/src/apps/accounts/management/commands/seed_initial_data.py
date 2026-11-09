from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Carga los datos iniciales de STODDIE sin duplicarlos."

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

        # Geografía: La Paz
        departamento, _ = Departamento.objects.get_or_create(
            nombre_departamento="La Paz"
        )

        municipios = {}
        for nombre in ["La Paz", "El Alto"]:
            municipios[nombre], _ = Municipio.objects.get_or_create(
                departamento=departamento,
                nombre_municipio=nombre
            )

        zonas = {
            "La Paz": [
                "Centro", "Sopocachi", "Miraflores", "Obrajes", "Calacoto",
                "Achumani", "San Pedro", "Tembladerani", "Villa Fátima",
                "Achachicala",
            ],
            "El Alto": [
                "Ceja", "Ciudad Satélite", "Senkata",
            ],
        }

        for municipio_nombre, nombres_zonas in zonas.items():
            for nombre_zona in nombres_zonas:
                Zona.objects.get_or_create(
                    municipio=municipios[municipio_nombre],
                    nombre_zona=nombre_zona
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
                "contenido": (
                    "Antes de la temporada de lluvias, revisa y limpia "
                    "canaletas y desagües de tu vivienda. No arrojes basura "
                    "a los sumideros ni a los canales de drenaje."
                ),
                "riesgos": ["Inundación"],
            },
            {
                "titulo": "Evacuación por deslizamiento",
                "categoria": "Acción (Durante)",
                "contenido": (
                    "Si observas grietas nuevas en paredes o terrenos, "
                    "movimientos de tierra o señales de inestabilidad, "
                    "aléjate de la zona y busca un lugar seguro. "
                    "No arriesgues tu vida intentando recuperar pertenencias."
                ),
                "riesgos": ["Deslizamiento"],
            },
            {
                "titulo": "Retorno seguro después de una riada",
                "categoria": "Recuperación (Después)",
                "contenido": (
                    "No regreses a una zona inundada hasta que las "
                    "autoridades indiquen que es seguro. Evita el contacto "
                    "con agua contaminada y revisa los daños antes de "
                    "volver a utilizar la vivienda."
                ),
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
            (
                "SENAMHI",
                "https://senamhi.gob.bo/",
                "Servicio Nacional de Meteorología e Hidrología de Bolivia."
            ),
            (
                "OpenWeatherMap",
                "https://openweathermap.org/",
                "Proveedor de información meteorológica mediante servicios web."
            ),
            (
                "Open-Meteo",
                "https://open-meteo.com/",
                "API meteorológica gratuita sin clave de acceso requerida."
            ),
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
        # ENTIDADES Y CONTACTOS DE EMERGENCIA (SEMANA 3)
        # =====================================================================

        entidades_datos = [
            {
                "nombre": "Bomberos Unidad La Paz",
                "municipio": "La Paz",
                "tipo": "Bomberos",
                "direccion": "Av. 6 de Agosto, Zona Centro",
                "latitud": -16.4991,
                "longitud": -68.1349,
                "contactos": [
                    {"tipo": "Teléfono", "valor": "119", "horario": "24 horas"},
                    {"tipo": "Teléfono", "valor": "2213456", "horario": "Oficinas"},
                ],
            },
            {
                "nombre": "Policía Boliviana - La Paz",
                "municipio": "La Paz",
                "tipo": "Policía",
                "direccion": "Plaza Murillo, Zona Centro",
                "latitud": -16.4999,
                "longitud": -68.1339,
                "contactos": [
                    {"tipo": "Teléfono", "valor": "110", "horario": "24 horas"},
                ],
            },
            {
                "nombre": "COMI - Comité de Operaciones de Emergencia",
                "municipio": "La Paz",
                "tipo": "Gestión de Riesgos",
                "direccion": "Edificio Municipal, Zona Sopocachi",
                "latitud": -16.5032,
                "longitud": -68.1411,
                "contactos": [
                    {"tipo": "Teléfono", "valor": "800104040", "horario": "24 horas"},
                ],
            },
            {
                "nombre": "Red de Salud La Paz",
                "municipio": "La Paz",
                "tipo": "Salud",
                "direccion": "Av. Ejército, Zona Miraflores",
                "latitud": -16.5132,
                "longitud": -68.1234,
                "contactos": [
                    {"tipo": "Teléfono", "valor": "118", "horario": "Emergencias"},
                    {"tipo": "Teléfono", "valor": "2225678", "horario": "Oficinas"},
                ],
            },
            {
                "nombre": "Bomberos El Alto",
                "municipio": "El Alto",
                "tipo": "Bomberos",
                "direccion": "Av. 6 de Marzo, Zona Ceja",
                "latitud": -16.5200,
                "longitud": -68.1600,
                "contactos": [
                    {"tipo": "Teléfono", "valor": "119", "horario": "24 horas"},
                ],
            },
        ]

        for entidad_dato in entidades_datos:
            entidad, _ = EntidadEmergencia.objects.get_or_create(
                nombre_entidad=entidad_dato["nombre"],
                defaults={
                    "municipio": municipios[entidad_dato["municipio"]],
                    "tipo_entidad": entidad_dato["tipo"],
                    "direccion": entidad_dato["direccion"],
                    "latitud": entidad_dato["latitud"],
                    "longitud": entidad_dato["longitud"],
                    "es_activa": True,
                }
            )

            for contacto_dato in entidad_dato["contactos"]:
                ContactoEmergencia.objects.get_or_create(
                    entidad=entidad,
                    tipo_contacto=contacto_dato["tipo"],
                    valor_contacto=contacto_dato["valor"],
                    defaults={
                        "horario": contacto_dato.get("horario", ""),
                        "es_activo": True,
                    }
                )

        self.stdout.write(self.style.SUCCESS(
            "Carga inicial de STODDIE completada correctamente."
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