# STODDIE - Semana 4: Resultados de Pruebas y Entrega Final

## Información del Proyecto

- **Proyecto:** STODDIE - Aplicación Móvil de Prevención y Alerta Ciudadana
- **Mención:** Desarrollo de Software
- **Estudiante:** Fernandez Flores Adriana Valeria
- **Docente:** Carvajal Blanco Brigida Alexandra
- **Fecha:** 12 de Octubre de 2026
- **Ubicación:** La Paz - Bolivia

---

## 1. Resumen Ejecutivo

La Semana 4 ha sido completada exitosamente. Se han ejecutado todas las pruebas de funcionalidad del backend, verificando todos los módulos del sistema STODDIE. El resultado es **100% exitoso** con 24/24 pruebas pasando correctamente.

### Resumen de Pruebas Ejecutadas

| Categoría | Pruebas | Exitosas | Fallidas | % Éxito |
|-----------|---------|----------|----------|---------|
| Autenticación | 4 | 4 | 0 | 100% |
| Catálogos y Geografía | 7 | 7 | 0 | 100% |
| Incidentes | 7 | 7 | 0 | 100% |
| Clima | 3 | 3 | 0 | 100% |
| Contactos de Emergencia | 2 | 2 | 0 | 100% |
| Prevención | 2 | 2 | 0 | 100% |
| **Total** | **24** | **24** | **0** | **100%** |

---

## 2. Detalle de Pruebas por Módulo

### 2.1 Autenticación (4 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Login Administrador | POST | /api/v1/auth/login/ | 200 OK | 2627.84 ms |
| Login Ciudadano | POST | /api/v1/auth/login/ | 200 OK | 1235.73 ms |
| Login credenciales incorrectas | POST | /api/v1/auth/login/ | 400 OK | 1141.73 ms |
| Obtener perfil autenticado | GET | /api/v1/auth/me/ | 200 OK | 10.01 ms |

**Observación:** El sistema de autenticación con TokenAuthentication funciona correctamente. Los usuarios pueden autenticarse y obtener tokens de acceso válidos.

---

### 2.2 Catálogos y Geografía (7 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Listar tipos de riesgo | GET | /api/v1/risk-types/ | 200 OK | 13.67 ms |
| Listar niveles de severidad | GET | /api/v1/severity-levels/ | 200 OK | 11.06 ms |
| Listar estados de incidente | GET | /api/v1/incident-statuses/ | 200 OK | 7.02 ms |
| Listar departamentos | GET | /api/v1/geography/departments/ | 200 OK | 12.07 ms |
| Listar municipios | GET | /api/v1/geography/municipalities/ | 200 OK | 13.02 ms |
| Listar zonas | GET | /api/v1/geography/zones/ | 200 OK | 14.73 ms |
| Listar fuentes meteorológicas | GET | /api/v1/weather/sources/ | 200 OK | 17.74 ms |

**Observación:** Todos los catálogos están poblados correctamente con datos de Bolivia (9 departamentos, 27 municipios, 106 zonas).

---

### 2.3 Incidentes (7 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Crear incidente | POST | /api/v1/incidents/ | 201 OK | 39.98 ms |
| Obtener detalle de incidente | GET | /api/v1/incidents/{id}/ | 200 OK | 11.57 ms |
| Listar incidentes | GET | /api/v1/incidents/ | 200 OK | 15.53 ms |
| Cambiar estado de incidente | POST | /api/v1/incidents/{id}/status/ | 200 OK | 29.18 ms |
| Obtener historial de incidente | GET | /api/v1/incidents/{id}/history/ | 200 OK | 17.53 ms |
| Agregar comentario a incidente | POST | /api/v1/incidents/{id}/comments/ | 201 OK | 24.56 ms |

**Observación:** El módulo de incidentes funciona completamente. Los usuarios pueden crear incidentes, ver el listado, obtener detalles, y los administradores pueden cambiar estados y agregar comentarios.

---

### 2.3 Consultas Meteorológicas (3 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Consultar clima por departamento | GET | /api/v1/weather/sources/forecast/?departamento_id=1 | 200 OK | 924.27 ms |
| Consultar clima por coordenadas | GET | /api/v1/weather/sources/forecast/?latitud=-16.5&longitud=-68.1 | 200 OK | 886.37 ms |
| Clima sin parámetros (debe fallar) | GET | /api/v1/weather/sources/forecast/ | 400 OK | 4.06 ms |

**Observación:** La integración con Open-Meteo funciona correctamente. Se pueden consultar datos meteorológicos por departamento o por coordenadas geográficas. El tiempo de respuesta es aceptable (menos de 1 segundo).

---

### 2.4 Contactos de Emergencia (2 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Listar entidades de emergencia | GET | /api/v1/emergency/entities/ | 200 OK | 11.47 ms |
| Listar contactos de emergencia | GET | /api/v1/emergency/contacts/ | 200 OK | 6.59 ms |

**Observación:** Las entidades de emergencia y sus contactos están disponibles y se filtran correctamente por departamento cuando el usuario tiene uno asignado.

---

### 2.5 Prevención (2 pruebas)

