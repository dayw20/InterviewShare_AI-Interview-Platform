from django.urls import path
from crackjob import views

urlpatterns = [
    path('coding', views.code_verification, name='coding'),
    path('problems', views.problem_list, name='problem_list'),
]