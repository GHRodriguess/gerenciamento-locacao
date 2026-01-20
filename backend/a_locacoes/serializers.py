from rest_framework import serializers
from .models import Locacao, ItemLocacao, Endereco
from django.db import transaction
from a_brinquedos.models import Brinquedo
from django.core.exceptions import ValidationError as DjangoValidationError
from a_brinquedos.serializers import BrinquedoSerializer
from a_clientes.serializers import ClienteSerializer
from a_clientes.models import Cliente
    
class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep']

class LocacaoSerializer(serializers.ModelSerializer):
    brinquedos_ids  = serializers.ListField(child=serializers.IntegerField(), write_only=True) 
    brinquedos = BrinquedoSerializer(source='brinquedo', many=True, read_only=True)
    
    endereco = EnderecoSerializer()
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source='cliente',
        write_only=True
    )
    cliente = ClienteSerializer(read_only=True)
        
    class Meta:
        model = Locacao
        fields = ['id', 'data_locacao', 'data_montagem', 'data_devolucao', 'valor_total', 'cliente_id','cliente', 'brinquedos_ids', 'brinquedos', 'endereco']
        
    def create(self, validated_data):
        print(validated_data)
        brinquedos_ids = validated_data.pop('brinquedos_ids')
        endereco_data = validated_data.pop('endereco')
        
        try:
            with transaction.atomic():
                endereco = Endereco.objects.create(**endereco_data)
                locacao = Locacao.objects.create(endereco=endereco,**validated_data)
                
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
