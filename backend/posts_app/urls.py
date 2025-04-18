from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, ProblemViewSet, UserProfileViewSet, get_csrf_token, google_login, code_verification, ask_for_hint_solution_feedback
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def test_api(request):
    return JsonResponse({"message": "Test API working"})

router = DefaultRouter()
router.register('users', UserProfileViewSet, basename='users')
router.register('posts', PostViewSet, basename='posts')
router.register('problems', ProblemViewSet, basename='problems')

urlpatterns = [
    path('api/', include(router.urls)),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/social/', include('allauth.socialaccount.urls')),  
    path('auth/google/', google_login),
    path('csrf/', get_csrf_token),
    path('api/code-verification/', code_verification),
    path('api/test/', test_api),
    path('api/ask/', ask_for_hint_solution_feedback, name='ask_for_hint_solution_feedback'),  
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)