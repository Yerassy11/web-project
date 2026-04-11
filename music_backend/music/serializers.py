from rest_framework import serializers
from .models import Album, Track



class TrackUploadSerializer(serializers.Serializer):
    """
    Plain Serializer used when uploading a new track.
    Handles file + metadata validation explicitly.
    """
    title      = serializers.CharField(max_length=200)
    artist     = serializers.CharField(max_length=200)
    audio_file = serializers.FileField()
    duration   = serializers.IntegerField(min_value=0, default=0)
    genre      = serializers.CharField(max_length=100, required=False, allow_blank=True)
    album      = serializers.PrimaryKeyRelatedField(
        queryset=Album.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate_audio_file(self, value):
        allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4']
        if value.content_type not in allowed:
            raise serializers.ValidationError(
                f'Unsupported audio format. Allowed: mp3, wav, ogg, flac, m4a.'
            )
        max_mb = 50
        if value.size > max_mb * 1024 * 1024:
            raise serializers.ValidationError(f'File too large. Max size is {max_mb} MB.')
        return value

    def create(self, validated_data):
        return Track.objects.create(**validated_data)


class AlbumCreateSerializer(serializers.Serializer):
    """
    Plain Serializer for creating albums with optional cover image.
    """
    title        = serializers.CharField(max_length=200)
    artist       = serializers.CharField(max_length=200)
    release_year = serializers.IntegerField(min_value=1900, max_value=2100, required=False, allow_null=True)
    cover_image  = serializers.ImageField(required=False, allow_null=True)

    def create(self, validated_data):
        return Album.objects.create(**validated_data)


class TrackSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    album_title          = serializers.CharField(source='album.title', read_only=True, allow_null=True)

    class Meta:
        model  = Track
        fields = [
            'id', 'title', 'artist', 'audio_file', 'duration',
            'genre', 'album', 'album_title',
            'uploaded_by', 'uploaded_by_username',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']


class AlbumSerializer(serializers.ModelSerializer):
    tracks               = TrackSerializer(many=True, read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    track_count          = serializers.IntegerField(source='tracks.count', read_only=True)

    class Meta:
        model  = Album
        fields = [
            'id', 'title', 'artist', 'cover_image', 'release_year',
            'uploaded_by', 'uploaded_by_username',
            'track_count', 'tracks',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']

# ---------------------------------------------------------------------- reqs
