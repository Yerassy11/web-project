from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.conf import settings
from pathlib import Path

from .models import Track, FavoriteSong
from .serializers import (
    FavoriteSongSerializer,
    FavoriteSongActionSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════════
#  FAVORITE SONGS (FBV — full CRUD, title-based detail)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def favsong_list_create(request):
    """
    GET  /api/v1/music/favsongs/  → list current user's favorite songs
    POST /api/v1/music/favsongs/  → like song by title
    """
    if request.method == 'GET':
        tracks = Track.objects.filter(favorite_entries__user=request.user).select_related('uploaded_by').distinct()
        serializer = FavoriteSongSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)

    action = FavoriteSongActionSerializer(data=request.data)
    action.is_valid(raise_exception=True)
    song_title = action.validated_data['song_title']
    track = _get_or_create_track_from_library(song_title, request.user)
    if track is None:
        return Response({'detail': 'Song not found in library.'}, status=status.HTTP_404_NOT_FOUND)

    FavoriteSong.objects.get_or_create(user=request.user, track=track)
    return Response(FavoriteSongSerializer(track, context={'request': request}).data,
                    status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def favsong_detail(request, title):
    """
    GET    /api/v1/music/favsongs/<title>/  → retrieve user's favorite song
    DELETE /api/v1/music/favsongs/<title>/  → unlike song
    """
    track = Track.objects.filter(title=title, favorite_entries__user=request.user).select_related('uploaded_by').first()
    if track is None:
        return Response({'detail': 'Favorite song not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(FavoriteSongSerializer(track, context={'request': request}).data)

    if request.method in ['PUT', 'PATCH']:
        return Response({'detail': 'Method not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    if request.method == 'DELETE':
        FavoriteSong.objects.filter(user=request.user, track=track).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def library_songs(request):
    """
    GET /api/v1/music/library-songs/ → songs from media directory (DB + raw media files)
    """
    tracks = Track.objects.select_related('uploaded_by').all()
    serializer = FavoriteSongSerializer(tracks, many=True, context={'request': request})
    by_title = {item['title']: item for item in serializer.data}

    media_root = Path(settings.MEDIA_ROOT)
    media_url = settings.MEDIA_URL.rstrip('/')
    audio_exts = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}

    for candidate in media_root.rglob('*'):
        if not candidate.is_file() or candidate.suffix.lower() not in audio_exts:
            continue

        title = candidate.stem
        if title in by_title:
            continue

        rel = candidate.relative_to(media_root).as_posix()
        by_title[title] = {
            'title': title,
            'artist': 'Unknown Artist',
            'audio_file': f'{media_url}/{rel}',
            'duration': 0,
            'genre': '',
            'uploaded_by': 0,
            'uploaded_by_username': 'media-library',
            'created_at': '',
            'updated_at': '',
        }

    return Response(sorted(by_title.values(), key=lambda item: item['title'].lower()))


def _get_or_create_track_from_library(song_title, user):
    title = song_title.strip()
    if not title:
        return None

    track = Track.objects.filter(title=title).first()
    if track is not None:
        return track

    media_root = Path(settings.MEDIA_ROOT)
    audio_exts = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}
    matched_file = None
    for candidate in media_root.rglob('*'):
        if not candidate.is_file() or candidate.suffix.lower() not in audio_exts:
            continue
        if candidate.stem == title:
            matched_file = candidate
            break

    if matched_file is None:
        return None

    relative_audio_path = matched_file.relative_to(media_root).as_posix()
    return Track.objects.create(
        title=title,
        artist='Unknown Artist',
        audio_file=relative_audio_path,
        duration=0,
        genre='',
        uploaded_by=user,
    )
