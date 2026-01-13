from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Message, ChatConnection
from .serializers import MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).exclude(hidden_by=user).distinct()

    def create(self, request, *args, **kwargs):
        sender = request.user
        receiver_id = request.data.get('receiver')
        
        if not receiver_id:
            return Response({"error": "Receiver required"}, status=400)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # 1. Determine who is Doctor and who is Patient
        if sender.role == 'patient':
            patient, doctor = sender, receiver
        else:
            patient, doctor = receiver, sender

        # 2. Get or Create the Connection
        connection, created = ChatConnection.objects.get_or_create(
            patient=patient, doctor=doctor
        )

        # 3. ENFORCE RULE: If patient sends msg, check if accepted
        if sender.role == 'patient' and not connection.is_accepted:
            # Check if this is the very first message
            previous_msgs = Message.objects.filter(sender=sender, receiver=receiver).count()
            if previous_msgs >= 1:
                return Response(
                    {"code": "pending_approval", "detail": "Doctor must accept your request."}, 
                    status=403
                )

        # 4. Save Message
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=sender)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def accept_request(self, request):
        if request.user.role != 'doctor':
            return Response({"error": "Only doctors can accept"}, status=403)
            
        patient_id = request.data.get('patient_id')
        try:
            conn = ChatConnection.objects.get(doctor=request.user, patient_id=patient_id)
            conn.is_accepted = True
            conn.save()
            return Response({"status": "accepted"})
        except ChatConnection.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

    @action(detail=False, methods=['get'])
    def my_patients(self, request):
        # Returns list of patients who texted this doctor
        connections = ChatConnection.objects.filter(doctor=request.user)
        data = []
        for conn in connections:
            data.append({
                "id": conn.patient.id,
                "first_name": conn.patient.first_name,
                "last_name": conn.patient.last_name,
                "profile_picture": conn.patient.profile_picture.url if conn.patient.profile_picture else None,
                "is_accepted": conn.is_accepted
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def conversation(self, request):
        other_user_id = request.query_params.get('with_user')
        if not other_user_id:
            return Response({"error": "Missing user ID"}, status=400)

        my_id = request.user.id
        
        # Check acceptance status
        is_accepted = False
        try:
            if request.user.role == 'patient':
                c = ChatConnection.objects.get(patient=request.user, doctor_id=other_user_id)
            else:
                c = ChatConnection.objects.get(doctor=request.user, patient_id=other_user_id)
            is_accepted = c.is_accepted
        except:
            pass 

        messages = Message.objects.filter(
            (Q(sender_id=my_id) & Q(receiver_id=other_user_id)) |
            (Q(sender_id=other_user_id) & Q(receiver_id=my_id))
        ).exclude(hidden_by=request.user).order_by('timestamp').distinct()
        
        serializer = self.get_serializer(messages, many=True)
        
        # Return Both Messages AND Status
        return Response({
            "messages": serializer.data,
            "status": "accepted" if is_accepted else "pending"
        })

    @action(detail=True, methods=['post'])
    def delete_message(self, request, pk=None):
        message = self.get_object()
        delete_type = request.data.get('type', 'me') # 'me' or 'everyone'
        
        if delete_type == 'everyone':
            if message.sender != request.user:
                return Response({"error": "Only sender can delete for everyone"}, status=403)
            message.is_deleted_globally = True
            message.content = "🚫 This message was deleted"
            if message.image:
                message.image.delete()
            message.save()
        else:
            # Delete for me
            message.hidden_by.add(request.user)
            
        return Response({"status": "deleted"})

    @action(detail=True, methods=['patch'])
    def edit_message(self, request, pk=None):
        message = self.get_object()
        if message.sender != request.user:
            return Response({"error": "Only sender can edit"}, status=403)
        
        new_content = request.data.get('content')
        if message.is_deleted_for_everyone:
             return Response({"error": "Cannot edit deleted message"}, status=400)
             
        message.content = new_content
        message.is_edited = True
        message.save()
        return Response(MessageSerializer(message).data)

    @action(detail=True, methods=['post'])
    def pin_message(self, request, pk=None):
        message = self.get_object()
        message.is_pinned = not message.is_pinned
        message.save()
        return Response({"status": "pinned", "is_pinned": message.is_pinned})