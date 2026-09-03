from rest_framework import serializers
from .models import Locacao, ItemLocacao, Endereco
from django.db import transaction
from a_brinquedos.models import Brinquedo
from django.core.exceptions import ValidationError as DjangoValidationError
from a_brinquedos.serializers import BrinquedoSerializer
from a_clientes.serializers import ClienteSerializer
from a_clientes.models import Cliente
from a_users.serializers import UserSerializer


class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ['id', 'rua', 'numero', 'cidade', 'bairro', 'estado', 'cep', 'complemento', 'latitude', 'longitude']

class PublicLocacaoSerializer(serializers.ModelSerializer):
    brinquedos = BrinquedoSerializer(source='brinquedo', many=True, read_only=True)
    endereco = EnderecoSerializer(allow_null=True, required=False)
    cliente = ClienteSerializer(read_only=True)

    class Meta:
        model = Locacao
        fields = ['id', 'data_montagem', 'data_devolucao', 'valor_total', 'cliente', 'brinquedos', 'endereco']

class LocacaoSerializer(serializers.ModelSerializer):
    brinquedos_ids  = serializers.ListField(child=serializers.IntegerField(), write_only=True) 
    brinquedos = BrinquedoSerializer(source='brinquedo', many=True, read_only=True)
    
    endereco = EnderecoSerializer(allow_null=True, required=False)
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source='cliente',
        write_only=True
    )
    cliente = ClienteSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    
        
    class Meta:
        model = Locacao
        read_only_fields = ["criado_por", "uuid_publico"]
        fields = ['id', 'uuid_publico', 'data_locacao', 'data_montagem', 'data_devolucao', 'valor_total', 'cliente_id','cliente', 'brinquedos_ids', 'brinquedos', 'endereco', "criado_por", "cancelada"]
        
    def create(self, validated_data):
        brinquedos_ids = validated_data.pop('brinquedos_ids')
        endereco_data = validated_data.pop('endereco', None)
        
        try:
            with transaction.atomic():
                endereco = Endereco.objects.create(**endereco_data) if endereco_data else None              
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
        tem_endereco = 'endereco' in validated_data
        endereco_data = validated_data.pop('endereco', None) if tem_endereco else None
        brinquedos_ids = validated_data.pop('brinquedos_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if tem_endereco:
            if endereco_data is None:
                instance.endereco = None
            elif instance.endereco:
                endereco = instance.endereco
                for attr, value in endereco_data.items():
                    setattr(endereco, attr, value)
                endereco.save()
            else:
                instance.endereco = Endereco.objects.create(**endereco_data)

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
