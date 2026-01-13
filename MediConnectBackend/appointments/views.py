from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import Appointment, Referral, Availability
from .serializers import AppointmentSerializer, ReferralSerializer, AvailabilitySerializer
from users.serializers import UserSerializer
from django.db.models import Q

User = get_user_model()

class DoctorListViewSet(viewsets.ReadOnlyModelViewSet):
    """ List all users who are doctors with Search and Filtering """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'specialization', 'hospital_name']

    def get_queryset(self):
        queryset = User.objects.filter(role='doctor')
        exclude_id = self.request.query_params.get('exclude_id')
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        return queryset

    @action(detail=False, methods=['get'])
    def recommend(self, request):
        symptoms = request.query_params.get('symptoms', '').lower()
        
        # 🧪 Logic-based "AI" Matching
        mapping = {
            "heart": "Cardiologist",
            "chest pain": "Cardiologist",
            "skin": "Dermatologist",
            "rash": "Dermatologist",
            "itch": "Dermatologist",
            "fever": "General Physician",
            "flu": "General Physician",
            "cough": "General Physician",
            "bone": "Orthopedic",
            "fracture": "Orthopedic",
            "headache": "Neurologist",
            "brain": "Neurologist",
        }

        target_specialization = None
        for keyword, spec in mapping.items():
            if keyword in symptoms:
                target_specialization = spec
                break
        
        if target_specialization:
            doctors = self.get_queryset().filter(specialization__icontains=target_specialization)
            serializer = self.get_serializer(doctors, many=True)
            return Response(serializer.data)
        
        return Response({"detail": "No specific match found. Please search manually."}, status=404)

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Appointment.objects.filter(doctor=user).order_by('date', 'time')
        return Appointment.objects.filter(patient=user).order_by('date', 'time')

    def perform_create(self, serializer):
        # Automatically set the patient to the logged-in user
        serializer.save(patient=self.request.user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['confirmed', 'cancelled']:
            appointment.status = new_status
            appointment.save()
            
            # Send Notification if confirmed
            if new_status == 'confirmed':
                self.send_push_notification(appointment.patient, "Appointment Confirmed! ✅", f"Your appointment with Dr. {appointment.doctor.last_name} is confirmed.")
            
            return Response({'status': 'status updated'})
        return Response({'error': 'Invalid status'}, status=400)

    def send_push_notification(self, user, title, body):
        if not user.push_token:
            print(f"⚠️ No push token for {user.username}. Skipping notification.")
            return

        print(f"🔔 SENDING PUSH TO {user.username}: {title} - {body}")
        
        try:
            from exponent_server_sdk import PushClient, PushMessage
            message = PushMessage(to=user.push_token, title=title, body=body)
            PushClient().publish(message)
            print("✅ Push sent via SDK")
        except Exception as e:
            print(f"❌ SDK Error/Not Installed: {e}")
            print(f"MOCK NOTIFICATION: {{'to': '{user.push_token}', 'title': '{title}', 'body': '{body}'}}")

class ReferralViewSet(viewsets.ModelViewSet):
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Referral.objects.filter(Q(source_doctor=user) | Q(target_doctor=user)).order_by('-created_at')
        return Referral.objects.filter(patient=user).order_by('-created_at')

    def perform_create(self, serializer):
        # source_doctor is the logged-in user (must be a doctor)
        if self.request.user.role != 'doctor':
             from rest_framework.exceptions import ValidationError
             raise ValidationError("Only doctors can create referrals.")
             
        serializer.save(source_doctor=self.request.user)

class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        doctor_id = self.request.query_params.get('doctor_id')
        day = self.request.query_params.get('day')
        
        queryset = Availability.objects.all()
        
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        elif user.role == 'doctor':
            queryset = queryset.filter(doctor=user)
        else:
            return Availability.objects.none()
            
        if day:
            queryset = queryset.filter(day=day)
            
        return queryset.order_by('time_slot')

    def perform_create(self, serializer):
        if self.request.user.role != 'doctor':
            raise ValidationError("Only doctors can manage availability.")
        serializer.save(doctor=self.request.user)