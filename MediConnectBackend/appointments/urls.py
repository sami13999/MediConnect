from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, DoctorListViewSet, ReferralViewSet, AvailabilityViewSet

router = DefaultRouter()
router.register(r'doctors', DoctorListViewSet, basename='doctors')
router.register(r'referrals', ReferralViewSet, basename='referrals')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'', AppointmentViewSet, basename='appointments')

urlpatterns = [
    path('', include(router.urls)),
]