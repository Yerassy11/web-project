from rest_framework import serializers
from music.serializers import FavoriteSongSerializer
from .models import Playlist, PlaylistTrack


class PlaylistSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    tracks         = FavoriteSongSerializer(many=True, read_only=True)
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
    """Plain Serializer to validate adding a song to a playlist by title."""
    song_title = serializers.CharField(max_length=200)
    artist = serializers.CharField(max_length=200, required=False, allow_blank=True)
    preview_url = serializers.URLField(required=False, allow_blank=True)
    position = serializers.IntegerField(min_value=0, required=False, default=0)
