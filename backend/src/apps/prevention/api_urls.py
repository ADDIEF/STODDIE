from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import CategoriaPrevencionViewSet, GuiaPrevencionViewSet

router = DefaultRouter()
router.register(
    'prevention/categories',
    CategoriaPrevencionViewSet,
    basename='prevention-category',
)
router.register(
    'prevention/guides',
    GuiaPrevencionViewSet,
    basename='prevention-guide',
)

urlpatterns = [path('', include(router.urls))]
