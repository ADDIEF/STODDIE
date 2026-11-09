from django.contrib.auth import authenticate, password_validation
from django.db import transaction
from rest_framework import serializers

from apps.api_serializers import StrictModelSerializer, StrictSerializer

from .models import Role, User, UserRole


class PublicUserSerializer(serializers.ModelSerializer):
    id_usuario = serializers.IntegerField(source='pk', read_only=True)
    roles = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id_usuario',
            'email',
            'first_name',
            'segundo_nombre',
            'last_name',
            'apellido_materno',
            'date_joined',
            'roles',
            'is_staff',
            'is_superuser',
        )
        read_only_fields = fields

    def get_roles(self, user):
        return list(user.roles.order_by('nombre_rol').values_list('nombre_rol', flat=True))


class RegistrationSerializer(StrictModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = (
            'email',
            'first_name',
            'segundo_nombre',
            'last_name',
            'apellido_materno',
            'password',
        )

    def validate_password(self, value):
        password_validation.validate_password(
            value,
            user=User(email=self.initial_data.get('email', '')),
        )
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        citizen_role, _ = Role.objects.get_or_create(nombre_rol='Ciudadano')
        UserRole.objects.create(usuario=user, rol=citizen_role)
        return user


class LoginSerializer(StrictSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = authenticate(
            request=request,
            email=attrs['email'],
            password=attrs['password'],
        )
        if user is None:
            raise serializers.ValidationError(
                {'detail': 'Invalid email or password.'}
            )
        attrs['user'] = user
        return attrs


class ProfileSerializer(StrictModelSerializer):
    id_usuario = serializers.IntegerField(source='pk', read_only=True)
    email = serializers.EmailField(read_only=True)
    roles = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id_usuario',
            'email',
            'first_name',
            'segundo_nombre',
            'last_name',
            'apellido_materno',
            'date_joined',
            'roles',
            'is_staff',
            'is_superuser',
        )
        read_only_fields = (
            'id_usuario',
            'email',
            'date_joined',
            'roles',
            'is_staff',
            'is_superuser',
        )

    def get_roles(self, user):
        return list(user.roles.order_by('nombre_rol').values_list('nombre_rol', flat=True))


class RoleSerializer(serializers.ModelSerializer):
    id_rol = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = Role
        fields = ('id_rol', 'nombre_rol', 'descripcion')
        read_only_fields = fields


class AssignRoleSerializer(StrictSerializer):
    id_rol = serializers.PrimaryKeyRelatedField(
        source='role',
        queryset=Role.objects.all(),
    )
