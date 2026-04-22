import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Track } from '../core/api.models';
import { AudioPlaybackCoordinatorService } from '../core/audio-playback-coordinator.service';
import { PlayerService } from '../core/player.service';

@Component({
  selector: 'app-tracks-page',
  imports: [RouterLink],
  template: `
    <section class="card endpoint-card" (click)="closeMenu()">
      <h2>Favorite Songs</h2>

      @if (!api.isAuthenticated) {
        <article class="card auth-warning">
          <img class="unauthorized-image" src="/assets/unauthorized.png" alt="Unauthorized access" />
          <h3>Oops, you are not authorized</h3>
          <p class="muted">Please log in to open the Favorite Songs section.</p>
          <a class="btn btn-primary" routerLink="/auth">Login</a>
        </article>
      } @else {
        @if (globalError()) {
          <p class="status">{{ globalError() }}</p>
        }

        @if (!tracks().length && !globalError()) {
          <p class="muted">No favorite songs yet. Like songs from playlists to see them here.</p>
        } @else {
          <div class="tracks-list">
            @for (track of tracks(); track track.title) {
              <article class="card track-item">
                <div class="track-head">
                  <a class="track-meta track-open-link" [routerLink]="['/song', track.title]" (click)="$event.stopPropagation()">
                    @if (track.artwork_url) {
                      <img class="track-cover" [src]="track.artwork_url" [alt]="track.title + ' cover'" />
                    } @else {
                      <div class="track-cover track-cover-placeholder">♪</div>
                    }
                    <div>
                      <h3>{{ track.title }}</h3>
                      <p class="muted">{{ track.artist }} · {{ track.genre || 'No genre' }}</p>
                    </div>
                  </a>

                  <div class="menu-wrap">
                    <button class="menu-btn" type="button" (click)="toggleMenu(track.title, $event)">⋯</button>

                    @if (openedMenuTitle() === track.title) {
                      <div class="menu-dropdown" (click)="$event.stopPropagation()">
                        <button class="menu-danger" type="button" (click)="removeFromFavorites(track)">
                          Remove from favorites
                        </button>
                      </div>
                    }
                  </div>
                </div>
                <audio
                  [src]="track.audio_file"
                  controls
                  (play)="onInlineAudioPlay($event)"
                  (ended)="onInlineAudioEnded($event)"
                ></audio>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .endpoint-card {
        display: grid;
        gap: 1rem;
      }

      .auth-warning {
        display: grid;
        gap: 0.65rem;
        justify-items: center;
        text-align: center;
      }

      .unauthorized-image {
        width: min(220px, 70vw);
        height: auto;
        display: block;
      }

      .tracks-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.8rem;
      }

      .track-item {
        display: grid;
        gap: 0.45rem;
        position: relative;
      }

      .track-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.7rem;
      }

      .track-meta {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .track-open-link {
        text-decoration: none;
        border-radius: 12px;
        padding: 0.18rem;
      }

      .track-open-link:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .menu-wrap {
        position: relative;
      }

      .menu-btn {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #e7edff;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
      }

      .menu-dropdown {
        position: absolute;
        top: calc(100% + 0.35rem);
        right: 0;
        min-width: 190px;
        padding: 0.4rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(10, 14, 32, 0.96);
        z-index: 15;
      }

      .menu-danger {
        width: 100%;
        border: 1px solid rgba(255, 109, 178, 0.4);
        background: rgba(255, 109, 178, 0.1);
        color: #ffd8ea;
        padding: 0.5rem 0.65rem;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
      }

      .track-cover {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.18);
        flex: 0 0 auto;
      }

      .track-cover-placeholder {
        display: grid;
        place-items: center;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.06);
        font-size: 1.15rem;
      }
    `
  ]
})
export class TracksPageComponent implements OnInit {
  readonly tracks = signal<Track[]>([]);
  readonly globalError = signal('');
  readonly openedMenuTitle = signal<string | null>(null);

  constructor(
    public readonly api: ApiService,
    private readonly audioCoordinator: AudioPlaybackCoordinatorService,
    private readonly player: PlayerService
  ) {}

  ngOnInit(): void {
    if (!this.api.isAuthenticated) {
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    this.globalError.set('');
    this.api.favoriteSongs().subscribe({
      next: (data) => this.tracks.set(data),
      error: (error: HttpErrorResponse) => this.globalError.set(`Favorite Songs error: ${this.extractError(error)}`)
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

  toggleMenu(trackTitle: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openedMenuTitle.update((current) => (current === trackTitle ? null : trackTitle));
  }

  removeFromFavorites(track: Track): void {
    this.globalError.set('');
    this.api.unlikeSong(track.title).subscribe({
      next: () => {
        this.tracks.update((items) => items.filter((item) => item.title !== track.title));
        this.openedMenuTitle.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.globalError.set(`Could not remove from favorites: ${this.extractError(error)}`);
      }
    });
  }

  closeMenu(): void {
    this.openedMenuTitle.set(null);
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
