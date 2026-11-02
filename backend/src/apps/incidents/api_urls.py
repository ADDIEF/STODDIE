from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    EstadoIncidenteViewSet,
    IncidenteViewSet,
    NivelSeveridadViewSet,
    TipoRiesgoViewSet,
)

router = DefaultRouter()
router.register('risk-types', TipoRiesgoViewSet, basename='risk-type')
router.register('severity-levels', NivelSeveridadViewSet, basename='severity-level')
router.register('incident-statuses', EstadoIncidenteViewSet, basename='incident-status')
router.register('incidents', IncidenteViewSet, basename='incident')

urlpatterns = [path('', include(router.urls))]
