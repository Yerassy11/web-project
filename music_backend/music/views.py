from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.conf import settings
from pathlib import Path
from urllib.parse import quote_plus
from urllib.request import urlopen, Request
import json

from .models import Track, FavoriteSong
from .serializers import (
    FavoriteSongSerializer,
    FavoriteSongActionSerializer,
)
from .track_import import get_or_create_track


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
    artist = action.validated_data.get('artist', 'Unknown Artist')
    artwork_url = action.validated_data.get('artwork_url', '')
    preview_url = action.validated_data.get('preview_url', '')
    track = get_or_create_track(
        song_title,
        request.user,
        artist=artist,
        preview_url=preview_url,
        artwork_url=artwork_url,
    )
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
            'artwork_url': '',
            'audio_file': f'{media_url}/{rel}',
            'duration': 0,
            'genre': '',
            'uploaded_by': 0,
            'uploaded_by_username': 'media-library',
            'created_at': '',
            'updated_at': '',
        }

    return Response(sorted(by_title.values(), key=lambda item: item['title'].lower()))


@api_view(['GET'])
@permission_classes([AllowAny])
def internet_song_search(request):
    """
    GET /api/v1/music/internet-search/?q=<query>
    Search songs from internet catalog (iTunes Search API).
    """
    query = (request.query_params.get('q') or '').strip()
    if len(query) < 2:
        return Response({'results': []})

    encoded_query = quote_plus(query)
    url = f'https://itunes.apple.com/search?term={encoded_query}&entity=song&limit=15'
    req = Request(url, headers={'User-Agent': 'ShumaqMusic/1.0'})

    try:
        with urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception:
        return Response({'detail': 'Failed to search internet songs.'}, status=status.HTTP_502_BAD_GATEWAY)

    raw_results = payload.get('results', [])
    normalized = []
    for item in raw_results:
        title = item.get('trackName')
        artist = item.get('artistName')
        preview_url = item.get('previewUrl')
        if not title or not artist:
            continue
        normalized.append({
            'title': title,
            'artist': artist,
            'preview_url': preview_url or '',
            'artwork_url': item.get('artworkUrl100') or '',
            'source': 'itunes',
        })

    return Response({'results': normalized})
