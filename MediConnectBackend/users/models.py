from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    )
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    
    # --- COMMON PROFILE FIELDS ---
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True) # ✅ New
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)

    # --- DOCTOR SPECIFIC ---
    specialization = models.CharField(max_length=100, blank=True, null=True)
    experience_years = models.IntegerField(blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bio = models.TextField(blank=True, null=True, help_text="Short biography")
    hospital_name = models.CharField(max_length=100, blank=True, null=True)

    # --- PAYMENT DETAILS ---
    easypaisa_number = models.CharField(max_length=15, blank=True, null=True)
    easypaisa_title = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_account_title = models.CharField(max_length=100, blank=True, null=True)

    # --- PATIENT SPECIFIC ---
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    push_token = models.CharField(max_length=255, blank=True, null=True) # ✅ For Push Notifications
    reset_otp = models.CharField(max_length=6, blank=True, null=True)
    reset_otp_expiry = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"