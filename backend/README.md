# STODDIE backend

Django REST Framework API backed by PostgreSQL. API routes are versioned under
`/api/v1/`; the Django administration site remains at `/admin/`.

## Environment and local setup (Windows PowerShell)

From the repository root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d db
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
Set-Location .\backend\src
python manage.py check
```

The root `.env` is loaded by `config.settings` from the repository root. Start
from the repository root when using Compose so it reads the same file. The
process environment takes precedence over `.env`. Required settings are
listed with non-production placeholders in the root `.env.example`.
PostgreSQL stays on container port `5432`, published only to host loopback
port `5433` by default to avoid conflicts with local PostgreSQL on Windows.

## Docker

The root `compose.yaml` keeps one named PostgreSQL volume and offers separate
profiles:

```powershell
# Development server with source bind mount
docker compose --profile development up -d --build backend
docker compose ps
docker compose logs -f backend

# Stop without removing data or volumes
docker compose stop
```

PostgreSQL has a healthcheck; both backend profiles wait until it is healthy.
The development profile runs Django `runserver`. For a production-style
container, configure a strong secret key, real allowed hostnames and a TLS
reverse proxy before enabling the profile:

```powershell
docker compose --profile production up -d --build backend-production
```

The production image runs Gunicorn as a non-root user, without a source
bind-mount. It collects Django static assets at container startup and serves
them with WhiteNoise so Django Admin has its CSS and JavaScript. `DJANGO_DEBUG=False`
enables secure cookies and HTTPS redirection. Set HSTS only after verifying
the TLS deployment. The Docker build excludes
`.env`, `.git`, `.venv`, mobile dependencies, and documentation from its
context; runtime configuration is supplied through Compose environment
variables.

The existing schema migrations were applied before the API was added. The API
uses Django REST Framework's built-in `authtoken` app. Its four built-in
migrations have now been applied to the development database; no STODDIE model
migration was generated. On a fresh database, install the schema and token
table with:

```powershell
python manage.py migrate
```

The API implementation applied only the additive `authtoken` migrations to
the existing database. Do not use `flush`, remove the named database volume,
or recreate the database to install the token table.

Create an administrator when needed:

```powershell
python manage.py createsuperuser
```

For local development directly in the existing Python environment:

```powershell
python manage.py runserver 127.0.0.1:8000
```

For an Android emulator or physical device using local Django, bind to the
local network:

```powershell
python manage.py runserver 0.0.0.0:8000
```

Find the computer's LAN IPv4 address with `ipconfig`. Add that address to
`DJANGO_ALLOWED_HOSTS` in `.env` before device access. Permit port 8000 through
the Windows firewall only on the trusted development network.

## Authentication

The API uses Django REST Framework token authentication. Send the token on
private requests:

```http
Authorization: Token <token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register/` | Register a citizen and return a token |
| POST | `/api/v1/auth/login/` | Authenticate by email and return a token |
| POST | `/api/v1/auth/logout/` | Delete the current token |
| GET, PATCH | `/api/v1/auth/me/` | Read or update the authenticated user's names |

Registration accepts `email`, `password`, `first_name`, `segundo_nombre`,
`last_name`, and `apellido_materno`. Passwords are validated with Django's
configured password validators and saved through the custom user manager.
Registration assigns the documented `Ciudadano` business role. It does not
grant Django staff or superuser privileges. The API never serializes passwords
or password hashes.

DRF's built-in token keys do not expire automatically. Logout revokes the
current key; staff can also revoke a key by removing it in Django Admin. The
token table comes from the existing `rest_framework.authtoken` package; no
additional third-party dependency is used. Use HTTPS and a deliberate token
expiry/revocation policy before production deployment. Do not treat this
development configuration as production-ready.

## API endpoints

Private endpoints require a token except registration and login. Responses
from list endpoints are paginated (`count`, `next`, `previous`, `results`),
with 25 results per page. Search uses the `search` query parameter and
ordering uses `ordering` where supported.

| Method | Endpoint | Access and behavior |
| --- | --- | --- |
| GET | `/api/v1/accounts/roles/` | Authenticated, read-only business-role catalog |
| POST | `/api/v1/accounts/users/{id_usuario}/roles/` | Django staff only; assign an existing role using `{"id_rol": 1}` |
| GET | `/api/v1/geography/departments/` | Authenticated, read-only |
| GET | `/api/v1/geography/municipalities/?id_departamento=1` | Authenticated, read-only; optional department filter |
| GET | `/api/v1/geography/zones/?id_municipio=1` | Authenticated, read-only; optional municipality filter |
| GET | `/api/v1/risk-types/` | Authenticated, active risk types only |
| GET | `/api/v1/severity-levels/` | Authenticated, read-only |
| GET | `/api/v1/incident-statuses/` | Authenticated, read-only |
| GET, POST | `/api/v1/incidents/` | Authenticated; users list only their incidents; create sets owner and initial status on the server |
| GET, PATCH | `/api/v1/incidents/{id_incidente}/` | Owner or moderator; PATCH permits report content/location fields only |
| POST | `/api/v1/incidents/{id_incidente}/status/` | Django staff or business `Administrador`; updates status and writes history atomically |
| GET | `/api/v1/incidents/{id_incidente}/history/` | Incident owner or moderator |
| GET, POST | `/api/v1/incidents/{id_incidente}/comments/` | Django staff or business `Administrador`; moderation comments |
| GET | `/api/v1/prevention/categories/` | Authenticated, active categories only |
| GET | `/api/v1/prevention/guides/?id_categoria=1&id_tipo_riesgo=1` | Authenticated, active guides; filters optional |
| POST, DELETE | `/api/v1/prevention/guides/{id_guia}/risk-types/` | Django staff only; add with JSON `{"id_tipo_riesgo": 1}`, remove with query `?id_tipo_riesgo=1` |
| GET | `/api/v1/emergency/entities/?id_municipio=1` | Authenticated, active entities; municipality filter optional |
| GET | `/api/v1/emergency/contacts/?id_entidad=1` | Authenticated, active contacts; entity filter optional |
| GET | `/api/v1/weather/sources/` | Authenticated, active provider reference information only |

Incident creation accepts the scalar identifiers `tipo_riesgo`, optional
`nivel_severidad`, and optional `zona`, plus `descripcion`, `latitud`,
`longitud`, and optional `referencia_ubicacion`. The incident status must
already contain the documented `Pendiente` catalog entry; otherwise the API
returns `503` rather than inventing catalog data. Creation records the initial
state in `historial_estados`. Latitude and longitude are validated against
their geographic ranges.

An ordinary user can edit only incident description and location fields. The
API does not expose incident deletion. Status changes and administrative
comments are restricted to Django staff or users with the existing
`Administrador` business role. Role assignment itself is restricted to Django
staff. Django `Group` and permissions remain distinct from STODDIE business
roles.

Geography, catalogs, emergency references, prevention content, and weather
provider references are read-only through this API, except staff can maintain
guide/risk associations through the dedicated endpoint. Django Admin allows
staff to maintain catalog/reference rows. Incidents are not editable in Admin,
so moderation changes go through the audited API. The composite-key
`usuarios_roles` and `guias_tipos_riesgo` models are not registered directly
in Admin. No live weather-provider integration is implemented. No initial
reference catalog rows (other than the citizen role created during
registration) are generated automatically.

## Expo development connection

The mobile API client uses `EXPO_PUBLIC_API_URL` from `mobile/.env.local` when
provided. Otherwise, it defaults to `http://10.0.2.2:8000/api/v1` on Android
and `http://127.0.0.1:8000/api/v1` on iOS Simulator/Expo Web. Copy
`mobile/.env.example` to `mobile/.env.local` and set a LAN URL for a physical
device. Run the backend bound to `0.0.0.0:8000`, add the host to Django's
`DJANGO_ALLOWED_HOSTS`, and allow the port on the trusted local firewall.

