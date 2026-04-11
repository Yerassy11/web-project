from django.db import models
from django.conf import settings


# ─── Model 4: Playlist ────────────────────────────────────────────────────────
class Playlist(models.Model):
    # ForeignKey 4: Playlist → User
    owner      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='playlists',
    )
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_public   = models.BooleanField(default=True)
    tracks      = models.ManyToManyField(
        'music.Track',
        through='PlaylistTrack',
        related_name='playlists',
        blank=True,
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.owner.username} / {self.name}'


class PlaylistTrack(models.Model):
    """Through model to preserve track order inside a playlist."""
    playlist   = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    track      = models.ForeignKey('music.Track', on_delete=models.CASCADE)
    position   = models.PositiveIntegerField(default=0)
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'added_at']
        unique_together = [('playlist', 'track')]