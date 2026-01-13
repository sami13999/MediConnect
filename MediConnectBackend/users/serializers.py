from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    profile_picture = serializers.ImageField(required=False) # ✅ Handle Image Uploads

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 'role',
            'phone_number', 'gender', 'date_of_birth', 'address', 'city',
            'specialization', 'experience_years', 'consultation_fee', 'bio', 'hospital_name',
            'easypaisa_number', 'easypaisa_title', 'bank_name', 'bank_account_number', 'bank_account_title',
            'blood_group', 'allergies', 'emergency_contact',
            'profile_picture', 'average_rating', 'push_token' # ✅ Added push_token
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_average_rating(self, obj):
        # ✅ Calculates Real Rating from Review table
        if obj.role == 'doctor':
            avg = obj.reviews_received.aggregate(Avg('rating'))['rating__avg']
            return round(avg, 1) if avg else 0
        return None

    def validate_username(self, value):
        # ✅ Fixes "Space Trap" login error
        return value.strip().lower()

    def validate_email(self, value):
        return value.strip().lower()

    def validate_profile_picture(self, value):
        if value and hasattr(value, 'size'):
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large ( > 5mb )")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        user = self.Meta.model(**validated_data)
        
        # ✅ Secure Password Hashing
        if password is not None:
            user.set_password(password)
        
        # ✅ Force User Active
        user.is_active = True 
        
        user.save()
        return user