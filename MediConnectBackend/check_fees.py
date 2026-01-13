
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("-" * 50)
print(f"{'Username':<15} | {'First Name':<15} | {'Fee':<10}")
print("-" * 50)

for u in User.objects.filter(role='doctor'):
    print(f"{u.username:<15} | {u.first_name:<15} | {u.consultation_fee}")

print("-" * 50)
