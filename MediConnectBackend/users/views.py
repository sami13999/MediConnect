from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
import random
import datetime

User = get_user_model()

# 1. Register View (Keep existing code if you have it)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# 2. Login View (Keep existing code if you have it)
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        push_token = request.data.get('push_token') # ✅ New: Capture push token

        user = authenticate(username=username, password=password)
        
        if user:
            # ✅ Save push token if provided
            if push_token:
                user.push_token = push_token
                user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'id': user.id
            })
        
        return Response({'detail': 'Invalid Credentials'}, status=401)

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# 4. ✅ NEW: Doctor Analytics
class DoctorStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'doctor':
            return Response({"error": "Only doctors can access stats"}, status=403)
        
        from appointments.models import Appointment
        from django.db.models import Sum
        
        appointments = Appointment.objects.filter(doctor=request.user)
        total_appointments = appointments.count()
        pending_requests = appointments.filter(status='pending').count()
        
        # Unique Patients
        total_patients = appointments.values('patient').distinct().count()
        
        # Revenue: Sum of fee for confirmed/completed
        revenue = appointments.filter(status__in=['confirmed', 'completed']).count() * (request.user.consultation_fee or 0)

        return Response({
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "pending_requests": pending_requests,
            "revenue": revenue
        })

# 3. ✅ NEW: Profile View (Get & Update Profile)
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        # Returns the currently logged-in user
        return self.request.user

    def patch(self, request, *args, **kwargs):
        print(f"🔄 PROFILE UPDATE REQUEST: {request.user.username}")
        print(f"📦 DATA: {request.data}")
        return super().patch(request, *args, **kwargs)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not request.user.check_password(old_password):
            return Response({"error": "Wrong current password"}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password updated successfully"})

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=400)
        
        try:
            user = User.objects.get(email=email)
            otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
            user.reset_otp = otp
            user.reset_otp_expiry = timezone.now() + datetime.timedelta(minutes=10)
            user.save()
            
            # SIMULATION: Return OTP in response since no SMTP is configured
            return Response({
                "message": "OTP sent to email (Simulated)",
                "otp": otp # REMOVE THIS IN PRODUCTION
            })
        except User.DoesNotExist:
            # We return 200 even if user doesn't exist for security (avoid email enumeration)
            return Response({"message": "If an account exists with this email, an OTP has been sent."})

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([email, otp, new_password]):
            return Response({"error": "All fields are required"}, status=400)

        try:
            user = User.objects.get(email=email, reset_otp=otp)
            if user.reset_otp_expiry < timezone.now():
                return Response({"error": "OTP has expired"}, status=400)
            
            user.set_password(new_password)
            user.reset_otp = None
            user.reset_otp_expiry = None
            user.save()
            return Response({"message": "Password has been reset successfully"})
        except User.DoesNotExist:
            return Response({"error": "Invalid email or OTP"}, status=400)