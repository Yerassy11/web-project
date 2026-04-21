from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


# ── FBV 1: Register ───────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/v1/auth/register/
    Create a new user account and return JWT tokens immediately.
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'user':    UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        },
    }, status=status.HTTP_201_CREATED)


# ── FBV 2: Login ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/v1/auth/login/
    Validate credentials and return JWT tokens.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email    = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.active().get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user':   UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        },
    })


# ── CBV 1: Logout ─────────────────────────────────────────────────────────────
class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token to invalidate the session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token already expired or invalid — still return 200
            pass
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


# ── CBV 2: Me (profile read + update) ────────────────────────────────────────
class MeView(APIView):
    """
    GET  /api/v1/auth/me/  → return current user profile
    PATCH /api/v1/auth/me/ → update current user profile
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
