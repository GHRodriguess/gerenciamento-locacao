from django.db import models

class Brinquedo(models.Model):
    brinquedos = [
        ('cama-elastica-2,49-metros', 'Cama Elástica - 2,49 metros'),
        ('cama-elastica-3-metros', 'Cama Elástica - 3 metros'),
        ('cama-elastica-5-metros', 'Cama Elástica - 5 metros'),
        ('piscina-de-bolinhas', 'Piscina de Bolinhas'),
    ]

    tipo = models.CharField(max_length=50, choices=brinquedos)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.tipo