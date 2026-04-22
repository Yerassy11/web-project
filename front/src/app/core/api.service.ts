import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, InternetSongResult, Playlist, Track, UserProfile } from './api.models';

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

  updateMe(payload: FormData | Partial<Pick<UserProfile, 'username' | 'bio'>>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.baseUrl}/auth/me/`, payload, { headers: this.authHeaders() });
  }

  favoriteSongs(): Observable<Track[]> {
    return this.http.get<Track[]>(`${this.baseUrl}/music/favsongs/`, { headers: this.authHeaders() });
  }

  librarySongs(): Observable<Track[]> {
    return this.http.get<Track[]>(`${this.baseUrl}/music/library-songs/`);
  }

  searchInternetSongs(query: string): Observable<{ results: InternetSongResult[] }> {
    return this.http.get<{ results: InternetSongResult[] }>(`${this.baseUrl}/music/internet-search/`, {
      params: { q: query.trim() }
    });
  }

  playlists(): Observable<Playlist[]> {
    const headers = this.accessToken ? this.authHeaders() : undefined;
    return this.http.get<Playlist[]>(`${this.baseUrl}/playlists/`, { headers });
  }

  getPlaylist(id: number): Observable<Playlist> {
    const headers = this.accessToken ? this.authHeaders() : undefined;
    return this.http.get<Playlist>(`${this.baseUrl}/playlists/${id}/`, { headers });
  }

  createPlaylist(payload: PlaylistPayload): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.baseUrl}/playlists/`, payload, { headers: this.authHeaders() });
  }

  addTrackToPlaylist(
    playlistId: number,
    songTitle: string,
    position = 0,
    extra?: { artist?: string; preview_url?: string; artwork_url?: string }
  ): Observable<Playlist> {
    return this.http.post<Playlist>(
      `${this.baseUrl}/playlists/${playlistId}/tracks/add/`,
      {
        song_title: songTitle,
        position,
        artist: extra?.artist ?? '',
        preview_url: extra?.preview_url ?? '',
        artwork_url: extra?.artwork_url ?? ''
      },
      { headers: this.authHeaders() }
    );
  }

  likeSong(songTitle: string, extra?: { artist?: string; preview_url?: string; artwork_url?: string }): Observable<Track> {
    return this.http.post<Track>(
      `${this.baseUrl}/music/favsongs/`,
      {
        song_title: songTitle,
        artist: extra?.artist ?? '',
        preview_url: extra?.preview_url ?? '',
        artwork_url: extra?.artwork_url ?? ''
      },
      { headers: this.authHeaders() }
    );
  }

  unlikeSong(songTitle: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/music/favsongs/${encodeURIComponent(songTitle)}/`, {
      headers: this.authHeaders()
    });
  }

  getRecommendations(options?: { genres?: string[]; artists?: string[]; limit?: number }): Observable<{ results: Track[]; meta: { genres_used: string[]; artists_used: string[]; count: number } }> {
    const params: Record<string, string> = {};
    if (options?.genres?.length) params['genres'] = options.genres.join(',');
    if (options?.artists?.length) params['artists'] = options.artists.join(',');
    if (options?.limit) params['limit'] = String(options.limit);
    const headers = this.accessToken ? this.authHeaders() : undefined;
    return this.http.get<{ results: Track[]; meta: { genres_used: string[]; artists_used: string[]; count: number } }>(
      `${this.baseUrl}/music/recommendations/`, { params, headers }
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
