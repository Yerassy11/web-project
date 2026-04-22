from django.urls import path
from . import views
from .recommendations import recommendations

urlpatterns = [
    path('favsongs/', views.favsong_list_create, name='favsong-list-create'),
    path('favsongs/<str:title>/', views.favsong_detail, name='favsong-detail'),
    path('library-songs/', views.library_songs, name='library-songs'),
    path('internet-search/', views.internet_song_search, name='internet-song-search'),
    path('recommendations/', recommendations, name='recommendations'),
]
