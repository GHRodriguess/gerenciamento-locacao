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
        read_only_fields = ["criado_por"]
        fields = ['id', 'data_locacao', 'data_montagem', 'data_devolucao', 'valor_total', 'cliente_id','cliente', 'brinquedos_ids', 'brinquedos', 'endereco']
        
    def create(self, validated_data):
        brinquedos_ids = validated_data.pop('brinquedos_ids')
        endereco_data = validated_data.pop('endereco')
        
        try:
            with transaction.atomic():
                endereco = Endereco.objects.create(**endereco_data)                
                locacao = Locacao.objects.create(endereco=endereco, **validated_data)
                
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

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        brinquedos_ids = validated_data.pop('brinquedos_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if endereco_data:
            endereco = instance.endereco
            for attr, value in endereco_data.items():
                setattr(endereco, attr, value)
            endereco.save()

        if brinquedos_ids is not None:
            instance.itemlocacao_set.all().delete()

            for brinquedo_id in brinquedos_ids:
                brinquedo = Brinquedo.objects.get(id=brinquedo_id)
                ItemLocacao.objects.create(
                    locacao=instance,
                    brinquedo=brinquedo
                )

        instance.save()
        return instance
            