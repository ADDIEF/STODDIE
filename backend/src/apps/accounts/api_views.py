from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .api_serializers import (
    AssignRoleSerializer,
    LoginSerializer,
    ProfileSerializer,
    PublicUserSerializer,
    RegistrationSerializer,
    RoleSerializer,
)
from .models import Role, UserRole

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': PublicUserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': PublicUserSerializer(user).data}
        )


class LogoutView(APIView):
    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    http_method_names = ('get', 'patch', 'head', 'options')

    def get_object(self):
        return self.request.user


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all().order_by('nombre_rol')
    serializer_class = RoleSerializer
    search_fields = ('nombre_rol', 'descripcion')
    ordering_fields = ('nombre_rol',)


class UserRoleAssignmentView(APIView):
    permission_classes = (IsAdminUser,)

    def post(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data['role']
        with transaction.atomic():
            UserRole.objects.get_or_create(usuario=target, rol=role)
        return Response(
            PublicUserSerializer(target).data,
            status=status.HTTP_200_OK,
        )
