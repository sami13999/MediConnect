from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    sender_id = serializers.ReadOnlyField(source='sender.id')
    sender_role = serializers.ReadOnlyField(source='sender.role')

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'sender_name', 'sender_role', 'receiver', 'content', 'image', 'timestamp', 
                  'is_deleted_globally', 'is_edited', 'is_pinned']
        read_only_fields = ['sender', 'timestamp']