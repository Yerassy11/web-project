import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { Track } from '../core/api.models';
import { AudioPlaybackCoordinatorService } from '../core/audio-playback-coordinator.service';
import { PlayerService } from '../core/player.service';

@Component({
  selector: 'app-song-page',
  imports: [RouterLink],
  template: `
    <section class="card song-page">
      @if (backToSearch()) {
        <a class="back-link" routerLink="/search" [queryParams]="{ q: backSearchQuery() || null }">← Back to search results</a>
      } @else {
        <a class="back-link" routerLink="/favsongs">← Back to favorite songs</a>
      }

      @if (error()) {
        <p class="status">{{ error() }}</p>
      }

      @if (track(); as current) {
        <article class="card hero-card">
          <div class="cover-box">
            @if (current.artwork_url) {
              <img [src]="current.artwork_url" [alt]="current.title + ' cover'" />
            } @else {
              <div class="cover-fallback">♪</div>
            }
          </div>

          <div class="hero-content">
            <p class="eyebrow">Track</p>
            <h1>{{ current.title }}</h1>
            <p class="muted hero-meta">{{ current.artist }} · {{ current.genre || 'No genre' }}</p>
            <p class="muted hero-submeta">Added {{ prettyDate(current.created_at) }}</p>

            <div class="pill-row">
              <span class="pill">{{ formatTime(duration() || current.duration) }}</span>
              <span class="pill">Custom player</span>
            </div>
          </div>
        </article>

        <article class="card player-card">
          <div class="player-top">
            <button class="play-btn" type="button" (click)="togglePlay()" [disabled]="!audioUrl()">
              {{ isPlaying() ? 'Pause' : 'Play' }}
            </button>

            <button class="control-btn" type="button" (click)="seekBy(-10)" [disabled]="!audioUrl()">-10s</button>
            <button class="control-btn" type="button" (click)="seekBy(10)" [disabled]="!audioUrl()">+10s</button>

            <div class="time-block">
              <span>{{ formatTime(currentTime()) }}</span>
              <span>/</span>
              <span>{{ formatTime(duration() || current.duration) }}</span>
            </div>
          </div>

          <div class="progress-row">
            <input
              class="progress"
              type="range"
              min="0"
              [max]="duration() || current.duration || 0"
              [value]="currentTime()"
              (input)="onSeek($event)"
              [disabled]="!audioUrl()"
            />
          </div>

          <div class="volume-row">
            <span class="muted">Volume</span>
            <input
              class="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              [value]="volume()"
              (input)="onVolume($event)"
            />
          </div>
        </article>

        <article class="card lyrics-card">
          <h3>Lyrics</h3>
          <p class="muted">
            Lyrics are not connected yet for this track. We can add internet lyrics integration in the next step.
          </p>
          <div class="lyrics-placeholder">
            <p>{{ current.title }}</p>
            <p>{{ current.artist }}</p>
            <p>♪</p>
          </div>
        </article>
      } @else if (!error()) {
        <p class="muted">Loading song...</p>
      }
    </section>
  `,
  styles: [
    `
      .song-page {
        display: grid;
        gap: 1rem;
      }

      .back-link {
        width: fit-content;
        color: var(--muted);
        font-weight: 600;
      }

      .hero-card {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 1rem;
        align-items: center;
        padding: 1.25rem;
        background: linear-gradient(140deg, #4d6588, #2a4064);
      }

      .cover-box {
        width: 100%;
        aspect-ratio: 1 / 1;
      }

      .cover-box img,
      .cover-fallback {
        width: 100%;
        height: 100%;
        border-radius: 14px;
      }

      .cover-box img {
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .cover-fallback {
        display: grid;
        place-items: center;
        font-size: 3rem;
        background: rgba(10, 18, 34, 0.55);
      }

      .hero-content {
        display: grid;
        gap: 0.5rem;
      }

      .hero-content h1 {
        font-size: clamp(2rem, 5vw, 4.8rem);
        line-height: 1;
        letter-spacing: -0.02em;
      }

      .hero-meta {
        font-size: 1.4rem;
      }

      .hero-submeta {
        font-size: 0.95rem;
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pill {
        padding: 0.35rem 0.6rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .player-card {
        display: grid;
        gap: 0.9rem;
      }

      .player-top {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .play-btn {
        min-width: 110px;
        min-height: 48px;
        border-radius: 999px;
        border: none;
        background: #2ad669;
        color: #041315;
        font-weight: 700;
        cursor: pointer;
      }

      .control-btn {
        min-height: 42px;
        padding: 0 0.8rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: var(--text);
        cursor: pointer;
      }

      .time-block {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--muted);
      }

      .progress-row,
      .volume-row {
        display: grid;
        gap: 0.4rem;
      }

      .progress,
      .volume {
        width: 100%;
        accent-color: #7a87ff;
      }

      .lyrics-card {
        display: grid;
        gap: 0.65rem;
      }

      .lyrics-placeholder {
        border-radius: 12px;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        padding: 0.8rem;
        display: grid;
        gap: 0.35rem;
        color: var(--muted);
      }

      @media (max-width: 900px) {
        .hero-card {
          grid-template-columns: 1fr;
        }

        .cover-box {
          max-width: 280px;
        }

        .time-block {
          margin-left: 0;
        }
      }
    `
  ]
})
export class SongPageComponent implements OnInit, OnDestroy {
  readonly track = signal<Track | null>(null);
  readonly error = signal('');
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly volume = signal(0.8);
  readonly backToSearch = signal(false);
  readonly backSearchQuery = signal('');

