from datetime import datetime
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from incidents.models import IncidentAssignments,Incidents
from evidence.models import Evidence
from django.db.models.functions import TruncWeek
from django.db.models import Count, Avg
from datetime import timedelta
from users.models import CustomUser as User
from awareness.models import CrimeTypes

@permission_classes([IsAuthenticated])
@api_view(['GET'])
def analytics_summary(request):
	role = request.user.role
	if role == "admin":
		total_cases = Incidents.objects.all().count()
		critical_cases = IncidentAssignments.objects.filter(priority='high').count()
		solved_cases = Incidents.objects.filter(status='resolved').count()
		in_progress_cases = Incidents.objects.filter(status__in=['in_progress', 'assigned']).count()
		resolved_cases = Incidents.objects.filter(status='resolved').count()
		rejected=0

		# Group incidents by week for created and resolved
		created_data = Incidents.objects.annotate(week=TruncWeek('reported_at')).values('week').annotate(count=Count('id')).order_by('week')
		resolved_data = IncidentAssignments.objects.filter(incident__status='resolved').annotate(week=TruncWeek('resolved_at')).values('week').annotate(count=Count('id')).order_by('week')

		# Combine weeks from both datasets
		try:
			all_weeks = sorted(set(data['week'] for data in created_data) | set(data['week'] for data in resolved_data))[-4:]  # Limit to the last 4 weeks
		except:
			all_weeks = []

		# Prepare graph data with zero-filled values
		created_dict = {data['week']: data['count'] for data in created_data}
		resolved_dict = {data['week']: data['count'] for data in resolved_data}
		# Get the current date and calculate the start of the current week
		today = datetime.now()
		start_of_week = today - timedelta(days=today.weekday())
		weeks = [start_of_week - timedelta(weeks=i) for i in range(3, -1, -1)]  # Last 4 weeks including current week

		# Prepare graph data with zero-filled values for continuous weeks
		created_dict = {data['week']: data['count'] for data in created_data}
		resolved_dict = {data['week']: data['count'] for data in resolved_data}
		graph_data = {
			"weeks": [f"Week {((week.day - 1) // 7) + 1} {week.strftime('%B %Y')}" for week in weeks],
			"created": [created_dict.get(week, 0) for week in weeks],
			"resolved": [resolved_dict.get(week, 0) for week in weeks]
		}
		return Response({
			"total_cases": total_cases,
			"critical_cases": critical_cases,
			"solved_cases": solved_cases,
			"in_progress_cases": in_progress_cases,
			"resolved_cases": resolved_cases,
			"rejected": rejected,
			"graph_data": graph_data
		})
	elif role == "investigator":
		total_cases = IncidentAssignments.objects.filter(assigned_to=request.user).count()
		in_progress_cases = IncidentAssignments.objects.filter(assigned_to=request.user, incident__status__in=['in_progress', 'assigned']).count()
		resolved_cases = IncidentAssignments.objects.filter(assigned_to=request.user, incident__status='resolved').count()
		success_rate = (resolved_cases / total_cases * 100) if total_cases > 0 else 0
		cases_this_month = IncidentAssignments.objects.filter(assigned_to=request.user, assigned_at__month=datetime.now().month).count()
		upcoming_deadlines = IncidentAssignments.objects.filter(assigned_to=request.user, assigned_deadline__gte=datetime.now()).order_by('assigned_deadline')[:3]
		return Response({
			"total_assigned_cases": total_cases,
			"in_progress_cases": in_progress_cases,
			"resolved_cases": resolved_cases,
			"success_rate": success_rate,
			"cases_this_month": cases_this_month,
			"upcoming_deadlines": [{
				"title": assignment.incident.title,
				"priority": assignment.priority,
				"deadline": assignment.assigned_deadline,
				"assigned_at": assignment.assigned_at
			} for assignment in upcoming_deadlines]

		})
	elif role=="victim":
		active_cases = Incidents.objects.filter(user=request.user, status__in=['reported', 'in_progress', 'assigned']).count()
		in_progress_cases = Incidents.objects.filter(user=request.user, status__in=['in_progress', 'assigned']).count()
		resolved_cases = Incidents.objects.filter(user=request.user, status='resolved').count()
		evidence_submitted = Evidence.objects.filter(submitted_by=request.user).count()
		return Response({
			"active_cases": active_cases,
			"in_progress_cases": in_progress_cases,
			"resolved_cases": resolved_cases,
			"evidence_submitted": evidence_submitted,
			"active_incidents": [{
				"title": incident.title if incident.title else "No Title",
				"status": incident.status if incident.status else "N/A",
				"reported_at": incident.reported_at if incident.reported_at else "N/A",
				"assigned_investigator": incident.assignment.assigned_to.first_name + " " + incident.assignment.assigned_to.last_name if hasattr(incident, 'assignment') else "Not Assigned",
				"priority": incident.assignment.priority if hasattr(incident, 'assignment') else "N/A",
				"progress": "50%" if incident.status == "in_progress" else "75%" if incident.status == "assigned" else "0%"
			} for incident in Incidents.objects.filter(user=request.user, status__in=['reported', 'in_progress', 'assigned']).order_by('-reported_at')[:3]]
		})
	return Response({"error": "You do not have permission to view this."}, status=403)

