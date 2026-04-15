from django.db import models
from django.contrib.auth.models import User
from music.models import Song


class PlayerState(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    current_song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True)
    is_playing = models.BooleanField(default=False)

    shuffle = models.BooleanField(default=False)
    repeat = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} player"


class QueueItem(models.Model):
    player = models.ForeignKey(PlayerState, on_delete=models.CASCADE, related_name="queue")
    song = models.ForeignKey(Song, on_delete=models.CASCADE)

    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["order"]
