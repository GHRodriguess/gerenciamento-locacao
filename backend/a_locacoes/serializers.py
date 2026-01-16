from rest_framework import serializers
from .models import Locacao, ItemLocacao
from django.db import transaction
from a_brinquedos.models import Brinquedo
from django.core.exceptions import ValidationError as DjangoValidationError
from a_brinquedos.serializers import BrinquedoSerializer

class LocacaoSerializer(serializers.ModelSerializer):
    brinquedos_ids  = serializers.ListField(child=serializers.IntegerField(), write_only=True)
        
        
    brinquedos = BrinquedoSerializer(source='brinquedo', many=True, read_only=True)
        
    class Meta:
        model = Locacao
        fields = ['id', 'data_locacao', 'data_montagem', 'data_devolucao', 'valor_total', 'cliente', 'brinquedos_ids', 'brinquedos']
        
    def create(self, validated_data):
        brinquedos_ids = validated_data.pop('brinquedo')
        
        try:
            with transaction.atomic():
                locacao = Locacao.objects.create(**validated_data)
                
                for brinquedo_id in brinquedos_ids:
                    brinquedo = Brinquedo.objects.get(id=brinquedo_id)

                    item = ItemLocacao(
                        locacao=locacao,
                        brinquedo=brinquedo
                    )
                    item.full_clean() 
                    item.save()
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "error": "BRINQUEDO_INDISPONIVEL",
                "message": e.messages
            })

        return locacao