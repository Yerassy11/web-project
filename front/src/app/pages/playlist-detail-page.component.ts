import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Playlist, Track } from '../core/api.models';
import { PlayerService } from '../core/player.service';
import { AudioPlaybackCoordinatorService } from '../core/audio-playback-coordinator.service';

@Component({
  selector: 'app-playlist-detail-page',
  imports: [RouterLink],
  template: `
    <section class="card detail-page">
      @if (actionMessage()) {
        <div class="toast-notification" [class.error]="actionType() === 'error'">
          {{ actionMessage() }}
        </div>
      }

      <a routerLink="/playlists" class="back-link">← Back to playlists</a>

      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
      @if (playlist(); as current) {
        <article class="card playlist-hero">
          <button
            type="button"
            class="add-toggle"
            (click)="toggleAddPanel()"
            [disabled]="addingSongs()"
          >
            <span class="plus">+</span>
            <span>Add</span>
          </button>

          <h1>{{ current.name }}</h1>
          <p class="muted">{{ current.description || 'No description' }}</p>
          <p><strong>Owner:</strong> {{ current.owner_username }}</p>
          <p><strong>Tracks:</strong> {{ current.track_count }}</p>
          <p><strong>Visibility:</strong> {{ current.is_public ? 'Public' : 'Private' }}</p>

          @if (showAddPanel()) {
            <div class="add-panel">
              <h3>Select songs</h3>

              @if (!librarySongs().length) {
                <p class="muted">No songs found in media library.</p>
              } @else {
                <div class="song-options">
                  @for (song of librarySongs(); track song.title) {
                    <label class="song-option">
                      <input
                        type="checkbox"
                        [checked]="isSongSelected(song.title)"
                        (change)="toggleSongSelection(song.title)"
                      />
                      <span>{{ song.title }}</span>
                      <small class="muted">{{ song.artist }}</small>
                    </label>
                  }
                </div>
              }

              <button
                class="btn btn-primary"
                type="button"
                (click)="addSelectedSongs()"
                [disabled]="!selectedSongTitles().length || addingSongs()"
              >
                {{ addingSongs() ? 'Adding...' : 'Add selected songs' }}
              </button>
            </div>
          }
        </article>

        <article class="card songs-section">
          <h2>Added Songs</h2>
          @if (!current.tracks.length) {
            <p class="muted">No songs in this playlist yet.</p>
          } @else {
            <div class="song-cards">
              @for (track of current.tracks; track track.title) {
                <article class="song-card">
                  <div class="song-head">
                    <div>
                      <h3>{{ track.title }}</h3>
                      <p class="muted">{{ track.artist }}</p>
                    </div>
                    <div class="song-actions">
                      <button class="btn btn-like" type="button" (click)="toggleFavorite(track)">
                        {{ isFavorite(track.title) ? '♥ Liked' : '♡ Like' }}
                      </button>
                      <button class="btn btn-ghost" type="button" (click)="playSong(track)">Play</button>
                    </div>
                  </div>

                  <audio
                    class="song-audio"
                    [src]="getAudioUrl(track.audio_file)"
                    controls
                    preload="none"
                    (play)="onInlineAudioPlay($event)"
                    (ended)="onInlineAudioEnded($event)"
                  ></audio>
                </article>
              }
            </div>
          }
        </article>
      }
    </section>
  `,
  styles: [
    `
      .detail-page {
        display: grid;
        gap: 1rem;
        position: relative;
      }

      .back-link {
        width: fit-content;
        font-weight: 600;
        color: var(--muted);
      }

      .toast-notification {
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid rgba(116, 255, 176, 0.45);
        background: rgba(10, 24, 48, 0.96);
        color: #e7edff;
        box-shadow: 0 14px 26px rgba(0, 0, 0, 0.35);
        font-weight: 600;
        max-width: min(92vw, 720px);
      }

      .toast-notification.error {
        border-color: rgba(255, 125, 160, 0.55);
      }

      .playlist-hero {
        position: relative;
        display: grid;
        gap: 0.55rem;
      }

      .add-toggle {
        position: absolute;
        top: 0;
        right: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.55rem;
        border-radius: 10px;
        border: 1px solid rgba(122, 135, 255, 0.65);
        background: rgba(122, 135, 255, 0.14);
        color: #e7edff;
        cursor: pointer;
      }

      .plus {
        font-size: 1rem;
        font-weight: 800;
        line-height: 1;
      }

      .add-panel {
        margin-top: 0.6rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.2);
        padding: 0.8rem;
        display: grid;
        gap: 0.7rem;
      }

      .song-options {
        max-height: 260px;
        overflow-y: auto;
        display: grid;
        gap: 0.45rem;
      }

      .song-option {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.45rem 0.6rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        padding: 0.45rem 0.6rem;
      }

      .song-option small {
        grid-column: 2;
      }

      .songs-section {
        display: grid;
        gap: 0.8rem;
      }

      .song-cards {
        display: grid;
        gap: 0.75rem;
      }

      .song-card {
        border-radius: 14px;
        border: 1px solid rgba(122, 135, 255, 0.28);
        background: rgba(122, 135, 255, 0.06);
        padding: 0.75rem;
        display: grid;
        gap: 0.7rem;
      }

      .song-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.7rem;
      }

      .song-actions {
        display: flex;
        gap: 0.45rem;
        align-items: center;
      }

      .btn-like {
        border-radius: 10px;
        padding: 0.45rem 0.65rem;
        border: 1px solid rgba(255, 109, 178, 0.4);
        background: rgba(255, 109, 178, 0.1);
        color: #ffd8ea;
      }

      .song-head h3 {
        margin: 0;
      }

      .song-audio {
        width: 100%;
      }
    `
  ]
})
export class PlaylistDetailPageComponent implements OnInit {
  readonly playlist = signal<Playlist | null>(null);
  readonly librarySongs = signal<Track[]>([]);
  readonly selectedSongTitles = signal<string[]>([]);
  readonly favoriteTitles = signal<string[]>([]);
  readonly showAddPanel = signal(false);
  readonly addingSongs = signal(false);
  readonly error = signal('');
  readonly actionMessage = signal('');
  readonly actionType = signal<'success' | 'error'>('success');

