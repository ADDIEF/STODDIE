from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import ContactoEmergenciaViewSet, EntidadEmergenciaViewSet

router = DefaultRouter()
router.register(
    'emergency/entities',
    EntidadEmergenciaViewSet,
    basename='emergency-entity',
)
router.register(
    'emergency/contacts',
    ContactoEmergenciaViewSet,
    basename='emergency-contact',
)

urlpatterns = [path('', include(router.urls))]
