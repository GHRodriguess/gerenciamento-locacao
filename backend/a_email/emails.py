from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(BASE_DIR, '.env'))
base_url_frontend = os.getenv("BASE_URL_FRONTEND")

def reset_password(user):
    token = PasswordResetTokenGenerator().make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    reset_link = f"{base_url_frontend}/redefinir-senha/{uid}/{token}"

    context = {
        'user': user,
        'reset_link': reset_link
    }

    html_content = render_to_string(
        'reset_password.html',
        context
    )

    email = EmailMultiAlternatives(
        subject='Redefinição de senha',
        body='Use um cliente de email compatível com HTML.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send()
