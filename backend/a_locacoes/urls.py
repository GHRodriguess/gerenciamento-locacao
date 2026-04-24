from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocacaoViewSet, PublicLocacaoAPIView

router = DefaultRouter()
router.register(r'locacoes', LocacaoViewSet, basename='locacao')

urlpatterns = [
    path('locacoes/publica/<uuid:uuid>/', PublicLocacaoAPIView.as_view(), name='public-locacao'),
    path('', include(router.urls)),
]
