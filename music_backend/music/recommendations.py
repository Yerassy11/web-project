"""
Recommendation engine for Shumaq.
GET /api/v1/music/recommendations/  → personalized track recommendations

Logic (no ML required):
  1. If authenticated — use favorite genres + artists from user's favorites,
     then return tracks matching those genres/artists first, then fill up.
  2. If anonymous — return the most-liked tracks (popular picks).
  3. Always returns at most `limit` tracks (default 20).
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import Track, FavoriteSong
from .serializers import FavoriteSongSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations(request):
    """
    GET /api/v1/music/recommendations/?limit=20&genres=lo-fi,phonk&artists=Joji,Keshi
    """
    limit = min(int(request.query_params.get('limit', 20)), 50)
    user = request.user if request.user.is_authenticated else None

    # Optional manual genre/artist filters (from query params — used by the
    # onboarding preferences the home page stores in localStorage)
    param_genres = [g.strip().lower() for g in
                    request.query_params.get('genres', '').split(',') if g.strip()]
    param_artists = [a.strip().lower() for a in
                     request.query_params.get('artists', '').split(',') if a.strip()]

    if user:
        # Build genre/artist preferences from user's favorites
        fav_tracks = Track.objects.filter(favorite_entries__user=user)
        db_genres = list(fav_tracks.values_list('genre', flat=True).distinct())
        db_artists = list(fav_tracks.values_list('artist', flat=True).distinct())
        genres = list({g.lower() for g in db_genres if g} | set(param_genres))
        artists = list({a.lower() for a in db_artists if a} | set(param_artists))
    else:
        genres = param_genres
        artists = param_artists

    # Exclude tracks already favorited by this user
    exclude_titles = set()
    if user:
        exclude_titles = set(
            FavoriteSong.objects.filter(user=user).values_list('track__title', flat=True)
        )

    # ------------------------------------------------------------------
    # Priority 1: genre + artist match
    # ------------------------------------------------------------------
    priority_qs = Track.objects.none()
    if genres or artists:
        genre_q = Q()
        for g in genres:
            genre_q |= Q(genre__icontains=g)

        artist_q = Q()
        for a in artists:
            artist_q |= Q(artist__icontains=a)

        priority_qs = (
            Track.objects
            .filter(genre_q | artist_q)
            .exclude(title__in=exclude_titles)
            .annotate(like_count=Count('favorite_entries'))
            .order_by('-like_count', '-created_at')
        )

    collected = list(priority_qs[:limit])
    collected_titles = {t.title for t in collected}

    # ------------------------------------------------------------------
    # Priority 2: most liked / newest to fill remainder
    # ------------------------------------------------------------------
    remaining = limit - len(collected)
    if remaining > 0:
        filler = (
            Track.objects
            .exclude(title__in=exclude_titles | collected_titles)
            .annotate(like_count=Count('favorite_entries'))
            .order_by('-like_count', '-created_at')[:remaining]
        )
        collected.extend(list(filler))

    serializer = FavoriteSongSerializer(collected, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'meta': {
            'genres_used': genres,
            'artists_used': artists,
            'count': len(collected),
        }
    })
