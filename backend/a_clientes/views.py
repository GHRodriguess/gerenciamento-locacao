from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cliente
from .serializers import ClienteSerializer
from a_locacoes.serializers import LocacaoSerializer
from django.db.models.deletion import ProtectedError

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    def destroy(self, request, *args, **kwargs):
        cliente = self.get_object()
        
        try:
            cliente.delete()
        except ProtectedError:
            return Response(
                {
                    "error": "CLIENTE_COM_LOCACOES",
                    "message": "Este cliente possui locações e não pode ser removido."
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'])
    def locacoes(self, request, pk=None):
        cliente = self.get_object()
        locacoes = cliente.locacoes.all()
        serializer = LocacaoSerializer(locacoes, many=True)
        return Response(serializer.data)