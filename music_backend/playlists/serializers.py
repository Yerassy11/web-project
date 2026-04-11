from rest_framework import serializers
from music.serializers import TrackSerializer
from .models import Playlist, PlaylistTrack


class PlaylistSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    tracks         = TrackSerializer(many=True, read_only=True)
    track_count    = serializers.IntegerField(source='tracks.count', read_only=True)

    class Meta:
        model  = Playlist
        fields = [
            'id', 'name', 'description', 'is_public',
            'owner', 'owner_username',
            'track_count', 'tracks',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class PlaylistWriteSerializer(serializers.ModelSerializer):
    """Lighter serializer used for create / update (no nested tracks)."""

    class Meta:
        model  = Playlist
        fields = ['id', 'name', 'description', 'is_public']
        read_only_fields = ['id']


class AddTrackSerializer(serializers.Serializer):
    """Plain Serializer to validate adding a track to a playlist."""
    track_id = serializers.IntegerField()
    position = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate_track_id(self, value):
        from music.models import Track
        if not Track.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Track not found.')
        return value