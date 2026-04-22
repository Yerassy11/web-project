from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from music.models import Track
from music.track_import import get_or_create_track
from .models import Playlist, PlaylistTrack
from .serializers import PlaylistSerializer, PlaylistWriteSerializer, AddTrackSerializer


# ── CBV: Playlist list + create────────────
class PlaylistListCreateView(APIView):
    """
    GET  /api/v1/playlists/          → public playlists (auth → also own private ones)
    POST /api/v1/playlists/          → create playlist linked to request.user
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        if request.user.is_authenticated:
            # Show public playlists + user's own private playlists
            playlists = Playlist.objects.filter(is_public=True) | \
                        Playlist.objects.filter(owner=request.user)
            playlists = playlists.distinct()
        else:
            playlists = Playlist.objects.filter(is_public=True)

        serializer = PlaylistSerializer(playlists, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = PlaylistWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Link to authenticated user (requirement)
        playlist = serializer.save(owner=request.user)
        return Response(PlaylistSerializer(playlist, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


# ── CBV: Playlist retrieve / update / delet
class PlaylistDetailView(APIView):
    """
    GET    /api/v1/playlists/<id>/  → retrieve
    PATCH  /api/v1/playlists/<id>/  → update (owner only)
    DELETE /api/v1/playlists/<id>/  → delete (owner only)
    """

    def _get_playlist(self, pk, user=None):
        try:
            playlist = Playlist.objects.get(pk=pk)
        except Playlist.DoesNotExist:
            return None, Response({'detail': 'Playlist not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not playlist.is_public and (not user or playlist.owner != user):
            return None, Response({'detail': 'This playlist is private.'}, status=status.HTTP_403_FORBIDDEN)
        return playlist, None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        playlist, err = self._get_playlist(pk, request.user if request.user.is_authenticated else None)
        if err:
            return err
        return Response(PlaylistSerializer(playlist, context={'request': request}).data)

    def patch(self, request, pk):
        try:
            playlist = Playlist.objects.get(pk=pk, owner=request.user)
        except Playlist.DoesNotExist:
            return Response({'detail': 'Not found or not your playlist.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PlaylistWriteSerializer(playlist, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PlaylistSerializer(playlist, context={'request': request}).data)

    def delete(self, request, pk):
        try:
            playlist = Playlist.objects.get(pk=pk, owner=request.user)
        except Playlist.DoesNotExist:
            return Response({'detail': 'Not found or not your playlist.'}, status=status.HTTP_404_NOT_FOUND)
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── FBV: Add / remove a track from  playlist ─────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def playlist_add_track(request, pk):
    """
    POST /api/v1/playlists/<id>/tracks/add/
    Body: { "song_title": "Night Transit", "position": 0 }
    """
    try:
        playlist = Playlist.objects.get(pk=pk, owner=request.user)
    except Playlist.DoesNotExist:
        return Response({'detail': 'Playlist not found or not yours.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AddTrackSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    song_title = serializer.validated_data['song_title'].strip()
    artist = serializer.validated_data.get('artist', 'Unknown Artist')
    artwork_url = serializer.validated_data.get('artwork_url', '')
    preview_url = serializer.validated_data.get('preview_url', '')
    track = get_or_create_track(
        song_title,
        request.user,
        artist=artist,
        preview_url=preview_url,
        artwork_url=artwork_url,
    )
    if track is None:
        return Response({'detail': 'Song not found in library.'}, status=status.HTTP_404_NOT_FOUND)

    position = serializer.validated_data['position']

    pt, created = PlaylistTrack.objects.get_or_create(
        playlist=playlist,
        track=track,
        defaults={'position': position},
    )
    if not created:
        return Response({'detail': 'Song is already in this playlist.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(PlaylistSerializer(playlist, context={'request': request}).data,
                    status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def playlist_remove_track(request, pk, song_title):
    """
    DELETE /api/v1/playlists/<id>/tracks/<song_title>/remove/
    """
    try:
        playlist = Playlist.objects.get(pk=pk, owner=request.user)
    except Playlist.DoesNotExist:
        return Response({'detail': 'Playlist not found or not yours.'}, status=status.HTTP_404_NOT_FOUND)

    deleted, _ = PlaylistTrack.objects.filter(playlist=playlist, track__title=song_title).delete()
    if not deleted:
        return Response({'detail': 'Song not in playlist.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(PlaylistSerializer(playlist, context={'request': request}).data)
