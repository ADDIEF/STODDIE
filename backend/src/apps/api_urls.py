from django.urls import include, path, reverse
from rest_framework.response import Response
from rest_framework.views import APIView


class VersionedApiRoot(APIView):
    def get(self, request):
        route_names = {
            'authentication': 'auth-login',
            'accounts': 'role-list',
            'geography': 'department-list',
            'incidents': 'incident-list',
            'prevention': 'prevention-category-list',
            'emergency': 'emergency-entity-list',
            'weather': 'weather-source-list',
        }
        return Response({
            name: request.build_absolute_uri(reverse(route_name))
            for name, route_name in route_names.items()
        })

urlpatterns = [
    path('', VersionedApiRoot.as_view(), name='api-root'),
    path('', include('apps.accounts.api_urls')),
    path('', include('apps.geography.api_urls')),
    path('', include('apps.incidents.api_urls')),
    path('', include('apps.prevention.api_urls')),
    path('', include('apps.emergency.api_urls')),
    path('', include('apps.weather.api_urls')),
]
