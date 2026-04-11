from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Album, Track
from .serializers import (
    AlbumCreateSerializer,
    AlbumSerializer,
    TrackUploadSerializer,
    TrackSerializer,
)




class AlbumListCreateView(APIView):
    """
    GET  /api/v1/music/albums/  → list all albums
    POST /api/v1/music/albums/  → create album (linked to request.user)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        albums = Album.objects.select_related('uploaded_by').prefetch_related('tracks').all()
        serializer = AlbumSerializer(albums, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = AlbumCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Link to authenticated user (requirement)
        album = serializer.save(uploaded_by=request.user)
        return Response(AlbumSerializer(album, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class AlbumDetailView(APIView):
    """
    GET    /api/v1/music/albums/<id>/  → retrieve album
    PUT    /api/v1/music/albums/<id>/  → full update (owner only)
    PATCH  /api/v1/music/albums/<id>/  → partial update (owner only)
    DELETE /api/v1/music/albums/<id>/  → delete (owner only)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_album(self, pk, user=None):
        try:
            album = Album.objects.get(pk=pk)
        except Album.DoesNotExist:
            return None, Response({'detail': 'Album not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user and album.uploaded_by != user:
            return None, Response({'detail': 'You do not have permission to modify this album.'},
                                  status=status.HTTP_403_FORBIDDEN)
        return album, None

    def get(self, request, pk):
        album, err = self._get_album(pk)
        if err:
            return err
        return Response(AlbumSerializer(album, context={'request': request}).data)

    def put(self, request, pk):
        album, err = self._get_album(pk, request.user)
        if err:
            return err
        serializer = AlbumCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for attr, val in serializer.validated_data.items():
            setattr(album, attr, val)
        album.save()
        return Response(AlbumSerializer(album, context={'request': request}).data)

    def patch(self, request, pk):
        album, err = self._get_album(pk, request.user)
        if err:
            return err
        serializer = AlbumCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for attr, val in serializer.validated_data.items():
            setattr(album, attr, val)
        album.save()
        return Response(AlbumSerializer(album, context={'request': request}).data)

    def delete(self, request, pk):
        album, err = self._get_album(pk, request.user)
        if err:
            return err
        album.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════════
#  TRACK  (FBV — full CRUD, requirements

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def track_list_create(request):
    """
    GET  /api/v1/music/tracks/  → list all tracks (public)
    POST /api/v1/music/tracks/  → upload track (auth required, linked to user)
    """
    if request.method == 'GET':
        tracks = Track.objects.select_related('uploaded_by', 'album').all()
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)

    # POST — requires auth
    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = TrackUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    # Link to authenticated user (requirement)
    track = serializer.save(uploaded_by=request.user)
    return Response(TrackSerializer(track, context={'request': request}).data,
                    status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def track_detail(request, pk):
    """
    GET    /api/v1/music/tracks/<id>/  → retrieve track (auth required)
    PUT    /api/v1/music/tracks/<id>/  → full update (owner only)
    PATCH  /api/v1/music/tracks/<id>/  → partial update (owner only)
    DELETE /api/v1/music/tracks/<id>/  → delete (owner only)
    """
    try:
        track = Track.objects.get(pk=pk)
    except Track.DoesNotExist:
        return Response({'detail': 'Track not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TrackSerializer(track, context={'request': request}).data)

    # Mutation — owner only
    if track.uploaded_by != request.user:
        return Response({'detail': 'You do not have permission to modify this track.'},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = TrackUploadSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        for attr, val in serializer.validated_data.items():
            setattr(track, attr, val)
        track.save()
        return Response(TrackSerializer(track, context={'request': request}).data)

    if request.method == 'DELETE':
        track.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)