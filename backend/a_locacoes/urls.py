from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocacaoViewSet

router = DefaultRouter()
router.register(r'locacoes', LocacaoViewSet, basename='locacao')

urlpatterns = [
    path('', include(router.urls)),
]