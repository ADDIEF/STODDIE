# Instrucciones del proyecto STODDIE

## Contexto

STODDIE es una aplicación móvil Android para prevención y reportes ciudadanos de riesgos naturales urbanos en Bolivia.

## Tecnologías obligatorias

- Aplicación móvil: React Native con Expo y JavaScript.
- Backend: Python con Django y Django REST Framework.
- Base de datos: PostgreSQL.
- Entorno local: Docker Compose.
- Administración: Django Admin.
- Control de versiones: Git.

## Reglas de desarrollo

1. Antes de modificar archivos, inspecciona la estructura existente.
2. Respeta el documento del proyecto y el modelo de datos aprobado.
3. No inventes funcionalidades fuera del alcance acordado.
4. No dupliques modelos, configuraciones, rutas ni dependencias.
5. Usa variables de entorno para credenciales y configuración sensible.
6. No guardes contraseñas de usuarios en texto plano ni implementes hashes manuales. Utiliza el sistema de autenticación de Django.
7. Configura el modelo de usuario personalizado antes de ejecutar las primeras migraciones.
8. Usa claves primarias, claves foráneas, restricciones e índices coherentes con el modelo aprobado.
9. No ejecutes migraciones destructivas ni elimines datos sin autorización.
10. No marques una tarea como terminada sin ejecutar las comprobaciones disponibles e informar los resultados.
11. Explica qué archivos creaste o modificaste y qué comandos debo ejecutar.
12. Trabaja por etapas y espera confirmación antes de avanzar a la siguiente etapa.
13. No expongas secretos en el código, los registros ni las respuestas.
14. No implementes inteligencia artificial predictiva, predicción de desastres ni alertas automáticas por umbrales: no forman parte del alcance aprobado.

## Alcance de la primera semana

- Preparar y verificar el entorno local.
- Configurar Django REST Framework y PostgreSQL.
- Implementar el modelo relacional aprobado de 18 tablas.
- Configurar usuarios, roles y autenticación inicial.
- Preparar los catálogos iniciales necesarios.
- Verificar la comunicación inicial entre la aplicación Expo y la API.

## Forma de trabajo

Realiza una sola etapa por vez. Antes de avanzar, muestra los archivos afectados, las decisiones relevantes, los comandos de validación y cualquier problema pendiente. No continúes a la siguiente etapa hasta recibir confirmación.
