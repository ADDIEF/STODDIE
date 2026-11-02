from django.contrib import admin

from .models import CategoriaPrevencion, GuiaPrevencion


@admin.register(CategoriaPrevencion)
class CategoriaPrevencionAdmin(admin.ModelAdmin):
    list_display = ('nombre_categoria', 'es_activa')
    list_filter = ('es_activa',)
    search_fields = ('nombre_categoria', 'descripcion')
    ordering = ('nombre_categoria',)


@admin.register(GuiaPrevencion)
class GuiaPrevencionAdmin(admin.ModelAdmin):
    exclude = ('tipos_riesgo',)
    list_display = ('titulo', 'categoria', 'es_activa', 'fecha_actualizacion')
    list_filter = ('es_activa', 'categoria')
    search_fields = ('titulo', 'contenido')
    ordering = ('titulo',)
