from django.contrib import admin

from .models import Departamento, Localidad, Municipio, Pais, Provincia, Zona


@admin.register(Pais)
class PaisAdmin(admin.ModelAdmin):
    list_display = ('nombre_pais', 'codigo_iso')
    search_fields = ('nombre_pais', 'codigo_iso')
    ordering = ('nombre_pais',)


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre_departamento', 'pais')
    list_filter = ('pais',)
    search_fields = ('nombre_departamento', 'pais__nombre_pais')
    ordering = ('nombre_departamento',)


@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ('nombre_provincia', 'departamento')
    list_filter = ('departamento',)
    search_fields = ('nombre_provincia', 'departamento__nombre_departamento')
    ordering = ('nombre_provincia',)


@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ('nombre_municipio', 'provincia')
    list_filter = ('provincia__departamento', 'provincia')
    search_fields = (
        'nombre_municipio',
        'provincia__nombre_provincia',
        'provincia__departamento__nombre_departamento',
    )
    ordering = ('provincia__departamento__nombre_departamento', 'nombre_municipio')


@admin.register(Localidad)
class LocalidadAdmin(admin.ModelAdmin):
    list_display = ('nombre_localidad', 'municipio')
    list_filter = (
        'municipio__provincia__departamento',
        'municipio__provincia',
        'municipio',
    )
    search_fields = (
        'nombre_localidad',
        'municipio__nombre_municipio',
        'municipio__provincia__departamento__nombre_departamento',
    )
    ordering = ('municipio__nombre_municipio', 'nombre_localidad')


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre_zona', 'localidad', 'referencia')
    list_filter = (
        'localidad__municipio__provincia__departamento',
        'localidad__municipio',
        'localidad',
    )
    search_fields = (
        'nombre_zona',
        'referencia',
        'localidad__nombre_localidad',
        'localidad__municipio__nombre_municipio',
    )
    ordering = ('localidad__municipio__nombre_municipio', 'nombre_zona')
