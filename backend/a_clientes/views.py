from rest_framework import viewsets 
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cliente
from .serializers import ClienteSerializer
from a_locacoes.serializers import LocacaoSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    @action(detail=True, methods=['get'])
    def locacoes(self, request, pk=None):
        cliente = self.get_object()
        locacoes = cliente.locacoes.all()
        serializer = LocacaoSerializer(locacoes, many=True)
        return Response(serializer.data)