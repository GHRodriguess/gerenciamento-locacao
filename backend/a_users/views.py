from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.permissions import AllowAny

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def reset_password(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")
        
        if not all([uid, token, password]):
            return Response(
                {"detail": "Dados incompletos"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response(
                {"detail": "Usuário inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response(
                {"detail": "Token inválido ou expirado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        
        user.set_password(password)
        user.save()
        
        return Response(
            {"detail": "Senha redefinida com sucesso"},
            status=status.HTTP_200_OK
        )