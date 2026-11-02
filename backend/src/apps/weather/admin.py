from django.contrib import admin

from .models import FuenteMeteorologica


@admin.register(FuenteMeteorologica)
class FuenteMeteorologicaAdmin(admin.ModelAdmin):
    list_display = ('nombre_proveedor', 'es_activa', 'usuario_registro')
    list_filter = ('es_activa',)
    search_fields = ('nombre_proveedor', 'descripcion')
    ordering = ('nombre_proveedor',)
