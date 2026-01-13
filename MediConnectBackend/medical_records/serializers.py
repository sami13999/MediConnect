from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='doctor.first_name')
    patient_name = serializers.ReadOnlyField(source='patient.first_name')

    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'doctor', 'doctor_name', 'patient_name', 'diagnosis', 'prescription', 'notes', 'created_at']
        read_only_fields = ['doctor']