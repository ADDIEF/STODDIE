from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import DepartamentoViewSet, MunicipioViewSet, ZonaViewSet

router = DefaultRouter()
router.register('geography/departments', DepartamentoViewSet, basename='department')
router.register('geography/municipalities', MunicipioViewSet, basename='municipality')
router.register('geography/zones', ZonaViewSet, basename='zone')

urlpatterns = [path('', include(router.urls))]
