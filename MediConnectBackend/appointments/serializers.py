from rest_framework import serializers
from .models import Appointment, Referral, Availability
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'specialization', 'profile_picture']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.first_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.first_name')
    doctor_specialization = serializers.ReadOnlyField(source='doctor.specialization')

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'patient_name', 'doctor_name', 'doctor_specialization', 'date', 'time', 'reason', 'status', 'payment_receipt', 'payment_method']
        read_only_fields = ['patient', 'status']

class ReferralSerializer(serializers.ModelSerializer):
    source_doctor_name = serializers.ReadOnlyField(source='source_doctor.first_name')
    target_doctor_name = serializers.ReadOnlyField(source='target_doctor.first_name')
    target_doctor_specialization = serializers.ReadOnlyField(source='target_doctor.specialization')
    patient_name = serializers.ReadOnlyField(source='patient.first_name')

    class Meta:
        model = Referral
        fields = [
            'id', 'source_doctor', 'target_doctor', 'patient', 'reason', 'status', 'created_at',
            'source_doctor_name', 'target_doctor_name', 'target_doctor_specialization', 'patient_name'
        ]
        read_only_fields = ['source_doctor', 'status']

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'doctor', 'day', 'time_slot', 'is_available']
        read_only_fields = ['doctor']