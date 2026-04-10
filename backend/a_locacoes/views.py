from rest_framework import viewsets
from .models import Locacao
from .serializers import LocacaoSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class LocacaoViewSet(viewsets.ModelViewSet):
    queryset = Locacao.objects.all()
    serializer_class = LocacaoSerializer
    
    def get_queryset(self):
        return Locacao.objects.filter(cancelada=False).order_by('data_montagem')

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
        
    @action(detail=False, methods=["get"])
    def todas(self, request):
        locacoes = Locacao.objects.all()
        serializer = self.get_serializer(locacoes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["patch"])
    def restaurar(self, request, pk=None):
        locacao = Locacao.objects.get(pk=pk)
        locacao.cancelada = False
        locacao.save()
        return Response({"status": "Locação restaurada"})