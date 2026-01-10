from django.db import models

class Brinquedo(models.Model):
    brinquedos = [
        ('cama-elastica', 'Cama Elástica'),
        ('piscina-de-bolinhas', 'Piscina de Bolinhas'),
    ]

    tipo = models.CharField(max_length=50, choices=brinquedos)
    disponivel = models.BooleanField(default=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome