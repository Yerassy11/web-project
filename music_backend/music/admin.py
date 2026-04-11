from django.contrib import admin
from .models import Album, Track


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display  = ['title', 'artist', 'uploaded_by', 'release_year', 'created_at']
    list_filter   = ['release_year']
    search_fields = ['title', 'artist']


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display  = ['title', 'artist', 'album', 'uploaded_by', 'duration', 'genre', 'created_at']
    list_filter   = ['genre']
    search_fields = ['title', 'artist']