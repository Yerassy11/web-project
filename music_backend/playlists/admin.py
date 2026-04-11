from django.contrib import admin
from .models import Playlist, PlaylistTrack


class PlaylistTrackInline(admin.TabularInline):
    model  = PlaylistTrack
    extra  = 0
    fields = ['track', 'position', 'added_at']
    readonly_fields = ['added_at']


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display  = ['name', 'owner', 'is_public', 'created_at']
    list_filter   = ['is_public']
    search_fields = ['name', 'owner__username']
    inlines       = [PlaylistTrackInline]