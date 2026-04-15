from rest_framework import serializers
from .models import PlayerState, QueueItem


class QueueItemSerializer(serializers.ModelSerializer):
    song = serializers.StringRelatedField()

    class Meta:
        model = QueueItem
        fields = ["order", "song"]


class PlayerStateSerializer(serializers.ModelSerializer):
    queue = QueueItemSerializer(many=True, read_only=True)

    class Meta:
        model = PlayerState
        fields = [
            "current_song",
            "is_playing",
            "shuffle",
            "repeat",
            "queue",
        ]
