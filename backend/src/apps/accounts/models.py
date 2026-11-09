from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.functions import TransactionNow
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The email address must be set.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('A superuser must be is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('A superuser must be is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_rol')
    nombre_rol = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'role'
        verbose_name_plural = 'roles'

    def __str__(self):
        return self.nombre_rol


class User(AbstractUser):
    id = models.AutoField(primary_key=True, db_column='id_usuario')
    username = None
    first_name = models.CharField(max_length=80, db_column='primer_nombre')
    segundo_nombre = models.CharField(max_length=80, null=True, blank=True)
    last_name = models.CharField(max_length=80, db_column='apellido_paterno')
    apellido_materno = models.CharField(max_length=80, null=True, blank=True)
    email = models.EmailField(max_length=120, unique=True, db_column='correo')
    password = models.CharField(max_length=255, db_column='password_hash')
    is_active = models.BooleanField(
        default=True,
        db_column='es_activo',
        db_default=True,
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        db_column='fecha_registro',
        db_default=TransactionNow(),
    )
    departamento = models.ForeignKey(
        'geography.Departamento',
        on_delete=models.SET_NULL,
        db_column='id_departamento',
        null=True,
        blank=True,
        db_index=False,
    )
    roles = models.ManyToManyField(
        Role,
        through='UserRole',
        related_name='users',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'user'
        verbose_name_plural = 'users'


class UserRole(models.Model):
    pk = models.CompositePrimaryKey('usuario_id', 'rol_id')
    usuario = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario',
        db_index=False,
    )
    rol = models.ForeignKey(
        Role,
        on_delete=models.DO_NOTHING,
        db_column='id_rol',
        db_index=False,
    )
    fecha_asignacion = models.DateTimeField(
        default=timezone.now,
        db_default=TransactionNow(),
    )

    class Meta:
        db_table = 'usuarios_roles'
        verbose_name = 'user role'
        verbose_name_plural = 'user roles'