  private playlistId = 0;
  private actionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    public readonly player: PlayerService,
    private readonly audioCoordinator: AudioPlaybackCoordinatorService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('Invalid playlist ID.');
      return;
    }

    this.playlistId = id;
    this.loadPlaylist();
    this.loadLibrarySongs();
    this.loadFavoriteSongs();
  }

  toggleAddPanel(): void {
    this.showAddPanel.update((state) => !state);
  }

  isSongSelected(title: string): boolean {
    return this.selectedSongTitles().includes(title);
  }

  toggleSongSelection(title: string): void {
    this.selectedSongTitles.update((selected) =>
      selected.includes(title) ? selected.filter((item) => item !== title) : [...selected, title]
    );
  }

  addSelectedSongs(): void {
    const selected = this.selectedSongTitles();
    if (!selected.length || !this.playlistId) {
      return;
    }

    this.addingSongs.set(true);
    this.hideAction();

    const requests = selected.map((title) => this.api.addTrackToPlaylist(this.playlistId, title, 0));
    let completed = 0;
    let failed = 0;

    requests.forEach((request) => {
      request.subscribe({
        next: () => {
          completed += 1;
          this.finishBatchIfDone(completed, failed, selected.length);
        },
        error: () => {
          failed += 1;
          this.finishBatchIfDone(completed, failed, selected.length);
        }
      });
    });
  }

  playSong(track: Track): void {
    const queue = this.playlist()?.tracks ?? [];
    this.player.playTrack(track, queue);
  }

  onInlineAudioPlay(event: Event): void {
    const audio = event.target as HTMLAudioElement | null;
    if (!audio) {
      return;
    }
    this.player.pause();
    this.audioCoordinator.notifyInlineAudioPlay(audio);
  }

  onInlineAudioEnded(event: Event): void {
    const audio = event.target as HTMLAudioElement | null;
    if (!audio) {
      return;
    }
    this.audioCoordinator.releaseInlineAudio(audio);
  }

  isFavorite(title: string): boolean {
    return this.favoriteTitles().includes(title);
  }

  toggleFavorite(track: Track): void {
    const title = track.title;
    if (this.isFavorite(title)) {
      this.api.unlikeSong(title).subscribe({
        next: () => {
          this.favoriteTitles.update((items) => items.filter((item) => item !== title));
          this.showAction(`Removed "${title}" from favorites.`, 'success');
        },
        error: () => {
          this.showAction(`Could not remove "${title}" from favorites.`, 'error');
        }
      });
      return;
    }

    this.api.likeSong(title).subscribe({
      next: () => {
        this.favoriteTitles.update((items) => (items.includes(title) ? items : [...items, title]));
        this.showAction(`Added "${title}" to favorites.`, 'success');
      },
      error: () => {
        this.showAction(`Could not add "${title}" to favorites.`, 'error');
      }
    });
  }

  getAudioUrl(url: string): string {
    if (!url) {
      return '';
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }
    return `http://localhost:8000/${url}`;
  }

  private finishBatchIfDone(completed: number, failed: number, total: number): void {
    if (completed + failed !== total) {
      return;
    }

    this.addingSongs.set(false);
    if (failed === 0) {
      this.showAction('Songs added to playlist.', 'success');
    } else if (completed === 0) {
      this.showAction('Could not add selected songs.', 'error');
    } else {
      this.showAction(`Added ${completed} song(s), ${failed} failed.`, 'success');
    }

    this.selectedSongTitles.set([]);
    this.loadPlaylist();
  }

  private loadPlaylist(): void {
    this.error.set('');
    this.api.getPlaylist(this.playlistId).subscribe({
      next: (data) => this.playlist.set(data),
      error: (err: HttpErrorResponse) => {
        this.error.set(this.extractError(err));
      }
    });
  }

  private loadLibrarySongs(): void {
    this.api.librarySongs().subscribe({
      next: (data) => this.librarySongs.set(data),
      error: () => {
        this.showAction('Could not load songs from media library.', 'error');
      }
    });
  }

  private loadFavoriteSongs(): void {
    this.api.favoriteSongs().subscribe({
      next: (data) => this.favoriteTitles.set(data.map((track) => track.title)),
      error: () => {
        this.favoriteTitles.set([]);
      }
    });
  }

  private extractError(error: HttpErrorResponse): string {
    const data = error.error;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    return 'Failed to load playlist.';
  }

  private showAction(message: string, type: 'success' | 'error'): void {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
    this.actionType.set(type);
    this.actionMessage.set(message);
    this.actionTimer = setTimeout(() => {
      this.hideAction();
    }, 2500);
  }

  private hideAction(): void {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
    this.actionMessage.set('');
  }
}
