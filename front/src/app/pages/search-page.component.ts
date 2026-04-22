import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { InternetSongResult, Playlist } from '../core/api.models';
import { AudioPlaybackCoordinatorService } from '../core/audio-playback-coordinator.service';
import { PlayerService } from '../core/player.service';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="card search-page">
      <div class="search-head">
        <h2>Search Results</h2>
        <div class="search-row">
          <input
            type="text"
            [(ngModel)]="query"
            name="query"
            placeholder="Search songs"
            (keydown.enter)="submitSearch()"
          />
          <button class="btn btn-primary" type="button" (click)="submitSearch()" [disabled]="searching()">
            {{ searching() ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </div>

      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
      @if (actionMessage()) {
        <p class="status">{{ actionMessage() }}</p>
      }

      @if (!results().length && !searching() && !error()) {
        <p class="muted">No results yet. Try another query.</p>
      } @else {
        <div class="results-list">
          @for (song of results(); track song.title + song.artist) {
            <article class="card result-item">
              <a
                class="meta-row song-open-link"
                [routerLink]="['/song', song.title]"
                [queryParams]="songQueryParams(song)"
              >
                @if (song.artwork_url) {
                  <img [src]="song.artwork_url" alt="Artwork" />
                }
                <div>
                  <h3>{{ song.title }}</h3>
                  <p class="muted">{{ song.artist }}</p>
                  <p class="muted small">Source: {{ song.source }}</p>
                </div>
              </a>

              @if (song.preview_url) {
                <audio
                  [src]="song.preview_url"
                  controls
                  preload="none"
                  (play)="onInlineAudioPlay($event)"
                  (ended)="onInlineAudioEnded($event)"
                ></audio>
              }

              <div class="actions-row">
                <button
                  class="btn btn-like"
                  type="button"
                  (click)="likeSong(song)"
                  [disabled]="!api.isAuthenticated"
                >
                  Like
                </button>

                <div class="playlist-picker">
                  <button
                    class="btn btn-ghost"
                    type="button"
                    (click)="togglePlaylistList(song)"
                    [disabled]="!api.isAuthenticated"
                  >
                    Add to playlist
                  </button>

                  @if (openedPlaylistMenuFor() === menuKey(song)) {
                    <div class="playlist-list">
                      @if (!myPlaylists().length) {
                        <p class="muted">No playlists yet.</p>
                      } @else {
                        @for (playlist of myPlaylists(); track playlist.id) {
                          <button class="btn btn-ghost" type="button" (click)="addToPlaylist(song, playlist)">
                            {{ playlist.name }}
                          </button>
                        }
                      }
                    </div>
                  }
                </div>
              </div>

              @if (!api.isAuthenticated) {
                <p class="muted">Login is required to like songs and add them to playlists.</p>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .search-page {
        display: grid;
        gap: 1rem;
      }

      .search-head {
        display: grid;
        gap: 0.7rem;
      }

      .search-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.6rem;
      }

      .results-list {
        display: grid;
        gap: 0.8rem;
      }

      .result-item {
        display: grid;
        gap: 0.7rem;
      }

      .meta-row {
        display: flex;
        gap: 0.7rem;
        align-items: center;
      }

      .song-open-link {
        text-decoration: none;
        border-radius: 12px;
        padding: 0.2rem;
      }

      .song-open-link:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .meta-row img {
        width: 58px;
        height: 58px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }

      .meta-row h3 {
        margin: 0;
      }

      .small {
        font-size: 0.9rem;
      }

      .actions-row {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .btn-like {
        border-radius: 10px;
        padding: 0.45rem 0.65rem;
        border: 1px solid rgba(255, 109, 178, 0.4);
        background: rgba(255, 109, 178, 0.1);
        color: #ffd8ea;
      }

      .playlist-picker {
        position: relative;
      }

      .playlist-list {
        position: absolute;
        top: calc(100% + 0.45rem);
        left: 0;
        min-width: 220px;
        z-index: 20;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 12px;
        background: rgba(10, 14, 32, 0.96);
        padding: 0.5rem;
        display: grid;
        gap: 0.35rem;
      }

      audio {
        width: 100%;
      }
    `
  ]
})
export class SearchPageComponent implements OnInit {
  readonly results = signal<InternetSongResult[]>([]);
  readonly myPlaylists = signal<Playlist[]>([]);
  readonly searching = signal(false);
  readonly error = signal('');
  readonly actionMessage = signal('');
  readonly openedPlaylistMenuFor = signal<string | null>(null);

  query = '';

  constructor(
    public readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly player: PlayerService,
    private readonly audioCoordinator: AudioPlaybackCoordinatorService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const q = (params.get('q') || '').trim();
      this.query = q;
      if (q.length >= 2) {
        this.loadResults(q);
      } else {
        this.results.set([]);
      }
    });

    if (this.api.isAuthenticated) {
      this.api.me().subscribe({
        next: (me) => {
          this.api.playlists().subscribe({
            next: (data) => this.myPlaylists.set(data.filter((playlist) => playlist.owner === me.id)),
            error: () => this.myPlaylists.set([])
          });
        },
        error: () => this.myPlaylists.set([])
      });
    }
  }

  submitSearch(): void {
    const q = this.query.trim();
    if (q.length < 2) {
      this.error.set('Enter at least 2 characters to search.');
      return;
    }

    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  songQueryParams(song: InternetSongResult): Record<string, string> {
    return {
      from: 'search',
      q: this.query.trim(),
      artist: song.artist || '',
      artwork: song.artwork_url || '',
      preview: song.preview_url || '',
      source: song.source || ''
    };
  }

  menuKey(song: InternetSongResult): string {
    return `${song.title}::${song.artist}`;
  }

  togglePlaylistList(song: InternetSongResult): void {
    const key = this.menuKey(song);
    this.openedPlaylistMenuFor.update((current) => (current === key ? null : key));
  }

  addToPlaylist(song: InternetSongResult, playlist: Playlist): void {
    if (!this.api.isAuthenticated) {
      this.actionMessage.set('Login is required to add songs.');
      return;
    }

    this.api
      .addTrackToPlaylist(playlist.id, song.title, 0, {
        artist: song.artist,
        preview_url: song.preview_url,
        artwork_url: song.artwork_url
      })
      .subscribe({
        next: () => {
          this.actionMessage.set(`Added "${song.title}" to playlist "${playlist.name}".`);
          this.openedPlaylistMenuFor.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const reason = this.extractError(error);
          if (reason === 'Song not found in library.') {
            this.actionMessage.set(
              `Could not add "${song.title}". No playable preview was found for this song.`
            );
            return;
          }
          this.actionMessage.set(reason);
        }
      });
  }

  likeSong(song: InternetSongResult): void {
    if (!this.api.isAuthenticated) {
      this.actionMessage.set('Login is required to like songs.');
      return;
    }

    this.api
      .likeSong(song.title, {
        artist: song.artist,
        preview_url: song.preview_url,
        artwork_url: song.artwork_url
      })
      .subscribe({
      next: () => {
        this.actionMessage.set(`Added "${song.title}" to favorites.`);
      },
      error: (error: HttpErrorResponse) => {
        this.actionMessage.set(this.extractError(error));
      }
    });
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

  private loadResults(query: string): void {
    this.searching.set(true);
    this.error.set('');
    this.actionMessage.set('');
    this.api.searchInternetSongs(query).subscribe({
      next: (payload) => {
        this.results.set(payload.results || []);
        this.searching.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.extractError(error));
        this.searching.set(false);
      }
    });
  }

  private extractError(error: HttpErrorResponse): string {
    const data = error.error;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (data && typeof data === 'object') {
      const key = Object.keys(data)[0];
      const value = data[key];
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }
    return 'Request failed. Check backend connection.';
  }
}
