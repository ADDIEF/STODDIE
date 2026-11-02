from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .api_serializers import (
    ComentarioCreateSerializer,
    ComentarioReadSerializer,
    EstadoIncidenteSerializer,
    EstadoUpdateSerializer,
    HistorialEstadoSerializer,
    IncidenteCreateSerializer,
    IncidenteReadSerializer,
    IncidenteUpdateSerializer,
    NivelSeveridadSerializer,
    TipoRiesgoSerializer,
)
from .models import (
    ComentarioIncidente,
    EstadoIncidente,
    HistorialEstado,
    Incidente,
    NivelSeveridad,
    TipoRiesgo,
)


class ModeratorPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.roles.filter(nombre_rol='Administrador').exists()
            )
        )


class CatalogReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated,)


class TipoRiesgoViewSet(CatalogReadOnlyViewSet):
    queryset = TipoRiesgo.objects.filter(es_activo=True).order_by('nombre_riesgo')
    serializer_class = TipoRiesgoSerializer
    search_fields = ('nombre_riesgo', 'descripcion')
    ordering_fields = ('nombre_riesgo',)


class NivelSeveridadViewSet(CatalogReadOnlyViewSet):
    queryset = NivelSeveridad.objects.all().order_by('orden', 'nombre_nivel')
    serializer_class = NivelSeveridadSerializer
    search_fields = ('nombre_nivel', 'descripcion')
    ordering_fields = ('orden', 'nombre_nivel')


class EstadoIncidenteViewSet(CatalogReadOnlyViewSet):
    queryset = EstadoIncidente.objects.all().order_by('nombre_estado')
    serializer_class = EstadoIncidenteSerializer
    search_fields = ('nombre_estado', 'descripcion')
    ordering_fields = ('nombre_estado',)


class InitialStatusMissing(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = (
        'The initial incident status is not configured. '
        'Create the approved "Pendiente" catalog entry.'
    )
    default_code = 'initial_status_missing'


class IncidenteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsAuthenticated,)
    http_method_names = ('get', 'post', 'patch', 'head', 'options')
    search_fields = (
        'descripcion',
        'referencia_ubicacion',
        'tipo_riesgo__nombre_riesgo',
    )
    ordering_fields = ('fecha_reporte', 'fecha_actualizacion')

    def is_moderator(self):
        user = self.request.user
        return user.is_staff or user.roles.filter(
            nombre_rol='Administrador'
        ).exists()

    def get_queryset(self):
        queryset = Incidente.objects.select_related(
            'usuario',
            'tipo_riesgo',
            'nivel_severidad',
            'estado',
            'zona',
        ).order_by('-fecha_reporte')
        if not self.is_moderator():
            queryset = queryset.filter(usuario=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return IncidenteCreateSerializer
        if self.action in ('update', 'partial_update'):
            return IncidenteUpdateSerializer
        if self.action == 'status':
            return EstadoUpdateSerializer
        if self.action == 'comments' and self.request.method == 'POST':
            return ComentarioCreateSerializer
        if self.action == 'comments':
            return ComentarioReadSerializer
        if self.action == 'history':
            return HistorialEstadoSerializer
        return IncidenteReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            IncidenteReadSerializer(
                serializer.instance,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            initial_status = EstadoIncidente.objects.get(
                nombre_estado='Pendiente'
            )
        except EstadoIncidente.DoesNotExist as exc:
            raise InitialStatusMissing from exc
        incident = serializer.save(
            usuario=self.request.user,
            estado=initial_status,
        )
        HistorialEstado.objects.create(
            incidente=incident,
            estado_anterior=None,
            estado_nuevo=initial_status,
            usuario=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(fecha_actualizacion=timezone.now())

    def update(self, request, *args, **kwargs):
        if not request.user.is_staff and not request.user.roles.filter(
            nombre_rol='Administrador'
        ).exists():
            incident = self.get_object()
            if incident.usuario_id != request.user.pk:
                raise PermissionDenied
        return super().update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=('post',),
        permission_classes=(ModeratorPermission,),
    )
    @transaction.atomic
    def status(self, request, pk=None):
        incident = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['estado']
        observation = serializer.validated_data.get('observacion')
        if incident.estado_id != new_status.pk:
            previous_status = incident.estado
            incident.estado = new_status
            incident.fecha_actualizacion = timezone.now()
            incident.save(update_fields=('estado', 'fecha_actualizacion'))
            HistorialEstado.objects.create(
                incidente=incident,
                estado_anterior=previous_status,
                estado_nuevo=new_status,
                usuario=request.user,
                observacion=observation,
            )
        return Response(IncidenteReadSerializer(incident).data)

    @action(detail=True, methods=('get',))
    def history(self, request, pk=None):
        incident = self.get_object()
        history = HistorialEstado.objects.filter(incidente=incident).select_related(
            'estado_anterior',
            'estado_nuevo',
            'usuario',
        ).order_by('fecha_cambio', 'pk')
        page = self.paginate_queryset(history)
        serializer = self.get_serializer(page or history, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=('get', 'post'))
    def comments(self, request, pk=None):
        if not self.is_moderator():
            raise PermissionDenied(
                'Incident moderation comments are restricted to moderators.'
            )
        incident = self.get_object()
        if request.method == 'POST':
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            comment = serializer.save(incidente=incident, usuario=request.user)
            return Response(
                ComentarioReadSerializer(comment).data,
                status=status.HTTP_201_CREATED,
            )
        comments = ComentarioIncidente.objects.filter(
            incidente=incident
        ).select_related('usuario').order_by('fecha_comentario')
        page = self.paginate_queryset(comments)
        serializer = self.get_serializer(page or comments, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
