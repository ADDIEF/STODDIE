from django.contrib import admin

from .models import ContactoEmergencia, EntidadEmergencia


@admin.register(EntidadEmergencia)
class EntidadEmergenciaAdmin(admin.ModelAdmin):
    list_display = ('nombre_entidad', 'tipo_entidad', 'municipio', 'es_activa')
    list_filter = ('es_activa', 'tipo_entidad', 'municipio__departamento')
    search_fields = ('nombre_entidad', 'tipo_entidad', 'direccion')
    ordering = ('nombre_entidad',)


@admin.register(ContactoEmergencia)
class ContactoEmergenciaAdmin(admin.ModelAdmin):
    list_display = ('entidad', 'tipo_contacto', 'valor_contacto', 'es_activo')
    list_filter = ('es_activo', 'tipo_contacto')
    search_fields = ('entidad__nombre_entidad', 'tipo_contacto', 'valor_contacto')
    ordering = ('entidad__nombre_entidad', 'tipo_contacto')
