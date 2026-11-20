#!/usr/bin/env python
"""
Script de pruebas para la Semana 4 - STODDIE
Prueba todos los endpoints del backend y documenta los resultados.
"""
import os
import sys
import django
import json
import time
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()

# Crear cliente de prueba
client = Client()

# Resultados de pruebas
resultados = []

def probar(nombre, metodo, url, datos=None, expected_status=200, headers=None):
    """Ejecuta una prueba y registra el resultado"""
    inicio = time.time()
    try:
        if metodo == 'GET':
            response = client.get(url, headers=headers or {})
        elif metodo == 'POST':
            response = client.post(url, data=json.dumps(datos or {}),
                                  content_type='application/json',
                                  headers=headers or {})
        elif metodo == 'PUT':
            response = client.put(url, data=json.dumps(datos or {}),
                                  content_type='application/json',
                                  headers=headers or {})
        elif metodo == 'PATCH':
            response = client.patch(url, data=json.dumps(datos or {}),
                                   content_type='application/json',
                                   headers=headers or {})
        elif metodo == 'DELETE':
            response = client.delete(url, headers=headers or {})
        
        tiempo = round((time.time() - inicio) * 1000, 2)
        exitoso = response.status_code == expected_status
        
        resultado = {
            'prueba': nombre,
            'metodo': metodo,
            'url': url,
            'estado_esperado': expected_status,
            'estado_obtenido': response.status_code,
            'tiempo_ms': tiempo,
            'exitoso': exitoso,
            'mensaje': str(response.data if hasattr(response, 'data') else response.content.decode())[:200]
        }
        resultados.append(resultado)
        
        estado_str = "OK" if exitoso else f"FALLO ({response.status_code})"
        print(f"  [{estado_str}] {nombre} ({tiempo}ms)")
        if not exitoso:
            print(f"    Respuesta: {resultado['mensaje'][:200]}")
        
        return exitoso, response
        
    except Exception as e:
        tiempo = round((time.time() - inicio) * 1000, 2)
        resultado = {
            'prueba': nombre,
            'metodo': metodo,
            'url': url,
            'estado_esperado': expected_status,
            'estado_obtenido': 'ERROR',
            'tiempo_ms': tiempo,
            'exitoso': False,
            'mensaje': str(e)
        }
        resultados.append(resultado)
        print(f"  [ERROR] {nombre}: {str(e)[:200]}")
        return False, None

print("=" * 70)
print("PRUEBAS SEMANA 4 - STODDIE")
print("=" * 70)

# ============================================
# 1. PRUEBAS DE AUTENTICACION
# ============================================
print("\nPRUEBAS DE AUTENTICACION")
print("-" * 50)

# Crear usuario de prueba
from django.contrib.auth import get_user_model
User = get_user_model()

# Crear usuario admin si no existe
try:
    admin = User.objects.get(email='admin@stoddie.local')
except User.DoesNotExist:
    admin = User.objects.create_superuser(
        email='admin@stoddie.local',
        password='Admin123!',
        first_name='Admin',
        last_name='Sistema'
    )
    print("Usuario admin creado")

# Crear ciudadano de prueba
try:
    ciudadano = User.objects.get(email='ciudadano@test.com')
except User.DoesNotExist:
    ciudadano = User.objects.create_user(
        email='ciudadano@test.com',
        password='TestPass123',
        first_name='Juan',
        last_name='Perez'
    )
    print("Usuario ciudadano creado")

# Test login admin
exito, resp = probar(
    "Login Administrador",
    "POST",
    "/api/v1/auth/login/",
    {"email": "admin@stoddie.local", "password": "Admin123!"},
    200
)
token_admin = resp.data.get('token') if resp and hasattr(resp, 'data') else None

# Test login ciudadano
exito, resp = probar(
    "Login Ciudadano",
    "POST",
    "/api/v1/auth/login/",
    {"email": "ciudadano@test.com", "password": "TestPass123"},
    200
)
token_ciudadano = resp.data.get('token') if resp and hasattr(resp, 'data') else None

# Test login con credenciales incorrectas
exito, resp = probar(
    "Login credenciales incorrectas",
    "POST",
    "/api/v1/auth/login/",
    {"email": "admin@stoddie.local", "password": "wrong"},
    400
)

