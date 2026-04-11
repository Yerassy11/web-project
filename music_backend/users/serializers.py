from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

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

    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'avatar', 'bio', 'created_at']
        read_only_fields = ['id', 'created_at']


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