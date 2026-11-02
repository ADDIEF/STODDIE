from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.api_serializers import parse_positive_integer
from apps.incidents.models import TipoRiesgo

from .api_serializers import (
    CategoriaPrevencionSerializer,
    GuiaPrevencionSerializer,
    GuiaTipoRiesgoInputSerializer,
)
from .models import CategoriaPrevencion, GuiaPrevencion, GuiaTipoRiesgo


class CategoriaPrevencionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CategoriaPrevencion.objects.filter(es_activa=True).order_by(
        'nombre_categoria'
    )
    serializer_class = CategoriaPrevencionSerializer
    search_fields = ('nombre_categoria', 'descripcion')
    ordering_fields = ('nombre_categoria',)


class GuiaPrevencionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GuiaPrevencionSerializer
    search_fields = ('titulo', 'contenido')
    ordering_fields = ('titulo', 'fecha_actualizacion')

    def get_queryset(self):
        queryset = GuiaPrevencion.objects.filter(
            es_activa=True,
            categoria__es_activa=True,
        ).select_related('categoria').prefetch_related('tipos_riesgo').order_by(
            'titulo'
        )
        category_id = self.request.query_params.get('id_categoria')
        if category_id is not None:
            queryset = queryset.filter(
                categoria_id=parse_positive_integer(
                    category_id,
                    'id_categoria',
                )
            )
        risk_type_id = self.request.query_params.get('id_tipo_riesgo')
        if risk_type_id is not None:
            risk_type_id = parse_positive_integer(
                risk_type_id,
                'id_tipo_riesgo',
            )
            if not TipoRiesgo.objects.filter(pk=risk_type_id).exists():
                return queryset.none()
            queryset = queryset.filter(tipos_riesgo__pk=risk_type_id)
        return queryset.distinct()

    @action(
        detail=True,
        methods=('post', 'delete'),
        permission_classes=(IsAdminUser,),
        url_path='risk-types',
    )
    @transaction.atomic
    def risk_types(self, request, pk=None):
        guide = self.get_object()
        data = (
            request.data
            if request.method == 'POST'
            else request.query_params
        )
        serializer = GuiaTipoRiesgoInputSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        risk_type = get_object_or_404(
            TipoRiesgo,
            pk=serializer.validated_data['id_tipo_riesgo'],
        )

        if request.method == 'POST':
            _, created = GuiaTipoRiesgo.objects.get_or_create(
                guia=guide,
                tipo_riesgo=risk_type,
            )
            response_status = (
                status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        else:
            deleted, _ = GuiaTipoRiesgo.objects.filter(
                guia=guide,
                tipo_riesgo=risk_type,
            ).delete()
            if not deleted:
                raise NotFound('The guide/risk association does not exist.')
            response_status = status.HTTP_200_OK

        guide.refresh_from_db()
        guide = GuiaPrevencion.objects.select_related('categoria').prefetch_related(
            'tipos_riesgo'
        ).get(pk=guide.pk)
        return Response(
            self.get_serializer(guide).data,
            status=response_status,
        )
