from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("a_users.urls")),
    path('api/', include("a_api.urls")),
    
]
