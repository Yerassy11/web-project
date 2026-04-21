from django.contrib import admin
from .models import Track


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display  = ['title', 'artist', 'uploaded_by', 'duration', 'genre', 'created_at']
    list_filter   = ['genre']
    search_fields = ['title', 'artist']
