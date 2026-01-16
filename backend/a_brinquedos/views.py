from rest_framework import viewsets
from .models import Brinquedo
from .serializers import BrinquedoSerializer, PeriodoDisponibilidadeSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class BrinquedoViewSet(viewsets.ModelViewSet):
    queryset = Brinquedo.objects.filter(ativo=True)
    serializer_class = BrinquedoSerializer
    
    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()
        
    @extend_schema(
    parameters=[
        OpenApiParameter(
            name='inicio',
            type=OpenApiTypes.DATETIME,
            location=OpenApiParameter.QUERY,
            examples=[
                OpenApiExample(
                    name='exemplo',
                    value='2026-01-31T10:00:00-03:00'
                    )
                ],
            required=True,
            description='Data/hora inicial do período'
        ),
        OpenApiParameter(
            name='fim',
            type=OpenApiTypes.DATETIME,
            location=OpenApiParameter.QUERY,
            examples=[
                OpenApiExample(
                    name='exemplo',
                    value='2026-01-31T10:00:00-03:00'
                    )
                ],
            required=True,
            description='Data/hora final do período'
        ),
    ]
)
    @action(detail=False, methods=['get'])
    def disponiveis(self, request):
        params = PeriodoDisponibilidadeSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        
        inicio = request.query_params.get('inicio')
        fim = request.query_params.get('fim')

        brinquedos = Brinquedo.objects.filter(ativo=True).exclude(
            itemlocacao__locacao__data_montagem__lt=fim,
            itemlocacao__locacao__data_devolucao__gt=inicio,
            
        ).distinct()

        serializer = self.get_serializer(brinquedos, many=True)
        return Response(serializer.data)