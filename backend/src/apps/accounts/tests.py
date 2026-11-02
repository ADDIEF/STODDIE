from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.emergency.models import ContactoEmergencia, EntidadEmergencia
from apps.geography.models import Departamento, Municipio, Zona
from apps.incidents.models import (
    ComentarioIncidente,
    EstadoIncidente,
    HistorialEstado,
    Incidente,
    NivelSeveridad,
    TipoRiesgo,
)
from apps.prevention.models import (
    CategoriaPrevencion,
    GuiaPrevencion,
    GuiaTipoRiesgo,
)
from apps.weather.models import FuenteMeteorologica

from .models import Role, UserRole

User = get_user_model()


class AuthenticationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='citizen@example.test',
            password='Test-password-94!secure',
            first_name='Ada',
            last_name='Lovelace',
        )
        self.role = Role.objects.create(nombre_rol='Ciudadano')
        UserRole.objects.create(usuario=self.user, rol=self.role)

    def test_registration_creates_safe_citizen_and_token(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'new@example.test',
                'first_name': 'Grace',
                'segundo_nombre': 'Brewster',
                'last_name': 'Hopper',
                'apellido_materno': 'Murray',
                'password': 'Different-password-83!secure',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(email='new@example.test')
        self.assertTrue(created.check_password('Different-password-83!secure'))
        self.assertNotEqual(created.password, 'Different-password-83!secure')
        self.assertTrue(created.roles.filter(nombre_rol='Ciudadano').exists())
        self.assertFalse(created.is_staff)
        self.assertFalse(created.is_superuser)
        self.assertNotIn('password', response.data['user'])
        self.assertNotIn('password_hash', response.data['user'])
        self.assertEqual(Token.objects.filter(user=created).count(), 1)

    def test_registration_rejects_invalid_email_and_weak_password(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'not-an-email',
                'first_name': 'A',
                'last_name': 'B',
                'password': '123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='not-an-email').exists())

        weak_password = self.client.post(
            reverse('auth-register'),
            {
                'email': 'weak@example.test',
                'first_name': 'Weak',
                'last_name': 'Password',
                'password': '123',
            },
            format='json',
        )
        self.assertEqual(
            weak_password.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(User.objects.filter(email='weak@example.test').exists())

    def test_login_profile_patch_and_logout(self):
        response = self.client.post(
            reverse('auth-login'),
            {
                'email': self.user.email,
                'password': 'Test-password-94!secure',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['token']
        self.assertNotIn('password', response.data['user'])

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        profile = self.client.get(reverse('auth-profile'))
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data['email'], self.user.email)

        update = self.client.patch(
            reverse('auth-profile'),
            {'segundo_nombre': 'Byron'},
            format='json',
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.segundo_nombre, 'Byron')
        self.assertEqual(self.user.email, 'citizen@example.test')

        logout = self.client.post(reverse('auth-logout'))
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(key=token).exists())
        self.assertEqual(
            self.client.get(reverse('auth-profile')).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_bad_password_and_unknown_profile_fields_are_rejected(self):
        bad_login = self.client.post(
            reverse('auth-login'),
            {'email': self.user.email, 'password': 'wrong-password'},
            format='json',
        )
        self.assertEqual(bad_login.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.user)
        update = self.client.patch(
            reverse('auth-profile'),
            {'is_superuser': True},
            format='json',
        )
        self.assertEqual(update.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_superuser)

    def test_role_assignment_is_restricted_to_django_staff(self):
        admin_role = Role.objects.create(nombre_rol='Administrador')
        url = reverse(
            'user-role-assignment',
            kwargs={'user_id': self.user.pk},
        )
        self.client.force_authenticate(self.user)
        denied = self.client.post(
            url,
            {'id_rol': admin_role.pk},
            format='json',
        )
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            UserRole.objects.filter(usuario=self.user, rol=admin_role).exists()
        )

        staff_user = User.objects.create_superuser(
            email='staff@example.test',
            password='Another-password-91!secure',
            first_name='System',
            last_name='Admin',
        )
        self.client.force_authenticate(staff_user)
        granted = self.client.post(
            url,
            {'id_rol': admin_role.pk},
            format='json',
        )
        self.assertEqual(granted.status_code, status.HTTP_200_OK)
        self.assertTrue(
            UserRole.objects.filter(usuario=self.user, rol=admin_role).exists()
        )

    def test_roles_endpoint_is_read_only(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse('role-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(reverse('role-list'), {}, format='json').status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_api_root_lists_every_registered_module(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/v1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data),
            {
                'authentication',
                'accounts',
                'geography',
                'incidents',
                'prevention',
                'emergency',
                'weather',
            },
        )
        self.assertTrue(response.data['weather'].endswith('/api/v1/weather/sources/'))


class IncidentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='reporter@example.test',
            password='Test-password-94!secure',
            first_name='Report',
            last_name='Owner',
        )
        self.other_user = User.objects.create_user(
            email='other@example.test',
            password='Test-password-95!secure',
            first_name='Other',
            last_name='Citizen',
        )
        self.client.force_authenticate(self.user)
        self.risk = TipoRiesgo.objects.create(nombre_riesgo='Inundación')
        self.severity = NivelSeveridad.objects.create(
            nombre_nivel='Moderado',
            orden=2,
        )
        self.pending = EstadoIncidente.objects.create(
            nombre_estado='Pendiente'
        )
        self.confirmed = EstadoIncidente.objects.create(
            nombre_estado='Confirmado'
        )
        department = Departamento.objects.create(
            nombre_departamento='Departamento de prueba'
        )
        municipality = Municipio.objects.create(
            departamento=department,
            nombre_municipio='Municipio de prueba',
        )
        self.zone = Zona.objects.create(
            municipio=municipality,
            nombre_zona='Zona de prueba',
        )

    def report_payload(self, **overrides):
        payload = {
            'tipo_riesgo': self.risk.pk,
            'nivel_severidad': self.severity.pk,
            'zona': self.zone.pk,
            'descripcion': 'Agua acumulada en vía pública.',
            'latitud': '-17.783300',
            'longitud': '-63.182100',
            'referencia_ubicacion': 'Cerca del mercado.',
        }
        payload.update(overrides)
        return payload

    def create_incident(self):
        return Incidente.objects.create(
            usuario=self.user,
            tipo_riesgo=self.risk,
            nivel_severidad=self.severity,
            estado=self.pending,
            zona=self.zone,
            descripcion='Reporte de prueba.',
            latitud='-17.783300',
            longitud='-63.182100',
        )

    def test_create_incident_sets_owner_pending_and_history(self):
        spoofed = self.client.post(
            reverse('incident-list'),
            self.report_payload(id_usuario=self.other_user.pk),
            format='json',
        )
        self.assertEqual(spoofed.status_code, status.HTTP_400_BAD_REQUEST)
        payload = self.report_payload()
        response = self.client.post(
            reverse('incident-list'),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        incident = Incidente.objects.get(pk=response.data['id_incidente'])
        self.assertEqual(incident.usuario, self.user)
        self.assertEqual(incident.estado, self.pending)
        self.assertEqual(incident.historialestado_set.count(), 1)
        history = incident.historialestado_set.get()
        self.assertIsNone(history.estado_anterior)
        self.assertEqual(history.estado_nuevo, self.pending)
        self.assertEqual(history.usuario, self.user)

    def test_create_validates_coordinates_and_relationships(self):
        invalid_location = self.client.post(
            reverse('incident-list'),
            self.report_payload(latitud='91'),
            format='json',
        )
        self.assertEqual(
            invalid_location.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        invalid_relation = self.client.post(
            reverse('incident-list'),
            self.report_payload(tipo_riesgo=999999),
            format='json',
        )
        self.assertEqual(
            invalid_relation.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Incidente.objects.count(), 0)

    def test_users_only_list_and_retrieve_their_incidents(self):
        own = self.create_incident()
        other = Incidente.objects.create(
            usuario=self.other_user,
            tipo_riesgo=self.risk,
            estado=self.pending,
            descripcion='Private other report.',
            latitud='-17.783300',
            longitud='-63.182100',
        )
        response = self.client.get(reverse('incident-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item['id_incidente'] for item in response.data['results']],
            [own.pk],
        )
        self.assertEqual(
            self.client.get(
                reverse('incident-detail', kwargs={'pk': other.pk})
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_owner_can_edit_report_content_but_not_status_or_owner(self):
        incident = self.create_incident()
        update_url = reverse('incident-detail', kwargs={'pk': incident.pk})
        response = self.client.patch(
            update_url,
            {'descripcion': 'Descripción actualizada.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        incident.refresh_from_db()
        self.assertEqual(incident.descripcion, 'Descripción actualizada.')

        forbidden_fields = self.client.patch(
            update_url,
            {
                'id_estado': self.confirmed.pk,
                'id_usuario': self.other_user.pk,
            },
            format='json',
        )
        self.assertEqual(
            forbidden_fields.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        incident.refresh_from_db()
        self.assertEqual(incident.estado, self.pending)
        self.assertEqual(incident.usuario, self.user)

    def test_only_moderator_can_change_status_and_comment(self):
        incident = self.create_incident()
        detail = reverse('incident-detail', kwargs={'pk': incident.pk})
        denied_status = self.client.post(
            f'{detail}status/',
            {'id_estado': self.confirmed.pk},
            format='json',
        )
        self.assertEqual(
            denied_status.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        denied_comment = self.client.post(
            f'{detail}comments/',
            {'comentario': 'Moderación.'},
            format='json',
        )
        self.assertEqual(
            denied_comment.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(f'{detail}comments/').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(ComentarioIncidente.objects.count(), 0)

        moderator = User.objects.create_superuser(
            email='moderator@example.test',
            password='Moderator-password-91!secure',
            first_name='Moderator',
            last_name='Account',
        )
        self.client.force_authenticate(moderator)
        changed = self.client.post(
            f'{detail}status/',
            {
                'id_estado': self.confirmed.pk,
                'observacion': 'Estado revisado.',
            },
            format='json',
        )
        self.assertEqual(changed.status_code, status.HTTP_200_OK)
        incident.refresh_from_db()
        self.assertEqual(incident.estado, self.confirmed)
        self.assertEqual(changed.data['id_estado'], self.confirmed.pk)
        history = HistorialEstado.objects.filter(incidente=incident).order_by(
            'pk'
        )
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().estado_anterior, self.pending)
        self.assertEqual(history.first().estado_nuevo, self.confirmed)
        self.assertEqual(history.last().observacion, 'Estado revisado.')
        self.assertEqual(history.last().usuario, moderator)

        comment_response = self.client.post(
            f'{detail}comments/',
            {'comentario': 'Nota administrativa.'},
            format='json',
        )
        self.assertEqual(
            comment_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(ComentarioIncidente.objects.count(), 1)
        comment_list = self.client.get(f'{detail}comments/')
        self.assertEqual(comment_list.status_code, status.HTTP_200_OK)
        self.assertEqual(
            comment_list.data['results'][0]['comentario'],
            'Nota administrativa.',
        )

    def test_business_administrator_role_can_moderate_incidents(self):
        incident = self.create_incident()
        administrator_role = Role.objects.create(nombre_rol='Administrador')
        UserRole.objects.create(usuario=self.other_user, rol=administrator_role)
        self.client.force_authenticate(self.other_user)

        updated = self.client.post(
            reverse('incident-status', kwargs={'pk': incident.pk}),
            {'id_estado': self.confirmed.pk},
            format='json',
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        incident.refresh_from_db()
        self.assertEqual(incident.estado, self.confirmed)
        self.assertEqual(
            HistorialEstado.objects.filter(incidente=incident).count(),
            1,
        )

    def test_history_is_limited_to_report_owner_or_moderator(self):
        incident = self.create_incident()
        owner_response = self.client.get(
            reverse('incident-history', kwargs={'pk': incident.pk})
        )
        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(owner_response.data['results']), 0)

        self.client.force_authenticate(self.other_user)
        response = self.client.get(
            reverse(
                'incident-history',
                kwargs={'pk': incident.pk},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_incident_serialization_does_not_expose_password(self):
        incident = self.create_incident()
        response = self.client.get(
            reverse('incident-detail', kwargs={'pk': incident.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('password', response.data)
        self.assertNotIn('password_hash', response.data)

    def test_initial_status_missing_returns_explicit_service_error(self):
        incident = self.pending
        incident.delete()
        response = self.client.post(
            reverse('incident-list'),
            self.report_payload(),
            format='json',
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class CatalogApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='catalog@example.test',
            password='Test-password-94!secure',
            first_name='Catalog',
            last_name='Reader',
        )
        self.client.force_authenticate(self.user)

    def test_catalogs_are_read_only_and_authentication_is_required(self):
        risk = TipoRiesgo.objects.create(nombre_riesgo='Deslizamiento')
        response = self.client.get(reverse('risk-type-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['id_tipo_riesgo'], risk.pk)
        self.assertEqual(
            self.client.post(
                reverse('risk-type-list'),
                {'nombre_riesgo': 'No permitido'},
                format='json',
            ).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(reverse('risk-type-list')).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_active_prevention_guides_and_related_risks(self):
        category = CategoriaPrevencion.objects.create(
            nombre_categoria='Preparación'
        )
        risk = TipoRiesgo.objects.create(nombre_riesgo='Inundación')
        guide = GuiaPrevencion.objects.create(
            categoria=category,
            titulo='Antes de una inundación',
            contenido='Prepare suministros.',
        )
        guide.tipos_riesgo.add(risk)
        response = self.client.get(reverse('prevention-guide-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['id_guia'], guide.pk)
        self.assertEqual(
            response.data['results'][0]['ids_tipos_riesgo'],
            [risk.pk],
        )
        inactive = GuiaPrevencion.objects.create(
            categoria=category,
            titulo='Guía inactiva',
            contenido='No se debe mostrar.',
            es_activa=False,
        )
        filtered = self.client.get(reverse('prevention-guide-list'))
        self.assertNotIn(
            inactive.pk,
            [item['id_guia'] for item in filtered.data['results']],
        )

    def test_composite_guide_risk_links_are_moderator_only(self):
        category = CategoriaPrevencion.objects.create(
            nombre_categoria='Orientación'
        )
        risk = TipoRiesgo.objects.create(nombre_riesgo='Deslizamiento')
        guide = GuiaPrevencion.objects.create(
            categoria=category,
            titulo='Guía de ladera',
            contenido='Manténgase alejado de pendientes inestables.',
        )
        url = reverse(
            'prevention-guide-risk-types',
            kwargs={'pk': guide.pk},
        )
        denied = self.client.post(
            url,
            {'id_tipo_riesgo': risk.pk},
            format='json',
        )
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            GuiaTipoRiesgo.objects.filter(
                guia=guide,
                tipo_riesgo=risk,
            ).exists()
        )

        staff_user = User.objects.create_superuser(
            email='guide-admin@example.test',
            password='Guide-admin-password-91!secure',
            first_name='Guide',
            last_name='Admin',
        )
        self.client.force_authenticate(staff_user)
        created = self.client.post(
            url,
            {'id_tipo_riesgo': risk.pk},
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            GuiaTipoRiesgo.objects.filter(
                guia=guide,
                tipo_riesgo=risk,
            ).exists()
        )
        removed = self.client.delete(
            f'{url}?id_tipo_riesgo={risk.pk}'
        )
        self.assertEqual(removed.status_code, status.HTTP_200_OK)
        self.assertFalse(
            GuiaTipoRiesgo.objects.filter(
                guia=guide,
                tipo_riesgo=risk,
            ).exists()
        )

    def test_severity_and_status_catalog_endpoints(self):
        severity = NivelSeveridad.objects.create(
            nombre_nivel='Leve',
            orden=1,
        )
        incident_status = EstadoIncidente.objects.create(
            nombre_estado='Pendiente'
        )
        severity_response = self.client.get(reverse('severity-level-list'))
        status_response = self.client.get(reverse('incident-status-list'))
        self.assertEqual(severity_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            severity_response.data['results'][0]['id_nivel_severidad'],
            severity.pk,
        )
        self.assertEqual(
            status_response.data['results'][0]['id_estado'],
            incident_status.pk,
        )

    def test_geography_and_emergency_filters_validate_query_ids(self):
        department = Departamento.objects.create(
            nombre_departamento='Departamento norte'
        )
        municipality = Municipio.objects.create(
            departamento=department,
            nombre_municipio='Municipio norte',
        )
        entity = EntidadEmergencia.objects.create(
            municipio=municipality,
            nombre_entidad='Centro de emergencia',
            tipo_entidad='Atención',
        )
        contact = ContactoEmergencia.objects.create(
            entidad=entity,
            tipo_contacto='Teléfono',
            valor_contacto='80000000',
        )
        zone = Zona.objects.create(
            municipio=municipality,
            nombre_zona='Zona norte',
        )
        response = self.client.get(
            reverse('municipality-list'),
            {'id_departamento': department.pk},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item['id_municipio'] for item in response.data['results']],
            [municipality.pk],
        )
        invalid_filter = self.client.get(
            reverse('municipality-list'),
            {'id_departamento': 'invalid'},
        )
        self.assertEqual(invalid_filter.status_code, status.HTTP_400_BAD_REQUEST)
        entity_response = self.client.get(
            reverse('emergency-entity-list'),
            {'id_municipio': municipality.pk},
        )
        self.assertEqual(entity_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            entity_response.data['results'][0]['id_entidad'],
            entity.pk,
        )
        zone_response = self.client.get(
            reverse('zone-list'),
            {'id_municipio': municipality.pk},
        )
        self.assertEqual(zone_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item['id_zona'] for item in zone_response.data['results']],
            [zone.pk],
        )
        contact_response = self.client.get(
            reverse('emergency-contact-list'),
            {'id_entidad': entity.pk},
        )
        self.assertEqual(contact_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            contact_response.data['results'][0]['id_contacto'],
            contact.pk,
        )

    def test_weather_sources_are_read_only_reference_data(self):
        source = FuenteMeteorologica.objects.create(
            usuario_registro=self.user,
            nombre_proveedor='Proveedor de prueba',
            url_referencia='https://weather.example.test',
        )
        response = self.client.get(reverse('weather-source-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['id_fuente'], source.pk)
        self.assertNotIn('id_usuario_registro', response.data['results'][0])
        self.assertEqual(
            self.client.post(
                reverse('weather-source-list'),
                {'nombre_proveedor': 'No permitido'},
                format='json',
            ).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_unknown_api_route_returns_json_404(self):
        response = self.client.get('/api/v1/not-a-real-resource/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
