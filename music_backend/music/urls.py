from django.urls import path
from . import views

urlpatterns = [
    # Albums
    path('albums/',      views.AlbumListCreateView.as_view(), name='album-list-create'),
    path('albums/<int:pk>/', views.AlbumDetailView.as_view(), name='album-detail'),

    # Tracks — full CRUD via FBV
    path('tracks/',          views.track_list_create, name='track-list-create'),
    path('tracks/<int:pk>/', views.track_detail,      name='track-detail'),
]