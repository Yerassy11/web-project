from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Count
from playlists.models import PlaylistTrack

User = get_user_model()


# ── serializers.Serializer (requirement) ──────────────────────────────────────
class RegisterSerializer(serializers.Serializer):
    """Plain Serializer for registration — full manual validation."""

    email      = serializers.EmailField()
    username   = serializers.CharField(max_length=50)
    password   = serializers.CharField(write_only=True, min_length=8)
    password2  = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Plain Serializer for login credentials."""

    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ── serializers.ModelSerializer (requirement) ─────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    """Public profile — read-only representation."""
    playlist_count = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()
    frequent_songs = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'username',
            'avatar',
            'bio',
            'created_at',
            'playlist_count',
            'favorites_count',
            'frequent_songs',
        ]
        read_only_fields = ['id', 'created_at']

    def get_playlist_count(self, obj):
        return obj.playlists.count()

    def get_favorites_count(self, obj):
        return obj.favorite_songs.count()

    def get_frequent_songs(self, obj):
        top_tracks = (
            PlaylistTrack.objects
            .filter(playlist__owner=obj)
            .values('track__title', 'track__artist', 'track__duration')
            .annotate(play_count=Count('track'))
            .order_by('-play_count', 'track__title')[:5]
        )
        result = []
        for item in top_tracks:
            title = item.get('track__title')
            if not title:
                continue
            result.append(
                {
                    'title': title,
                    'artist': item.get('track__artist') or 'Unknown Artist',
                    'duration': item.get('track__duration') or 0,
                    'play_count': item.get('play_count') or 0,
                }
            )
        return result


class UserUpdateSerializer(serializers.ModelSerializer):
    """Allows authenticated user to update their own profile."""

    class Meta:
        model  = User
        fields = ['username', 'bio', 'avatar']

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value
