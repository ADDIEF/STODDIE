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
    departamento_id = serializers.IntegerField(required=False, allow_null=True)
    latitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'email',
            'first_name',
            'segundo_nombre',
            'last_name',
            'apellido_materno',
            'password',
            'departamento_id',
            'latitud',
            'longitud',
        )

    def validate_password(self, value):
        password_validation.validate_password(
            value,
            user=User(email=self.initial_data.get('email', '')),
        )
        return value

    def validate_departamento_id(self, value):
        from apps.geography.models import Departamento
        if value:
            try:
                Departamento.objects.get(pk=value)
            except Departamento.DoesNotExist:
                raise serializers.ValidationError('Departamento no válido.')
        return value

    def validate(self, attrs):
        # Si es registro ciudadano (no admin), se requiere departamento y validación GPS
        # El admin se crea por superuser, no por este endpoint
        dep_id = attrs.get('departamento_id')
        lat = attrs.get('latitud')
        lon = attrs.get('longitud')

        if not dep_id:
            raise serializers.ValidationError({
                'departamento_id': 'Debe seleccionar su departamento para poder reportar incidentes en su región.'
            })

        if lat is None or lon is None:
            raise serializers.ValidationError({
                'latitud': 'Debe verificar su ubicación (GPS) para validar que pertenece al departamento seleccionado.',
                'longitud': 'Debe verificar su ubicación (GPS) para validar que pertenece al departamento seleccionado.',
            })

        from apps.geography.models import Departamento
        try:
            dep = Departamento.objects.get(pk=dep_id)
        except Departamento.DoesNotExist:
            raise serializers.ValidationError({'departamento_id': 'Departamento no válido.'})

        if not dep.contiene_coordenada(float(lat), float(lon)):
            raise serializers.ValidationError({
                'latitud': f'Su ubicación ({lat}, {lon}) no corresponde al departamento {dep.nombre_departamento}. '
                           f'No puede reportar en otra región.',
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('latitud', None)
        validated_data.pop('longitud', None)
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