# Test obtener perfil
exito, resp = probar(
    "Obtener perfil autenticado",
    "GET",
    "/api/v1/auth/me/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

print("\n" + "=" * 70)
print("PRUEBAS DE CATALOGOS Y GESTION DE DATOS")
print("-" * 50)

# Test catalogos
exito, resp = probar(
    "Listar tipos de riesgo",
    "GET",
    "/api/v1/risk-types/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

exito, resp = probar(
    "Listar niveles de severidad",
    "GET",
    "/api/v1/severity-levels/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

exito, resp = probar(
    "Listar estados de incidente",
    "GET",
    "/api/v1/incident-statuses/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

# Test geografia
exito, resp = probar(
    "Listar departamentos",
    "GET",
    "/api/v1/geography/departments/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

exito, resp = probar(
    "Listar municipios",
    "GET",
    "/api/v1/geography/municipalities/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

exito, resp = probar(
    "Listar zonas",
    "GET",
    "/api/v1/geography/zones/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

# Test fuentes meteorologicas
exito, resp = probar(
    "Listar fuentes meteorologicas",
    "GET",
    "/api/v1/weather/sources/",
    headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
)

print("\n" + "=" * 70)
print("PRUEBAS DE INCIDENTES")
print("-" * 50)

# Obtener un tipo de riesgo y una zona para crear incidente
from apps.incidents.models import TipoRiesgo, EstadoIncidente
from apps.geography.models import Zona as ZonaModel

try:
    tipo_riesgo = TipoRiesgo.objects.first()
    estado_pendiente = EstadoIncidente.objects.get(nombre_estado='Pendiente')
    zona = ZonaModel.objects.first()
except Exception as e:
    print(f"Error obteniendo datos de prueba: {e}")
    tipo_riesgo = None
    estado_pendiente = None
    zona = None

if tipo_riesgo:
    exito, resp_inc = probar(
        "Crear incidente",
        "POST",
        "/api/v1/incidents/",
        {
            "tipo_riesgo": tipo_riesgo.id,
            "descripcion": "Prueba de incidente para Semana 4",
            "latitud": -16.5,
            "longitud": -68.1,
            "referencia_ubicacion": "Prueba automatica"
        },
        201,
        headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
    )
    
    id_incidente = resp_inc.data.get('id_incidente') if resp_inc and hasattr(resp_inc, 'data') else None
    
    if id_incidente:
        # Test obtener detalle
        exito, resp = probar(
            "Obtener detalle de incidente",
            "GET",
            f"/api/v1/incidents/{id_incidente}/",
            headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
        )
        
        # Test listar incidentes
        exito, resp = probar(
            "Listar incidentes",
            "GET",
            "/api/v1/incidents/",
            headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
        )
        
        # Test cambiar estado (solo admin)
        if token_admin:
            exito, resp = probar(
                "Cambiar estado de incidente",
                "POST",
                f"/api/v1/incidents/{id_incidente}/status/",
                {"id_estado": 3},  # Confirmado
                200,
                headers={'Authorization': f'Token {token_admin}'}
            )
            
            # Test historial
            exito, resp = probar(
                "Obtener historial de incidente",
                "GET",
                f"/api/v1/incidents/{id_incidente}/history/",
                headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
            )
            
            # Test comentarios
            exito, resp = probar(
                "Agregar comentario a incidente",
                "POST",
                f"/api/v1/incidents/{id_incidente}/comments/",
                {"comentario": "Comentario de prueba"},
                201,
                headers={'Authorization': f'Token {token_admin}'} if token_admin else {}
            )

# Test clima
print("\n" + "=" * 70)
print("PRUEBAS DE CLIMA")
print("-" * 50)

exito, resp = probar(
    "Consultar clima por departamento",
    "GET",
    "/api/v1/weather/sources/forecast/?departamento_id=1",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

exito, resp = probar(
    "Consultar clima por coordenadas",
    "GET",
    "/api/v1/weather/sources/forecast/?latitud=-16.5&longitud=-68.1",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

exito, resp = probar(
    "Clima sin parametros (debe fallar)",
    "GET",
    "/api/v1/weather/sources/forecast/",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {},
    expected_status=400
)

print("\n" + "=" * 70)
print("PRUEBAS DE CONTACTOS DE EMERGENCIA")
print("-" * 50)

exito, resp = probar(
    "Listar entidades de emergencia",
    "GET",
    "/api/v1/emergency/entities/",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

exito, resp = probar(
    "Listar contactos de emergencia",
    "GET",
    "/api/v1/emergency/contacts/",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

print("\n" + "=" * 70)
print("PRUEBAS DE PREVENCION")
print("-" * 50)

exito, resp = probar(
    "Listar categorias de prevencion",
    "GET",
    "/api/v1/prevention/categories/",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

exito, resp = probar(
    "Listar guias de prevencion",
    "GET",
    "/api/v1/prevention/guides/",
    headers={'Authorization': f'Token {token_ciudadano}'} if token_ciudadano else {}
)

print("\n" + "=" * 70)
print("RESUMEN DE PRUEBAS")
print("=" * 50)

total = len(resultados)
exitosos = sum(1 for r in resultados if r['exitoso'])
fallidos = total - exitosos

print(f"Total de pruebas: {total}")
print(f"Exitosas: {exitosos}")
print(f"Fallidas: {fallidos}")
print(f"Porcentaje de exito: {exitosos/total*100:.1f}%")

print("\n--- PRUEBAS FALLIDAS ---")
for r in resultados:
    if not r['exitoso']:
        print(f"  FALLO: {r['prueba']} ({r['metodo']} {r['url']}) - {r['estado_obtenido']} - {r['mensaje'][:100]}")

print("\n" + "=" * 70)

# Guardar resultados en archivo
with open('test_results_week4.json', 'w', encoding='utf-8') as f:
    json.dump(resultados, f, indent=2, ensure_ascii=False)

print("Resultados guardados en: test_results_week4.json")