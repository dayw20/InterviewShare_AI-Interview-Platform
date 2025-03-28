# backend/posts_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet
from .views import get_csrf_token
from .views import google_login

router = DefaultRouter()
router.register('posts', PostViewSet, basename='posts')

urlpatterns = [
    path('api/', include(router.urls)),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/social/', include('allauth.socialaccount.urls')),  
    path('auth/google/', google_login),
    path('csrf/', get_csrf_token),
]