  private readonly audio = new Audio();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    private readonly audioCoordinator: AudioPlaybackCoordinatorService,
    private readonly globalPlayer: PlayerService
  ) {}

  ngOnInit(): void {
    this.audio.preload = 'metadata';
    this.audio.volume = this.volume();

    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMeta);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);

    this.route.paramMap.subscribe((params) => {
      const rawTitle = params.get('title') || '';
      const decodedTitle = this.safeDecode(rawTitle).trim();
      const queryParams = this.route.snapshot.queryParamMap;
      this.backToSearch.set(queryParams.get('from') === 'search');
      this.backSearchQuery.set((queryParams.get('q') || '').trim());
      if (!decodedTitle) {
        this.error.set('Song title is invalid.');
        this.track.set(null);
        return;
      }
      this.loadTrack(decodedTitle, this.fallbackTrackFromQuery(decodedTitle));
    });
  }

  ngOnDestroy(): void {
    this.audio.pause();
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMeta);
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('play', this.handlePlay);
    this.audio.removeEventListener('pause', this.handlePause);
  }

  audioUrl(): string {
    const track = this.track();
    if (!track?.audio_file) {
      return '';
    }

    const url = track.audio_file;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }
    return `http://localhost:8000/${url}`;
  }

  togglePlay(): void {
    const src = this.audioUrl();
    if (!src) {
      return;
    }

    if (this.audio.src !== src) {
      this.audio.src = src;
      this.audio.load();
      this.currentTime.set(0);
    }

    if (this.audio.paused) {
      this.globalPlayer.pause();
      this.audioCoordinator.pauseActiveInlineAudio();
      this.audioCoordinator.notifyInlineAudioPlay(this.audio);
      void this.audio.play();
      return;
    }

    this.audio.pause();
  }

  seekBy(deltaSeconds: number): void {
    if (!this.audioUrl()) {
      return;
    }

    const target = (this.audio.currentTime || 0) + deltaSeconds;
    const total = this.audio.duration;
    const next =
      Number.isFinite(total) && total > 0 ? Math.max(0, Math.min(total, target)) : Math.max(0, target);
    this.audio.currentTime = next;
    this.currentTime.set(next);
  }

  onSeek(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    if (!Number.isFinite(value)) {
      return;
    }
    this.audio.currentTime = value;
    this.currentTime.set(value);
  }

  onVolume(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    const normalized = Math.max(0, Math.min(1, value));
    this.audio.volume = normalized;
    this.volume.set(normalized);
  }

  formatTime(value: number): string {
    const safe = Math.max(0, Math.floor(value || 0));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  prettyDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'recently';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed);
  }

  private loadTrack(title: string, fallbackTrack: Track | null): void {
    this.error.set('');
    this.track.set(null);
    this.audio.pause();
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.duration.set(0);

    if (this.api.isAuthenticated) {
      this.api.favoriteSongs().subscribe({
        next: (songs) => {
          const found = songs.find((song) => song.title === title);
          if (found) {
            this.track.set(found);
            return;
          }
          this.loadFromLibrary(title, fallbackTrack);
        },
        error: () => this.loadFromLibrary(title, fallbackTrack)
      });
      return;
    }

    this.loadFromLibrary(title, fallbackTrack);
  }

  private loadFromLibrary(title: string, fallbackTrack: Track | null): void {
    this.api.librarySongs().subscribe({
      next: (songs) => {
        const found = songs.find((song) => song.title === title);
        if (!found) {
          if (fallbackTrack) {
            this.track.set(fallbackTrack);
            return;
          }
          this.error.set(`Song "${title}" was not found.`);
          return;
        }
        this.track.set(found);
      },
      error: (error: HttpErrorResponse) => {
        if (fallbackTrack) {
          this.track.set(fallbackTrack);
          return;
        }
        this.error.set(this.extractError(error));
      }
    });
  }

  private fallbackTrackFromQuery(title: string): Track | null {
    const queryParams = this.route.snapshot.queryParamMap;
    const preview = (queryParams.get('preview') || '').trim();
    if (!preview) {
      return null;
    }

    return {
      title,
      artist: (queryParams.get('artist') || 'Unknown Artist').trim() || 'Unknown Artist',
      artwork_url: (queryParams.get('artwork') || '').trim(),
      audio_file: preview,
      duration: 0,
      genre: (queryParams.get('source') || '').trim(),
      uploaded_by: 0,
      uploaded_by_username: 'search',
      created_at: '',
      updated_at: ''
    };
  }

  private extractError(error: HttpErrorResponse): string {
    const data = error.error;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    return 'Failed to load song details.';
  }

  private safeDecode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private readonly handleTimeUpdate = () => {
    this.currentTime.set(this.audio.currentTime || 0);
  };

  private readonly handleLoadedMeta = () => {
    const loaded = this.audio.duration || 0;
    this.duration.set(loaded);
  };

  private readonly handleEnded = () => {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  };

  private readonly handlePlay = () => {
    this.isPlaying.set(true);
  };

  private readonly handlePause = () => {
    this.isPlaying.set(false);
  };
}
