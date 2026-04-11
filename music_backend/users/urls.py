from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('register/', views.register_view, name='auth-register'),
    path('login/',    views.login_view,    name='auth-login'),
    path('logout/',   views.LogoutView.as_view(), name='auth-logout'),
    path('me/',       views.MeView.as_view(),     name='auth-me'),

    # JWT token refresh (built-in)
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]