@permission_classes([IsAuthenticated])
@api_view(['GET'])
def analytics_detailed(request):
	if request.user.role != "admin":
		return Response({"error": "You do not have permission to view this."}, status=403)
	case_solved = Incidents.objects.filter(status='resolved').count()
	new_users = User.objects.filter(date_joined__month=datetime.now().month).count()
	avg_resolution_time = IncidentAssignments.objects.filter(incident__status='resolved').annotate(
		resolution_time=Count('resolved_at') - Count('assigned_at')
	).aggregate(Avg('resolution_time'))['resolution_time__avg']

	# Compare with last month
	last_month = datetime.now().month - 1 if datetime.now().month > 1 else 12
	last_month_year = datetime.now().year if datetime.now().month > 1 else datetime.now().year - 1

	last_month_case_solved = Incidents.objects.filter(status='resolved', reported_at__month=last_month, reported_at__year=last_month_year).count()
	last_month_new_users = User.objects.filter(date_joined__month=last_month, date_joined__year=last_month_year).count()
	last_month_avg_resolution_time = IncidentAssignments.objects.filter(
		incident__status='resolved',
		resolved_at__month=last_month,
		resolved_at__year=last_month_year
	).annotate(
		resolution_time=Count('resolved_at') - Count('assigned_at')
	).aggregate(Avg('resolution_time'))['resolution_time__avg']

	# Calculate changes
	case_solved_change = case_solved - last_month_case_solved
	new_users_change = new_users - last_month_new_users
	avg_resolution_time_change = avg_resolution_time - last_month_avg_resolution_time if avg_resolution_time and last_month_avg_resolution_time else 0
	
	total_cases = Incidents.objects.count()
	efficincy = (case_solved / total_cases * 100) if total_cases > 0 else 0
	
	# Calculate last month's efficiency
	last_month = datetime.now().month - 1 if datetime.now().month > 1 else 12
	last_month_year = datetime.now().year if datetime.now().month > 1 else datetime.now().year - 1
	last_month_cases_solved = Incidents.objects.filter(status='resolved', reported_at__month=last_month, reported_at__year=last_month_year).count()
	last_month_total_cases = Incidents.objects.filter(reported_at__month=last_month, reported_at__year=last_month_year).count()
	last_month_efficiency = (last_month_cases_solved / last_month_total_cases * 100) if last_month_total_cases > 0 else 0
	
	efficincy_change = efficincy - last_month_efficiency

	# Incident Trend graph data
	# Group incidents by month for created and resolved
	created_data = Incidents.objects.annotate(month=TruncWeek('reported_at', kind='month')).values('month').annotate(count=Count('id')).order_by('month')
	resolved_data = IncidentAssignments.objects.filter(incident__status='resolved').annotate(month=TruncWeek('resolved_at', kind='month')).values('month').annotate(count=Count('id')).order_by('month')

	# Combine months from both datasets
	all_months = sorted(set(data['month'] for data in created_data) | set(data['month'] for data in resolved_data))[-6:]  # Limit to the last 6 months
	# Prepare graph data with zero-filled values
	created_dict = {data['month']: data['count'] for data in created_data}
	resolved_dict = {data['month']: data['count'] for data in resolved_data}
	graph_data = {
		"months": [month.strftime('%B %Y') for month in all_months],
		"created": [created_dict.get(month, 0) for month in all_months],
		"resolved": [resolved_dict.get(month, 0) for month in all_months]
	}

	# Prepare a crime category and number of incidents per category graph data
	category_data = Incidents.objects.values('crime_type__crime_type_name').annotate(count=Count('id')).order_by('-count')
	category_dict = {data['crime_type__crime_type_name']: data['count'] for data in category_data}
	category_graph_data = {
		"categories": list(category_dict.keys()),
		"counts": list(category_dict.values())
	}

	# Respond Analysis Data
	# Prepare graph data for time taken vs incident count divided by priority
	time_taken_data = IncidentAssignments.objects.filter(incident__status__in=['in_progress', 'assigned']).annotate(
		time_taken=Count('assigned_at') - Count('incident__reported_at')
	).values('priority', 'time_taken').annotate(count=Count('id')).order_by('priority', 'time_taken')

	# Organize data for the graph
	priority_dict = {}
	for data in time_taken_data:
		priority = data['priority']
		time_taken = data['time_taken']
		count = data['count']
		if priority not in priority_dict:
			priority_dict[priority] = {}
		priority_dict[priority][time_taken] = count

	# Prepare graph data
	time_taken_graph_data = {
		"priorities": list(priority_dict.keys()),
		"time_taken": {
			priority: list(priority_dict[priority].keys()) for priority in priority_dict
		},
		"counts": {
			priority: list(priority_dict[priority].values()) for priority in priority_dict
		}
	}

	# Incident Hotspots graph data
	hotspot_data = Incidents.objects.values('location__city').annotate(count=Count('id')).order_by('-count')
	hotspot_graph_data = {
		"cities": [data['location__city'] for data in hotspot_data],
		"counts": [data['count'] for data in hotspot_data]
	}

	return Response({
		"case_solved": case_solved,
		"case_solved_change": case_solved_change,
		"new_users": new_users,
		"new_users_change": new_users_change,
		"avg_resolution_time": avg_resolution_time,
		"avg_resolution_time_change": avg_resolution_time_change,
		"efficiency": efficincy,
		"efficiency_change": efficincy_change,
		"incident_trend_graph": graph_data,
		"category_graph": category_graph_data,
		"time_taken_graph": time_taken_graph_data,
		"hotspot_graph": hotspot_graph_data
	})

def analytics_trends(request):
	pass

def analytics_hotspots(request):
	pass

def analytics_categories(request):
	pass
