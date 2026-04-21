from django.db import models
from django.conf import settings


class Track(models.Model):
    # Songs are identified by title in API/business logic.
    title = models.CharField(max_length=200, unique=True)
    artist = models.CharField(max_length=200)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tracks',
    )
    audio_file = models.FileField(upload_to='tracks/')
    duration = models.PositiveIntegerField(help_text='Duration in seconds', default=0)
    genre = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.artist} – {self.title}'


class FavoriteSong(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_songs',
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='favorite_entries',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('user', 'track')]

    def __str__(self):
        return f'{self.user.username} ♥ {self.track.title}'
