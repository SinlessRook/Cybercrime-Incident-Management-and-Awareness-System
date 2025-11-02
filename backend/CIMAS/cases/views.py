from datetime import datetime, timedelta
import random
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from incidents.models import IncidentAssignments, Incidents
from rest_framework.permissions import IsAuthenticated,IsAdminUser

from django.shortcuts import get_object_or_404
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_case(request, id):
    incident = get_object_or_404(Incidents, pk=id)

    incident.title = request.data.get("title", incident.title)
    incident.description = request.data.get("description", incident.description)
    incident.status = request.data.get("status", incident.status)
    incident.save()

    # Handle priority update
    if "priority" in request.data:
        try:
            assignment = IncidentAssignments.objects.get(incident=incident)
            assignment.priority = request.data.get("priority", assignment.priority)
            assignment.save()
        except IncidentAssignments.DoesNotExist:
            # For unassigned cases, create assignment with priority but no assigned_to
            # This allows tracking priority even before assignment
            priority = request.data.get("priority", "medium")
            IncidentAssignments.objects.create(
                incident=incident,
                priority=priority,
                assigned_to=None
            )

    return Response({"message": "Case updated successfully!"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_case_details(request, id):
    try:
        assignment = IncidentAssignments.objects.select_related('incident', 'incident__crime_type', 'incident__user', 'incident__location').get(incident__id=id)
        incident = assignment.incident
    except IncidentAssignments.DoesNotExist:
        return Response({"error": "Case not found or not assigned to you"}, status=status.HTTP_404_NOT_FOUND)

    data = {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "crime_type": incident.crime_type.crime_type_name if incident.crime_type else "Unknown",
        "status": incident.status,
        "priority": assignment.priority or "medium",
        "assigned_date": assignment.assigned_at,
        "deadline": (assignment.assigned_deadline.strftime('%Y-%m-%dT%H:%M:%S') 
                     if assignment.assigned_deadline else "not set"),
        "reported_by": f"{incident.user.first_name} {incident.user.last_name}" if incident.user else "Unknown",
        "location": (f"{incident.location.address}, {incident.location.city}, {incident.location.state}, {incident.location.country}" 
                     if incident.location else "Unknown"),
        "progress": random.randint(0, 100),
        "evidence_count": random.randint(0, 5),
        "updates_count": random.randint(0, 10),
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_case(request, id, userId):
	try:
		incident = Incidents.objects.get(id=id)
	except Incidents.DoesNotExist:
		return Response({"error": "Incident not found"}, status=status.HTTP_404_NOT_FOUND)

	if incident.status == 'resolved':
		return Response({"error": "Incident is not open for assignment"}, status=status.HTTP_400_BAD_REQUEST)

	if IncidentAssignments.objects.filter(incident=incident).exists():
		return Response({"error": "Incident is already assigned"}, status=status.HTTP_400_BAD_REQUEST)

	try:
		from users.models import CustomUser
		user = CustomUser.objects.get(id=userId)
	except CustomUser.DoesNotExist:
		return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

	assignment = IncidentAssignments.objects.create(incident=incident, assigned_to=user)
	incident.status = 'Assigned'
	incident.save()

	return Response({
		"assignment_id": assignment.id,
		"case_id": incident.id,
		"case_description": incident.description,
		"assigned_to": user.first_name + " " + user.last_name,
	}, status=status.HTTP_201_CREATED)
	

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assigned_cases_me(request):
	userId = request.user.id
	user_role = request.user.role
	if user_role != 'investigator' and user_role != 'admin':
		return Response({"error": "Only investigators and admins can view assigned cases"}, status=status.HTTP_403_FORBIDDEN)
	if user_role == 'admin':
		# Admins can view all assigned cases
		assigned_cases = IncidentAssignments.objects.filter(assigned_to__isnull=False)
	else:
		assigned_cases = IncidentAssignments.objects.filter(assigned_to__id=userId)
	data = [{
		"id": ac.incident.id if ac.incident.id else 0,
		"title": ac.incident.title if ac.incident.title else "No Title",
		"description": ac.incident.description if ac.incident.description else "No Description",
		"crime_type": ac.incident.crime_type.crime_type_name if ac.incident.crime_type and ac.incident.crime_type.crime_type_name else "Unknown",
		"status": ac.incident.status if ac.incident.status else "unknown",
		"priority": ac.priority if ac.priority else "medium",
		"assigned_date": ac.assigned_at if ac.assigned_at else "Unknown",
		"deadline": (ac.assigned_deadline if ac.assigned_deadline else datetime.now() + timedelta(days=17)).strftime('%Y-%m-%dT%H:%M:%S') if ac.assigned_deadline else "not set",
		"reported_by": (ac.incident.user.first_name + " " + ac.incident.user.last_name) if ac.incident.user and ac.incident.user.first_name and ac.incident.user.last_name else "Unknown",
		"location": (ac.incident.location.address + " " + ac.incident.location.city + " " + ac.incident.location.state + " " + ac.incident.location.country) if ac.incident.location and ac.incident.location.address and ac.incident.location.city and ac.incident.location.state and ac.incident.location.country else "Unknown",
		"progress": random.randint(0, 100),
		"evidence_count": random.randint(0, 5), 
		"updates_count": random.randint(0, 10),  
	} for ac in assigned_cases]
	return Response(data) 

@api_view(['POST'])
def reassign_case(request, id, userId):
	try:
		incident = Incidents.objects.get(id=id)
	except Incidents.DoesNotExist:
		return Response({"error": "Incident not found"}, status=status.HTTP_404_NOT_FOUND)

	if incident.status == 'resolved' and incident.status != 'Assigned':
		return Response({"error": "Incident is not open for reassignment"}, status=status.HTTP_400_BAD_REQUEST)

	try:
		from users.models import CustomUser
		user = CustomUser.objects.get(id=userId)
	except CustomUser.DoesNotExist:
		return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

	try:
		assignment = IncidentAssignments.objects.get(incident=incident)
		assignment.assigned_to = user
		assignment.save()
	except IncidentAssignments.DoesNotExist:
		assignment = IncidentAssignments.objects.create(incident=incident, assigned_to=user)

	incident.status = 'Assigned'
	incident.save()

	return Response({
		"assignment_id": assignment.id,
		"case_id": incident.id,
		"case_description": incident.description,
		"assigned_to": user.first_name + " " + user.last_name,
	}, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_unassigned_cases(request):
	# Get unassigned cases (cases without assigned_to in IncidentAssignments)
	unassigned_cases = (Incidents.objects.exclude(status="resolved")
                        .exclude(id__in=IncidentAssignments.objects.filter(assigned_to__isnull=False)
                                .values_list('incident_id', flat=True)))
	
	data = []
	for uc in unassigned_cases:
		# Try to get priority from IncidentAssignments if it exists
		try:
			assignment = IncidentAssignments.objects.get(incident=uc)
			priority = assignment.priority if assignment.priority else "medium"
		except IncidentAssignments.DoesNotExist:
			priority = "medium"
		
		data.append({
			"case_id": uc.id,
			"id": uc.id,
			"title": uc.title,
			"case_description": uc.description,
			"description": uc.description,
			"crime_type": uc.crime_type.crime_type_name if uc.crime_type else "Unknown",
			"status": uc.status if uc.status else "in_progress",
			"priority": priority,
			"reported_at": uc.reported_at.isoformat() if uc.reported_at else None,
			"reported_by": f"{uc.user.first_name} {uc.user.last_name}" if uc.user else "Unknown",
			"location": (f"{uc.location.address}, {uc.location.city}, {uc.location.state}, {uc.location.country}" 
						if uc.location else "Unknown"),
		})
	
	return Response(data)
	
