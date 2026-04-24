from rest_framework import serializers
from .models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    locacoes = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'numero_celular', 'locacoes']
    
    def get_locacoes(self, obj):
        return list(obj.locacoes.filter(cancelada=False).values_list('id', flat=True))