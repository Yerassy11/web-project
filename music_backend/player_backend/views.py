import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import PlayerState, QueueItem
from music.models import Song
from .serializers import PlayerStateSerializer


def get_player(user):
    player, _ = PlayerState.objects.get_or_create(user=user)
    return player



@api_view(["POST"])
def play_song(request):
    song = get_object_or_404(Song, id=request.data.get("song_id"))
    player = get_player(request.user)

    player.current_song = song
    player.is_playing = True
    player.save()

    return Response({"message": f"Playing {song.title}"})



@api_view(["POST"])
def pause(request):
    player = get_player(request.user)
    player.is_playing = False
    player.save()

    return Response({"message": "Paused"})



@api_view(["POST"])
def add_to_queue(request):
    song = get_object_or_404(Song, id=request.data.get("song_id"))
    player = get_player(request.user)

    order = player.queue.count()

    QueueItem.objects.create(
        player=player,
        song=song,
        order=order
    )

    return Response({"message": "Added to queue"})



@api_view(["POST"])
def next_song(request):
    player = get_player(request.user)
    queue = list(player.queue.all())

    if not queue:
        return Response({"message": "Queue empty"})

    if player.shuffle:
        next_item = random.choice(queue)
    else:
        next_item = queue[0]

    player.current_song = next_item.song
    player.is_playing = True
    player.save()

    next_item.delete()

    return Response({"message": f"Now playing {next_item.song.title}"})



@api_view(["POST"])
def previous_song(request):
    return Response({"message": "Previous not implemented yet (optional)"})


@api_view(["POST"])
def toggle_shuffle(request):
    player = get_player(request.user)
    player.shuffle = not player.shuffle
    player.save()

    return Response({"shuffle": player.shuffle})



@api_view(["POST"])
def toggle_repeat(request):
    player = get_player(request.user)
    player.repeat = not player.repeat
    player.save()

    return Response({"repeat": player.repeat})



@api_view(["GET"])
def player_state(request):
    player = get_player(request.user)
    serializer = PlayerStateSerializer(player)
    return Response(serializer.data)
