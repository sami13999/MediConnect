from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Appointment

User = get_user_model()

class AppointmentBookingTest(APITestCase):
    def setUp(self):
        # 1. Create Patient
        self.patient = User.objects.create_user(
            username='testpatient', 
            password='password123',
            role='patient'
        )
        # 2. Create Doctor
        self.doctor = User.objects.create_user(
            username='testdoctor', 
            password='password123',
            role='doctor',
            specialization='Cardiologist'
        )
        # 3. Authenticate
        self.client.force_authenticate(user=self.patient)

    def test_book_appointment(self):
        url = reverse('appointments-list') # ViewSet default name with basename 'appointments'
        data = {
            "doctor": self.doctor.id,
            "date": "2026-05-20",
            "time": "10:00:00",
            "reason": "Routine Checkup"
        }
        response = self.client.post(url, data, format='json')
        
        # Verify
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        self.assertEqual(Appointment.objects.get().status, 'pending')
        print("✅ Unit Test: Appointment Booking Success!")
