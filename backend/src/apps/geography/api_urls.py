from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    DepartamentoViewSet,
    LocalidadViewSet,
    MunicipioViewSet,
    PaisViewSet,
    ProvinciaViewSet,
    ZonaViewSet,
)

router = DefaultRouter()
router.register('geography/countries', PaisViewSet, basename='country')
router.register('geography/departments', DepartamentoViewSet, basename='department')
router.register('geography/provinces', ProvinciaViewSet, basename='province')
router.register('geography/municipalities', MunicipioViewSet, basename='municipality')
router.register('geography/localities', LocalidadViewSet, basename='locality')
router.register('geography/zones', ZonaViewSet, basename='zone')

urlpatterns = [path('', include(router.urls))]