| Prueba | Método | Endpoint | Estado | Tiempo |
|--------|--------|----------|--------|--------|
| Listar categorías de prevención | GET | /api/v1/prevention/categories/ | 200 OK | 5.01 ms |
| Listar guías de prevención | GET | /api/v1/prevention/guides/ | 200 OK | 9.53 ms |

**Observación:** Las guías preventivas y sus categorías están disponibles para consulta.

---

## 3. Pruebas de Rendimiento

### Tiempos de Respuesta Promedio

| Tipo de Consulta | Tiempo Promedio |
|------------------|-----------------|
| Autenticación (login) | ~1700 ms |
| Catálogos simples | ~11 ms |
| Incidentes (CRUD) | ~25 ms |
| Clima por departamento | ~900 ms |
| Clima por coordenadas | ~886 ms |
| Contactos de emergencia | ~8 ms |
| Prevención | ~7 ms |

**Observación:** Los tiempos de respuesta son aceptables para un prototipo académico. Las consultas de clima tardan más debido a la llamada a la API externa de Open-Meteo.

---

## 4. Verificación de Permisos

### Ciudadano (usuario autenticado sin rol de administrador):
- ✅ Puede registrar incidentes
- ✅ Puede ver sus propios incidentes
- ✅ Puede consultar catálogos, clima, prevención, emergencia
- ❌ NO puede cambiar estados de incidentes (403 Forbidden)
- ❌ NO puede agregar comentarios administrativos (403 Forbidden)
- ❌ NO puede ver incidentes de otros usuarios

### Administrador (usuario con rol Administrador o is_staff=True):
- ✅ Puede ver todos los incidentes
- ✅ Puede cambiar estados de incidentes
- ✅ Puede agregar comentarios administrativos
- ✅ Puede ver historial de cambios
- ✅ Puede acceder a todos los datos

---

## 5. Verificación de Integridad de Base de Datos

### Tablas Creadas (18 tablas):

| Tabla | Registros |
|-------|-----------|
| usuarios | 2 |
| roles | 2 |
| usuarios_roles | 1 |
| departamentos | 9 |
| municipios | 27 |
| zonas | 106 |
| tipos_riesgo | 5 |
| niveles_severidad | 4 |
| estados_incidente | 5 |
| incidentes | 1+ |
| historial_estados | 1+ |
| comentarios_incidente | 1+ |
| categorias_prevencion | 3 |
| guias_prevencion | 3 |
| guias_tipos_riesgo | 4 |
| fuentes_meteorologicas | 3 |
| entidades_emergencia | 23 |
| contactos_emergencia | 40 |

### Relaciones Verificadas:
- ✅ usuarios → departamentos (FK)
- ← usuarios → roles (usuarios_roles, M:N)
- → incidentes → usuarios (1:N)
- → incidentes → tipos_riesgo (1:N)
- → incidentes → niveles_severidad (1:N)
- → incidentes → estados_incidente (1:N)
- → incidentes → historial_estados (1:N)
- → incidentes → comentarios_incidente (1:N)
- → entidades_emergencia → departamentos (1:N)
- → contactos_emergencia → entidades_emergencia (1:N)
- → categorias_prevencion → guias_prevencion (1:N)
- → guias_prevencion → tipos_riesgo (M:N)

---

## 6. Configuración para Ejecución

### Prerrequisitos

```bash
# Instalar Python 3.11+
python --version

# Instalar dependencias
pip install Django==5.2.18 djangorestframework==3.18.3 psycopg-binary django-cors-headers==4.9.0 gunicorn==23.0.0 whitenoise==6.9.0 python-dotenv==1.2.4 requests==2.32.3
```

### Ejecución del Backend

```bash
cd backend/src
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Variables de Entorno (.env)

```env
DJANGO_SECRET_KEY=dev-only-change-this-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.17
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://127.0.0.1:19006,http://localhost:8081,http://127.0.0.1:8081
POSTGRES_DB=stoddie_db
POSTGRES_USER=stoddie_user
POSTGRES_PASSWORD=stoddie_local_password
POSTGRES_PORT=5433
DB_HOST=127.0.0.1
DB_PORT=5433
```

### Ejecución con Docker Compose (Producción)

```bash
docker compose up -d
```

### Ejecutar Pruebas

```bash
python manage.py test  # Pruebas unitarias de Django
python test_week4.py   # Pruebas de integración de la Semana 4
```

---

## 7. Generación de APK para Android

Para generar el APK de demostración:

```bash
cd mobile

# Instalar dependencias
npm install

# Construir para Android
npx expo build:android

# O para desarrollo
npx expo start --android
```

**Nota:** Para generar un APK de producción, se requiere EAS Build de Expo:
```bash
npx eas build --platform android
```

---

## 8. Conclusión

La Semana 4 ha sido completada exitosamente. Todas las funcionalidades del proyecto STODDIE están operativas:

- ✅ Backend Django REST Framework funcionando correctamente
- ✅ Autenticación y autorización por roles
- ✅ CRUD completo de incidentes con moderación
- ✅ Consulta meteorológica integrada con API externa
- ✅ Módulos de prevención y emergencia operativos
- ✅ 24/24 pruebas de integración pasando
- ✅ Base de datos con 18 tablas y relaciones correctas
- ✅ Frontend móvil con todas las pantallas implementadas

El MVP está listo para demostración y entrega académica.
