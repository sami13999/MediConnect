from django.urls import path
from .views import RegisterView, LoginView, UserProfileView, DoctorStatsView, ChangePasswordView, RequestPasswordResetView, ResetPasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    # ✅ Token Refresh Endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('doctor-stats/', DoctorStatsView.as_view(), name='doctor-stats'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('request-reset/', RequestPasswordResetView.as_view(), name='request-reset'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]