from rest_framework import viewsets
from .models import Brinquedo
from .serializers import BrinquedoSerializer
from rest_framework.response import Response
from rest_framework.decorators import action

class BrinquedoViewSet(viewsets.ModelViewSet):
    queryset = Brinquedo.objects.filter(ativo=True)
    serializer_class = BrinquedoSerializer
    
    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()
        
    @action(detail=False, methods=['get'])
    def disponiveis(self, request):
        brinquedos_disponiveis = Brinquedo.objects.filter(ativo=True, disponivel=True)

        serializer = self.get_serializer(brinquedos_disponiveis, many=True)
        
        return Response(serializer.data)