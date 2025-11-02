from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import AwarenessResource, Flair
from .serializers import (
    AwarenessListSerializer,
    AwarenessDetailSerializer,
    FlairSerializer
)


# ✅ View to list all available flairs (for dropdowns in frontend)
class FlairListView(generics.ListAPIView):
    queryset = Flair.objects.all().order_by("name")
    serializer_class = FlairSerializer
    permission_classes = [permissions.AllowAny]


# ✅ View for listing + creating Awareness resources
class AwarenessResourceListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        # Use a compact serializer for list, full for detail/create
        if self.request.method == "GET":
            return AwarenessListSerializer
        return AwarenessDetailSerializer

    def get_queryset(self):
        queryset = AwarenessResource.objects.all().order_by("-created_at")

        # ✅ Accept either flair name or ID for filtering
        flair_param = self.request.query_params.get("flair")

        if flair_param:
            # Try filtering by name first, else assume it's an ID
            queryset = queryset.filter(
                flair__name__iexact=flair_param
            ) | queryset.filter(flair=flair_param)

        return queryset.distinct()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# ✅ View for retrieve, update and delete operations
class AwarenessResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AwarenessResource.objects.all()
    serializer_class = AwarenessDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if self.request.user == serializer.instance.author or self.request.user.is_staff:
            serializer.save()
        else:
            raise PermissionDenied("You are not allowed to update this resource.")

    def perform_destroy(self, instance):
        if self.request.user == instance.author or self.request.user.is_staff:
            instance.delete()
        else:
            raise PermissionDenied("You are not allowed to delete this resource.")
