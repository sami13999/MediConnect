from rest_framework import viewsets, permissions
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.role == 'doctor':
            queryset = MedicalRecord.objects.filter(doctor=user)
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
            return queryset.order_by('-created_at')
        return MedicalRecord.objects.filter(patient=user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically set doctor to current user
        serializer.save(doctor=self.request.user)