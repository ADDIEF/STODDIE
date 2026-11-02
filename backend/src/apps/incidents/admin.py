from django.contrib import admin

from .models import EstadoIncidente, NivelSeveridad, TipoRiesgo


@admin.register(TipoRiesgo)
class TipoRiesgoAdmin(admin.ModelAdmin):
    list_display = ('nombre_riesgo', 'es_activo')
    list_filter = ('es_activo',)
    search_fields = ('nombre_riesgo', 'descripcion')
    ordering = ('nombre_riesgo',)


@admin.register(NivelSeveridad)
class NivelSeveridadAdmin(admin.ModelAdmin):
    list_display = ('nombre_nivel', 'orden')
    search_fields = ('nombre_nivel', 'descripcion')
    ordering = ('orden', 'nombre_nivel')


@admin.register(EstadoIncidente)
class EstadoIncidenteAdmin(admin.ModelAdmin):
    list_display = ('nombre_estado',)
    search_fields = ('nombre_estado', 'descripcion')
    ordering = ('nombre_estado',)
