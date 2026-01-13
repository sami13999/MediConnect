from django.contrib import admin
from .models import Appointment

# Register your models here.

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'time', 'status')
    list_filter = ('status', 'date', 'doctor__specialization')
    search_fields = ('patient__username', 'doctor__username', 'reason')
    actions = ['mark_as_completed']

    @admin.action(description='Mark selected appointments as Completed')
    def mark_as_completed(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f"Successfully marked {queryset.count()} appointments as completed.")
