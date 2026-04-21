from django.urls import path
from . import views

urlpatterns = [
    path('favsongs/', views.favsong_list_create, name='favsong-list-create'),
    path('favsongs/<str:title>/', views.favsong_detail, name='favsong-detail'),
    path('library-songs/', views.library_songs, name='library-songs'),
]
