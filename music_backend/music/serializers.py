from rest_framework import serializers
from .models import Track



class FavoriteSongWriteSerializer(serializers.Serializer):
    """
    Plain Serializer used when uploading a new track.
    Handles file + metadata validation explicitly.
    """
    title      = serializers.CharField(max_length=200)
    artist     = serializers.CharField(max_length=200)
    audio_file = serializers.FileField()
    duration   = serializers.IntegerField(min_value=0, default=0)
    genre      = serializers.CharField(max_length=100, required=False, allow_blank=True)
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

class FavoriteSongSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model  = Track
        fields = [
            'title', 'artist', 'audio_file', 'duration',
            'genre',
            'uploaded_by', 'uploaded_by_username',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['uploaded_by', 'created_at', 'updated_at']


class FavoriteSongActionSerializer(serializers.Serializer):
    song_title = serializers.CharField(max_length=200)

    def validate_song_title(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Song title is required.')
        return cleaned

# ---------------------------------------------------------------------- reqs
