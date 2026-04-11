from django.db import models
from django.conf import settings


# ─── Model 2: Album ───────────────────────────────────────────────────────────
class Album(models.Model):
    # ForeignKey 1: Album → User (uploaded_by)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='albums',
    )
    title       = models.CharField(max_length=200)
    artist      = models.CharField(max_length=200)
    cover_image = models.ImageField(upload_to='covers/', null=True, blank=True)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.artist} – {self.title}'


# ─── Model 3: Track ───────────────────────────────────────────────────────────
class Track(models.Model):
    # ForeignKey 2: Track → Album
    album = models.ForeignKey(
        Album,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tracks',
    )
    # ForeignKey 3: Track → User (uploaded_by)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tracks',
    )
    title      = models.CharField(max_length=200)
    artist     = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to='tracks/')
    duration   = models.PositiveIntegerField(help_text='Duration in seconds', default=0)
    genre      = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.artist} – {self.title}'