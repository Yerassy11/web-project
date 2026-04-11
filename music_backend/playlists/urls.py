from django.urls import path
from . import views

urlpatterns = [
    path('',          views.PlaylistListCreateView.as_view(), name='playlist-list-create'),
    path('<int:pk>/', views.PlaylistDetailView.as_view(),     name='playlist-detail'),

    path('<int:pk>/tracks/add/',                    views.playlist_add_track,    name='playlist-add-track'),
    path('<int:pk>/tracks/<int:track_pk>/remove/',  views.playlist_remove_track, name='playlist-remove-track'),
]