from appointments.serializers import UserSerializer
from django.contrib.auth import get_user_model
import json

User = get_user_model()

# Find a doctor
doctor = User.objects.filter(role='doctor').first()
if doctor:
    print(f"Doctor found: {doctor.username}")
    print(f"Fee in DB: {doctor.consultation_fee}")
    serializer = UserSerializer(doctor)
    print(f"Serialized data keys: {list(serializer.data.keys())}")
    if 'consultation_fee' in serializer.data:
        print(f"Serialized Fee: {serializer.data['consultation_fee']}")
    else:
        print("Serialized Fee: NOT PRESENT")
else:
    print("No doctor found.")
