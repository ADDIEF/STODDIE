from rest_framework.routers import DefaultRouter
from django.urls import path

from .api_views import (
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    RoleViewSet,
    UserRoleAssignmentView,
)

router = DefaultRouter()
router.register('accounts/roles', RoleViewSet, basename='role')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', ProfileView.as_view(), name='auth-profile'),
    path(
        'accounts/users/<int:user_id>/roles/',
        UserRoleAssignmentView.as_view(),
        name='user-role-assignment',
    ),
    *router.urls,
]
