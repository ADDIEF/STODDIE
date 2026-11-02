# STODDIE

STODDIE is a citizen-reporting and urban risk-prevention prototype. It is
intended to support reporting incidents associated with natural hazards and
accessing prevention, geographic, emergency-reference, and weather-provider
information.

## Project objective

The project aims to provide a mobile application connected to a REST API and a
relational database, supporting citizen incident reports and access to
information useful for urban risk prevention. The current repository contains
the initial backend/API and data model, plus an Expo client prepared for
connectivity checks; it does not yet contain the final mobile product
interfaces.

## Architecture and technologies

- **Mobile:** React Native with Expo in `mobile/`.
- **Backend:** Django and Django REST Framework in `backend/src/`.
- **Database:** PostgreSQL 16, run through Docker Compose.
- **Administration:** Django Admin at `/admin/`.
- **Containers:** `compose.yaml` and the multi-stage `backend/Dockerfile`.
- **API:** versioned under `/api/v1/`; private endpoints use DRF token
  authentication.

The backend is organized into six Django applications: `accounts`,
`geography`, `incidents`, `prevention`, `emergency`, and `weather`.
The relational model is documented in
[`docs/STODDIE_modelodb.dbml`](docs/STODDIE_modelodb.dbml).

## Repository structure

```text
.
├── backend/
│   ├── src/
│   │   ├── apps/       # Django business applications and migrations
│   │   └── config/     # Django settings and project URLs
│   ├── Dockerfile
│   ├── README.md
│   └── requirements.txt
├── docs/               # DBML and database-model documentation
├── documentacion/
│   └── evidencias/     # Project evidence; review images for personal data
├── mobile/
│   ├── src/            # API client, token storage, and API configuration
│   ├── App.js
│   ├── app.json
│   └── package.json
├── compose.yaml
├── .env.example
└── README.md
```

The current `mobile/App.js` is a **temporary connectivity-diagnostic screen**.
It is not the final STODDIE interface and does not provide completed login,
registration, or incident-reporting screens. When it receives HTTP 401, the
screen reports that the protected API is reachable; this does not demonstrate
an authenticated request or a database read from the phone.

## Requirements and environment

- Docker Desktop with the Linux container engine.
- Python 3.11 for local backend development.
- Node.js/npm compatible with the Expo SDK declared in `mobile/package.json`.

From Windows PowerShell at the repository root, create a local environment
file only if one is not already present:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Set a unique local Django secret and PostgreSQL password in `.env`. Do not
overwrite an existing environment file or commit `.env`; the example file
contains placeholders only. PostgreSQL uses container port `5432` and is
published to host loopback at `127.0.0.1:${POSTGRES_PORT}` (default `5433`).
Inside Compose, Django reaches the database through the `db` service.

## Run the backend with Docker Compose

From the repository root:

```powershell
docker compose up -d db
docker compose --profile development up -d --build backend
docker compose ps
docker compose logs -f backend
```

For a new local database, apply the schema and create an administrative
account explicitly:

```powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

The initial-data command is not run automatically. Its current implementation
expects an administrator account matching an email configured in the command;
it does not create that account. Review that prerequisite before running:

```powershell
docker compose exec backend python manage.py seed_initial_data
```

The test runner uses its isolated test database. Do not use `flush` or remove
the persistent `stoddie_postgres_data` volume as part of normal setup.
`docker compose stop` stops services without deleting the volume. Avoid
`docker compose down -v`.

For local Django development outside Docker, create/activate the Python
environment and install the listed requirements:

```powershell
if (-not (Test-Path .\backend\.venv\Scripts\python.exe)) {
    py -3.11 -m venv .\backend\.venv
}
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
Set-Location .\backend\src
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

## Production-style container

The Dockerfile also defines a production target using Gunicorn. Before using
it, configure a strong production `DJANGO_SECRET_KEY`, real
`DJANGO_ALLOWED_HOSTS`, and deployment-specific environment values, and place
the service behind a trusted TLS reverse proxy:

```powershell
docker compose --profile production up -d --build backend-production
```

The production image runs as a non-root user, has no source bind mount, and
rejects weak secret keys and wildcard hosts. HTTPS redirection is enabled
when `DJANGO_DEBUG=False`. Enable HSTS only after HTTPS is correctly deployed.
This configuration is not, by itself, evidence of a production deployment.

## API and current backend scope

The versioned index is `GET /api/v1/`. Registration and login are public;
private endpoints use Django REST Framework token authentication:

```http
Authorization: Token <token>
```

The implemented API includes authentication/profile, role lookup and staff
role assignment, geography, incident reporting/moderation/history/comments,
prevention catalogs and staff guide-risk associations, emergency references,
and weather-source references. Most catalogs are read-only through the API
and are maintained through Django Admin. A live weather forecast integration
is not implemented. Tokens do not expire automatically by default; define an
expiry and revocation policy before public deployment. See
[`backend/README.md`](backend/README.md) for routes, permissions, examples,
and detailed backend setup.

## Run the Expo mobile client

```powershell
Set-Location .\mobile
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env.local` only when overriding the
default. The client uses `10.0.2.2` for Android Emulator and `127.0.0.1` for
iOS Simulator/Expo Web. A physical phone needs the development computer's LAN
address, for example `http://192.168.1.25:8000/api/v1`. The backend must be
reachable on the local network; allow the address through
`DJANGO_ALLOWED_HOSTS` and the local firewall as appropriate. When running
Django directly for a phone, bind it to the network interface:

```powershell
python manage.py runserver 0.0.0.0:8000
```

Native token storage uses Expo SecureStore. Web tokens remain in memory and
are not persisted. The current app screen only checks API reachability; it is
not a completed mobile workflow.

## Documentation and publication notes

- Keep `.env` files, virtual environments, installed dependencies, local
  databases, and generated files out of source control.
- The project DBML is in `docs/`. Review evidence images for personal data or
  machine-specific paths before publishing them.
- The updated Week 1–2 DOCX report is intentionally kept local and excluded
  from GitHub because its cover contains personal names. The older Week 1
  Markdown report is not part of the project and should not be restored.
- The project-requirements PDF is not included in the repository pending
  content and publication-permission review.
