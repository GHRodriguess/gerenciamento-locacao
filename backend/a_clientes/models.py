from django.db import models
from django.core.validators import RegexValidator

class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    numero_celular = models.CharField(
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\(\d{2}\) \d{5}-\d{4}$',
                message='Use o formato (99) 99999-9999'
            )
        ]
    )
    
    def __str__(self):
        return f"{self.nome}"