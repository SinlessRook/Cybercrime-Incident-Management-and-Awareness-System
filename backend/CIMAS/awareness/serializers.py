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
        write_only=True,
        required=False
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
    
    def create(self, validated_data):
        flair_data = validated_data.pop('flair', [])
        resource = AwarenessResource.objects.create(**validated_data)
        if flair_data:
            resource.flair.set(flair_data)
        return resource
    
    def update(self, instance, validated_data):
        flair_data = validated_data.pop('flair', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if flair_data is not None:
            instance.flair.set(flair_data)
        
        return instance
