from django.contrib import admin

from .models import Departamento, Municipio, Zona


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre_departamento',)
    search_fields = ('nombre_departamento',)
    ordering = ('nombre_departamento',)


@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ('nombre_municipio', 'departamento')
    list_filter = ('departamento',)
    search_fields = ('nombre_municipio', 'departamento__nombre_departamento')
    ordering = ('departamento__nombre_departamento', 'nombre_municipio')


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre_zona', 'municipio')
    list_filter = ('municipio__departamento', 'municipio')
    search_fields = ('nombre_zona', 'referencia', 'municipio__nombre_municipio')
    ordering = ('municipio__nombre_municipio', 'nombre_zona')
