import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

class Locacao(models.Model):
    uuid_publico = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    data_locacao = models.DateTimeField(auto_now_add=True)
    data_montagem = models.DateTimeField()
    data_devolucao = models.DateTimeField()
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    cliente = models.ForeignKey('a_clientes.Cliente', blank=False, null=False, on_delete=models.PROTECT, related_name='locacoes')
    brinquedo = models.ManyToManyField('a_brinquedos.Brinquedo', through='ItemLocacao')
    endereco = models.ForeignKey('a_locacoes.Endereco', on_delete=models.PROTECT, null=True, blank=True, related_name='locacoes')
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT, related_name='locacoes_criadas', null=True)
    cancelada = models.BooleanField(default=False)
    
    def delete(self, *args, **kwargs): 
        self.cancelada = True
        self.save()

    def clean(self):
        if self.data_montagem <= self.data_locacao:
            raise ValidationError("A data de montagem deve ser posterior à data de locação.")
        
        if self.data_devolucao <= self.data_montagem:
            raise ValidationError("A data de devolução deve ser posterior à data de locação.")
    
    def __str__(self):
        return f"Locação {self.id} - Cliente: {self.cliente.nome}"
    
class ItemLocacao(models.Model):
    locacao = models.ForeignKey(Locacao, on_delete=models.CASCADE)
    brinquedo = models.ForeignKey('a_brinquedos.Brinquedo', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('locacao', 'brinquedo')

    def __str__(self):
        return f"{self.brinquedo.tipo} na locação {self.locacao.id}"
    
    def clean(self):
        conflito = ItemLocacao.objects.filter(
            brinquedo=self.brinquedo,
            locacao__cancelada=False,
            locacao__data_montagem__lt=self.locacao.data_devolucao,
            locacao__data_devolucao__gt=self.locacao.data_montagem
        ).exclude(
            locacao=self.locacao
        )

        if conflito.exists():
            raise ValidationError(
                f"O brinquedo '{self.brinquedo.tipo}' já está alugado nesse período."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
class Endereco(models.Model):
    rua = models.CharField(max_length=255)
    numero = models.CharField(max_length=20)
    cidade = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.rua}, {self.numero}, {self.cidade}"