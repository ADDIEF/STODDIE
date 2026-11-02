FROM python:3.11-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:${PATH}"

RUN groupadd --system stoddie \
    && useradd --system --gid stoddie --create-home stoddie

WORKDIR /app
COPY --from=builder /install /usr/local
COPY --chown=stoddie:stoddie backend/src ./src
RUN mkdir -p /app/src/staticfiles \
    && chown stoddie:stoddie /app/src/staticfiles
WORKDIR /app/src

USER stoddie
EXPOSE 8000


FROM runtime AS development

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


FROM runtime AS production

CMD ["sh", "-c", "python manage.py collectstatic --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --access-logfile - --error-logfile -"]
