from django.urls import path
from .views import (
    play_song,
    pause,
    add_to_queue,
    next_song,
    previous_song,
    toggle_shuffle,
    toggle_repeat,
    player_state,
)

urlpatterns = [
    path("play/", play_song),
    path("pause/", pause),

    path("queue/add/", add_to_queue),

    path("next/", next_song),
    path("previous/", previous_song),

    path("shuffle/", toggle_shuffle),
    path("repeat/", toggle_repeat),

    path("state/", player_state),
]
