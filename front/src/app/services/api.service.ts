import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Artist, LoginResponse, Playlist, Track } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password });
  }

  logout(refresh: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/logout`, { refresh });
  }

  getTracks(search = ''): Observable<Track[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<Track[]>(`${this.baseUrl}/api/music/tracks/${query}`);
  }

  getArtists(): Observable<Artist[]> {
    return this.http.get<Artist[]>(`${this.baseUrl}/api/music/artists/`);
  }

  getPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.baseUrl}/api/playlists/`);
  }

  getPlaylist(id: number): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.baseUrl}/api/playlists/${id}/`);
  }

  createPlaylist(payload: Pick<Playlist, 'title' | 'description' | 'is_public'>): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.baseUrl}/api/playlists/`, payload);
  }

  updatePlaylist(id: number, payload: Pick<Playlist, 'title' | 'description' | 'is_public'>): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.baseUrl}/api/playlists/${id}/`, payload);
  }

  deletePlaylist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/playlists/${id}/`);
  }

  addTrackToPlaylist(playlistId: number, trackId: number, order = 0): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.baseUrl}/api/playlists/${playlistId}/tracks/`, {
      track_id: trackId,
      order,
    });
  }

  toggleLike(trackId: number): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.baseUrl}/api/music/tracks/${trackId}/like/`, {});
  }

  savePlayerState(trackId: number, positionSeconds: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/api/music/player/state/`, {
      track_id: trackId,
      position_seconds: Math.floor(positionSeconds),
    });
  }
}