The reusable HTTP client attaches `Authorization: Token <token>`, encodes JSON,
times out requests, and exposes structured HTTP errors. On iOS/Android, tokens
are stored using Expo SecureStore. On web, tokens remain in memory only because
native SecureStore is not available there. Native React Native requests do not
use browser CORS; Expo Web requests are limited by `CORS_ALLOWED_ORIGINS`.

The app screen remains the Expo starter; this client setup does not claim that
the app UI or a device-to-backend request has been exercised.

Example login payload:

```json
{
  "email": "citizen@example.test",
  "password": "<user password>"
}
```

The response contains a `token` and a safe `user` object. Do not commit tokens
or real credentials.

## Tests and checks

From `backend\src`:

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

`manage.py test` creates and destroys a dedicated test database; it does not
apply tests to the development database. The migration dry-run reports model
state only and does not create migration files.

The Django test runner creates and destroys an isolated test database. It does
not use the development database for test writes. The checks above do not apply
new migrations to the development database.

## Configuration and known constraints

- Database access uses `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `DB_HOST`, and `DB_PORT` from the root `.env`.
- `CORS_ALLOWED_ORIGINS` may be set as a comma-separated environment variable;
  development defaults cover `localhost:8081` and `127.0.0.1:8081`.
- `USE_TZ=True` is retained. PostgreSQL timestamps therefore use timezone-aware
  semantics.
- Django 5.2 cannot register models with composite primary keys in the Admin.
  `usuarios_roles` and `guias_tipos_riesgo` retain the approved composite keys;
  role assignment is exposed through the staff-only API instead.
- `fuentes_meteorologicas.id_usuario_registro` remains required as specified in
  the DBML; its consistency with the project report still requires checking.
- The project report PDF has not been machine-readable in this workspace; the
  DBML is the structural source used for these API mappings.
