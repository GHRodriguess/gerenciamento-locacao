from rest_framework import viewsets
from .models import Locacao
from .serializers import LocacaoSerializer

class LocacaoViewSet(viewsets.ModelViewSet):
    queryset = Locacao.objects.all()
    serializer_class = LocacaoSerializer
