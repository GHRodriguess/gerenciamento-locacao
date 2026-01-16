from django.contrib import admin
from .models import Locacao, ItemLocacao

# Register your models here.
admin.site.register(Locacao)
admin.site.register(ItemLocacao)