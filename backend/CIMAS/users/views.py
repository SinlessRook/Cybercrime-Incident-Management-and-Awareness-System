from datetime import datetime
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import json
from .models import Investigators
from incidents.models import IncidentAssignments

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_investigators(request):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'You do not have permission to view this.'}, status=403)
    investigators = Investigators.objects.select_related('user').all()
    investigators_data = [{
        'id': inv.user.id,
        'email': inv.user.email,
        'first_name': inv.user.first_name,
        'last_name': inv.user.last_name,
        "department": inv.department if hasattr(inv, 'department') else '',
        'cases_assigned': IncidentAssignments.objects.filter(assigned_to=inv.user).count(),
        'cases_resolved': IncidentAssignments.objects.filter(assigned_to=inv.user, incident__status='resolved').count(),
    } for inv in investigators]

    return JsonResponse({'investigators': investigators_data})

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['name'] = user.first_name + " " + user.last_name
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        role = data.get('role', 'victim')  # default role = victim

        if not all([email, password, first_name, last_name]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)

        # create user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=data.get('phone', None)
        )
        tokens = get_tokens_for_user(user)

        return JsonResponse({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': tokens
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        user = authenticate(username=email, password=password)

        if user is not None:
            # Update last login
            user.last_login = datetime.now()
            user.save()

            tokens = get_tokens_for_user(user)
            return JsonResponse({
                'tokens': tokens
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return JsonResponse({'message': 'Successfully logged out'})
    except Exception:
        return JsonResponse({'error': 'Invalid token'}, status=400)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def get_me__update_me(request):
    user = request.user
    if request.method == 'GET':
        return JsonResponse({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'bio': user.bio,
        'role': user.role,
    })
    else:
        try:
            data = json.loads(request.body)
            user = request.user

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                if User.objects.exclude(id=user.id).filter(email=data['email']).exists():
                    return JsonResponse({'error': 'Email already exists'}, status=400)
                user.email = data['email']
            if 'phone' in data:
                user.phone = data['phone']
            if 'bio' in data:
                user.bio = data['bio']

            user.save()
            return JsonResponse({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    role = request.user.role
    if role != 'admin':
        return JsonResponse({'error': 'You do not have permission to view this.'}, status=403)
    users = User.objects.all()
    users_data = [{
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'is_active': user.is_active,
        'cases_assigned': IncidentAssignments.objects.filter(assigned_to=user).count() if hasattr(user, 'id') else 0,
        'cases_resolved': IncidentAssignments.objects.filter(assigned_to=user, incident__status='resolved').count() if hasattr(user, 'id') else 0,
        'cases_pending': IncidentAssignments.objects.filter(assigned_to=user, incident__status='pending').count() if hasattr(user, 'id') else 0,
    } for user in users]

    return JsonResponse({'users': users_data})

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_user(request, id):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'You do not have permission to perform this action.'}, status=403)
    try:
        user = User.objects.get(id=id)

        if request.method == 'GET':
            return JsonResponse({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'is_staff': user.is_staff
            })

        elif request.method == 'PUT':
            data = json.loads(request.body)

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                if User.objects.exclude(id=user.id).filter(email=data['email']).exists():
                    return JsonResponse({'error': 'Email already exists'}, status=400)
                user.email = data['email']
            if 'is_active' in data and isinstance(data['is_active'], bool):
                user.is_active = data['is_active']
            if 'is_staff' in data and isinstance(data['is_staff'], bool):
                user.is_staff = data['is_staff']
            if 'role' in data:
                user.role = data['role']

            user.save()
            return JsonResponse({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'is_staff': user.is_staff
            })

        elif request.method == 'DELETE':
            if user.id == request.user.id:
                return JsonResponse({'error': 'Cannot delete yourself'}, status=400)
            user.delete()
            return JsonResponse({'message': 'User deleted successfully'})

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
