from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Define how the user list looks in the Admin Panel
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # 1. Columns to show in the list view
    list_display = ('username', 'email', 'role', 'specialization', 'hospital_name', 'is_staff')
    
    # 2. Filters on the right side
    list_filter = ('role', 'is_staff', 'is_active', 'specialization')
    
    # 3. Searchable fields
    search_fields = ('username', 'email', 'specialization', 'hospital_name')

    # 4. Fields to show when editing a specific user
    # We append 'role' and 'phone_number' to the default fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ('Medical / Profile Info', {'fields': ('role', 'profile_picture', 'phone_number', 'specialization', 'hospital_name', 'consultation_fee', 'push_token')}),
    )
    
    # 5. Fields to show when creating a new user
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'phone_number', 'email', 'first_name', 'last_name')}),
    )

# Register the model
admin.site.register(CustomUser, CustomUserAdmin)