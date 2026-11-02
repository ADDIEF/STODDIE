from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import (
    AdminUserCreationForm as DjangoAdminUserCreationForm,
)

from .models import Role, User


class UserCreationForm(DjangoAdminUserCreationForm):
    class Meta(DjangoAdminUserCreationForm.Meta):
        model = User
        fields = (
            User.USERNAME_FIELD,
            'first_name',
            'segundo_nombre',
            'last_name',
            'apellido_materno',
        )


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (
            'Personal info',
            {
                'fields': (
                    'first_name',
                    'segundo_nombre',
                    'last_name',
                    'apellido_materno',
                )
            },
        ),
        (
            'Permissions',
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            },
        ),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'first_name',
                    'segundo_nombre',
                    'last_name',
                    'apellido_materno',
                    'usable_password',
                    'password1',
                    'password2',
                ),
            },
        ),
    )
    add_form = UserCreationForm
    list_display = (
        'email',
        'first_name',
        'segundo_nombre',
        'last_name',
        'apellido_materno',
        'is_staff',
    )
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('nombre_rol', 'descripcion')
    search_fields = ('nombre_rol',)
    ordering = ('nombre_rol',)
