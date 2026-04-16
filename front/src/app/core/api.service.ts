import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Album, AuthResponse, Playlist, Track, UserProfile } from './api.models';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password2: string;
}

interface AlbumPayload {
  title: string;
  artist: string;
  release_year: number;
}

interface PlaylistPayload {
  name: string;
  description: string;
  is_public: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8000/api/v1';
  private accessToken = localStorage.getItem('shumaq_access');
  private refreshToken = localStorage.getItem('shumaq_refresh');

  constructor(private readonly http: HttpClient) {}

  get isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login/`, payload);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register/`, payload);
  }

  logout(): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.baseUrl}/auth/logout/`,
      { refresh: this.refreshToken },
      { headers: this.authHeaders() }
    );
  }

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/auth/me/`, { headers: this.authHeaders() });
  }

  tracks(): Observable<Track[]> {
    return this.http.get<Track[]>(`${this.baseUrl}/music/tracks/`);
  }

  albums(): Observable<Album[]> {
    return this.http.get<Album[]>(`${this.baseUrl}/music/albums/`);
  }

  playlists(): Observable<Playlist[]> {
    const headers = this.accessToken ? this.authHeaders() : undefined;
    return this.http.get<Playlist[]>(`${this.baseUrl}/playlists/`, { headers });
  }

  createAlbum(payload: AlbumPayload): Observable<Album> {
    return this.http.post<Album>(`${this.baseUrl}/music/albums/`, payload, { headers: this.authHeaders() });
  }

  createPlaylist(payload: PlaylistPayload): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.baseUrl}/playlists/`, payload, { headers: this.authHeaders() });
  }

  addTrackToPlaylist(playlistId: number, trackId: number, position = 0): Observable<Playlist> {
    return this.http.post<Playlist>(
      `${this.baseUrl}/playlists/${playlistId}/tracks/add/`,
      { track_id: trackId, position },
      { headers: this.authHeaders() }
    );
  }

  saveTokens(tokens: { access: string; refresh: string }): void {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    localStorage.setItem('shumaq_access', tokens.access);
    localStorage.setItem('shumaq_refresh', tokens.refresh);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('shumaq_access');
    localStorage.removeItem('shumaq_refresh');
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.accessToken ?? ''}`
    });
  }
}
