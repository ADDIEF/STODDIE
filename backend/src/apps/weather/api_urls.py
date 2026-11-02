from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import FuenteMeteorologicaViewSet

router = DefaultRouter()
router.register(
    'weather/sources',
    FuenteMeteorologicaViewSet,
    basename='weather-source',
)

urlpatterns = [path('', include(router.urls))]
