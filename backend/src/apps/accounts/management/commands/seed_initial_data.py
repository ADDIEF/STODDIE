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
        # 9 DEPARTAMENTOS DE BOLIVIA (con coordenadas aproximadas para clima/mapa)
        # =====================================================================
        departamentos_datos = [
            {"nombre": "La Paz", "latitud": -16.5, "longitud": -68.1,
             "municipios": [
                 {"nombre": "La Paz", "zonas": ["Centro", "Sopocachi", "Miraflores", "Obrajes", "Calacoto", "Achumani", "San Pedro", "Tembladerani", "Villa Fátima", "Achachicala"]},
                 {"nombre": "El Alto", "zonas": ["Ceja", "Ciudad Satélite", "Senkata", "Villa 1ro de Mayo", "Villa Ingenio"]},
                 {"nombre": "Viacha", "zonas": ["Central", "San Pedro", "Villa Nueva"]},
             ]},
            {"nombre": "Santa Cruz", "latitud": -17.8, "longitud": -63.1,
             "municipios": [
                 {"nombre": "Santa Cruz de la Sierra", "zonas": ["Plan 3000", "Los Tajibos", "Urubó", "Cañada", "Villa Primero de Mayo"]},
                 {"nombre": "Warnes", "zonas": ["Central", "Villa Bolívar", "San Pedro"]},
                 {"nombre": "Montero", "zonas": ["Centro", "Villa América", "San Miguel"]},
             ]},
            {"nombre": "Cochabamba", "latitud": -17.4, "longitud": -66.1,
             "municipios": [
                 {"nombre": "Cochabamba", "zonas": ["Ciudadela", "Cala Cala", "Villa Pagador", "Villa América", "San Antonio"]},
                 {"nombre": "Quillacollo", "zonas": ["Centro", "Villa Pagador", "Villa América"]},
                 {"nombre": "Sacaba", "zonas": ["Centro", "Villa Primero de Mayo", "San Pedro"]},
             ]},
            {"nombre": "Oruro", "latitud": -17.97, "longitud": -67.1,
             "municipios": [
                 {"nombre": "Oruro", "zonas": ["San Pedro", "1ro de Mayo", "Villa Constituyente", "Villa San José", "Central"]},
                 {"nombre": "Challapata", "zonas": ["Centro", "Villa Primero de Mayo", "San Pedro"]},
                 {"nombre": "Sabaya", "zonas": ["Central", "Villa Nueva", "San Pedro"]},
             ]},
            {"nombre": "Potosí", "latitud": -19.58, "longitud": -65.75,
             "municipios": [
                 {"nombre": "Potosí", "zonas": ["San Antonio", "Central", "Yura", "Villa Primero de Mayo", "San Pedro"]},
                 {"nombre": "Tupiza", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                 {"nombre": "Villazón", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
             ]},
            {"nombre": "Chuquisaca", "latitud": -19.05, "longitud": -65.25,
             "municipios": [
                 {"nombre": "Sucre", "zonas": ["Recoleta", "Molino", "San Roque", "Villa Primero de Mayo", "Central"]},
                 {"nombre": "Yamparáez", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                 {"nombre": "Zudáñez", "zonas": ["Central", "Villa Nueva", "San Roque"]},
             ]},
            {"nombre": "Tarija", "latitud": -21.53, "longitud": -64.73,
             "municipios": [
                 {"nombre": "Tarija", "zonas": ["Los Álamos", "La Toma", "Central", "Villa Primero de Mayo", "San Pedro"]},
                 {"nombre": "Bermejo", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                 {"nombre": "Villa Montes", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
             ]},
            {"nombre": "Pando", "latitud": -11.0, "longitud": -67.0,
             "municipios": [
                 {"nombre": "Cobija", "zonas": ["Centro", "1ro de Mayo", "Bella Flor", "San Pedro", "Villa Nueva"]},
                 {"nombre": "Filadelfia", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                 {"nombre": "Puerto Rico", "zonas": ["Central", "Villa Nueva", "San Roque"]},
             ]},
            {"nombre": "Beni", "latitud": -15.0, "longitud": -65.0,
             "municipios": [
                 {"nombre": "Trinidad", "zonas": ["Central", "1ro de Mayo", "San Roque", "Villa Primero de Mayo", "San Pedro"]},
                 {"nombre": "Rurrenabaque", "zonas": ["Centro", "Villa Nueva", "San Pedro"]},
                 {"nombre": "San Ignacio", "zonas": ["Centro", "Villa Primero de Mayo", "San José"]},
             ]},
        ]

        departamentos_db = {}
        municipios_db = {}

        for dep_data in departamentos_datos:
            departamento, created = Departamento.objects.get_or_create(
                nombre_departamento=dep_data["nombre"],
                defaults={"latitud": dep_data["latitud"], "longitud": dep_data["longitud"]},
            )
            # Actualizar coordenadas si ya existía
            if departamento.latitud != dep_data["latitud"] or departamento.longitud != dep_data["longitud"]:
                departamento.latitud = dep_data["latitud"]
                departamento.longitud = dep_data["longitud"]
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
        # ENTIDADES Y CONTACTOS DE EMERGENCIA (por departamento)
        # =====================================================================

        entidades_datos_por_dep = {
            "La Paz": [
                {"nombre": "Bomberos Unidad La Paz", "municipio": "La Paz", "tipo": "Bomberos", "direccion": "Av. 6 de Agosto, Zona Centro", "lat": -16.4991, "lon": -68.1349, "contactos": [{"tipo": "Teléfono", "valor": "119", "horario": "24 horas"}]},
                {"nombre": "Policía Boliviana - La Paz", "municipio": "La Paz", "tipo": "Policía", "direccion": "Plaza Murillo, Zona Centro", "lat": -16.4999, "lon": -68.1339, "contactos": [{"tipo": "Teléfono", "valor": "110", "horario": "24 horas"}]},
                {"nombre": "COMI - La Paz", "municipio": "La Paz", "tipo": "Gestión de Riesgos", "direccion": "Edificio Municipal, Zona Sopocachi", "lat": -16.5032, "lon": -68.1411, "contactos": [{"tipo": "Teléfono", "valor": "800104040", "horario": "24 horas"}]},
                {"nombre": "Red de Salud La Paz", "municipio": "La Paz", "tipo": "Salud", "direccion": "Av. Ejército, Zona Miraflores", "lat": -16.5132, "lon": -68.1234, "contactos": [{"tipo": "Teléfono", "valor": "118", "horario": "Emergencias"}, {"tipo": "Teléfono", "valor": "2225678", "horario": "Oficinas"}]},
            ],
            "Santa Cruz": [
                {"nombre": "Bomberos Unidad Santa Cruz", "municipio": "Santa Cruz de la Sierra", "tipo": "Bomberos", "direccion": "Av. Radial, Zona Plan 3000", "lat": -17.78, "lon": -63.18, "contactos": [{"tipo": "Teléfono", "valor": "119", "horario": "24 horas"}]},
                {"nombre": "Policía Boliviana - Santa Cruz", "municipio": "Santa Cruz de la Sierra", "tipo": "Policía", "direccion": "Plaza 24 de Septiembre, Zona Centro", "lat": -17.79, "lon": -63.19, "contactos": [{"tipo": "Teléfono", "valor": "110", "horario": "24 horas"}]},
                {"nombre": "COMI - Santa Cruz", "municipio": "Santa Cruz de la Sierra", "tipo": "Gestión de Riesgos", "direccion": "Gobernación, Zona Centro", "lat": -17.79, "lon": -63.18, "contactos": [{"tipo": "Teléfono", "valor": "800104040", "horario": "24 horas"}]},
                {"nombre": "Red de Salud Santa Cruz", "municipio": "Santa Cruz de la Sierra", "tipo": "Salud", "direccion": "Av. Virgen de Cotoca, Zona Los Tajibos", "lat": -17.8, "lon": -63.17, "contactos": [{"tipo": "Teléfono", "valor": "118", "horario": "Emergencias"}, {"tipo": "Teléfono", "valor": "3334567", "horario": "Oficinas"}]},
            ],
        }

        for dep_nombre, entidades_lista in entidades_datos_por_dep.items():
            if dep_nombre not in departamentos_db:
                continue
            departamento = departamentos_db[dep_nombre]

            for entidad_dato in entidades_lista:
                municipio_obj = None
                for mun_key, mun_obj in municipios_db.items():
                    if mun_obj.departamento_id == departamento.id and mun_obj.nombre_municipio == entidad_dato["municipio"]:
                        municipio_obj = mun_obj
                        break
                if not municipio_obj:
                    continue

                entidad, _ = EntidadEmergencia.objects.get_or_create(
                    nombre_entidad=entidad_dato["nombre"],
                    defaults={
                        "municipio": municipio_obj,
                        "tipo_entidad": entidad_dato["tipo"],
                        "direccion": entidad_dato["direccion"],
                        "latitud": entidad_dato["lat"],
                        "longitud": entidad_dato["lon"],
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
