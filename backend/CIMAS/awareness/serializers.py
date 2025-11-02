from rest_framework import serializers
from .models import Flair, AwarenessResource

class FlairSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flair
        fields = ['id', 'name']


class AwarenessListSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    flair = FlairSerializer(many=True, read_only=True)  # ✅ many=True for M2M

    class Meta:
        model = AwarenessResource
        fields = ["id", "title", "synopsis", "author", "flair"]
    
    def get_author(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email
        return "Unknown"


class AwarenessDetailSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    flair = FlairSerializer(many=True, read_only=True)
    flair_id = serializers.PrimaryKeyRelatedField(
        queryset=Flair.objects.all(),
        many=True,
        source='flair',
        write_only=True
    )

    class Meta:
        model = AwarenessResource
        fields = [
            "id", "title", "author", "synopsis", "content", "image",
            "flair", "flair_id", "created_at", "updated_at"
        ]
        read_only_fields = ["author", "created_at", "updated_at"]
    
    def get_author(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email
        return "Unknown"
