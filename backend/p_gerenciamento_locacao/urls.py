from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include("a_api.urls")),
    path('', include("a_users.urls")),
    path('', include("a_brinquedos.urls")),
    path('', include("a_clientes.urls")),
    path('', include("a_locacoes.urls")),
]
