from rest_framework import serializers
from .models import Brinquedo

class BrinquedoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brinquedo
        fields = ['id', 'tipo', 'ativo']
        

class PeriodoDisponibilidadeSerializer(serializers.Serializer):
    inicio = serializers.DateTimeField(required=True)
    fim = serializers.DateTimeField(required=True)
    
    def validate(self, data):
        if data['fim'] <= data['inicio']:
            raise serializers.ValidationError(
                "A data final deve ser maior que a data inicial."
            )
        return data