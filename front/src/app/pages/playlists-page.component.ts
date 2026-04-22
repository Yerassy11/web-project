import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Playlist } from '../core/api.models';

@Component({
  selector: 'app-playlists-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card endpoint-card">
      <h2>Playlists</h2>

      @if (!api.isAuthenticated) {
        <article class="card auth-warning">
          <img class="unauthorized-image" src="/assets/unauthorized.png" alt="Unauthorized access" />
          <h3>Oops, you are not authorized</h3>
          <p class="muted">Please log in to open the Playlists section.</p>
          <a class="btn btn-primary" routerLink="/auth">Login</a>
        </article>
      } @else {
        @if (statusMessage()) {
          <p class="status">{{ statusMessage() }}</p>
        }
        @if (error()) {
          <p class="status">{{ error() }}</p>
        }

        <div class="playlists-layout">
          <div class="playlists-column">
            <h3>Playlists</h3>
            <div class="cards-grid">
              @for (playlist of playlists(); track playlist.id) {
                <a class="card playlist-item" [routerLink]="['/playlists', playlist.id]">
                  <div class="playlist-cover">
                    @if (coverFor(playlist); as cover) {
                      <img [src]="cover" [alt]="playlist.name + ' cover'" />
                    } @else {
                      <div class="playlist-cover-fallback">🎵</div>
                    }
                  </div>

                  <div class="playlist-content">
                    <h4>{{ playlist.name }}</h4>
                    <p class="muted description">{{ playlist.description || 'No description' }}</p>
                    <p class="meta-line">{{ playlist.track_count }} tracks • {{ playlist.is_public ? 'Public' : 'Private' }}</p>
                  </div>
                </a>
              }
            </div>
          </div>

          <aside class="create-column">
            <form [formGroup]="playlistForm" (ngSubmit)="createPlaylist()" class="create-form">
              <h3>Create Playlist</h3>
              <label>Name <input type="text" formControlName="name" /></label>
              <label>Description <input type="text" formControlName="description" /></label>
              <label class="inline-checkbox">
                <input type="checkbox" formControlName="is_public" />
                Public playlist
              </label>
              <button class="btn btn-primary" type="submit" [disabled]="playlistForm.invalid || creatingPlaylist()">
                {{ creatingPlaylist() ? 'Creating...' : 'Create playlist' }}
              </button>
            </form>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .endpoint-card {
        display: grid;
        gap: 24px;
        padding: 24px;
        border-radius: 24px;
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

      .playlists-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        gap: 24px;
        align-items: start;
      }

      .playlists-column {
        display: grid;
        gap: 16px;
      }

      .cards-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }

      .playlist-item {
        display: grid;
        grid-template-columns: 88px 1fr;
        gap: 14px;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        padding: 18px;
        min-height: 170px;
        align-items: start;
        border-radius: 20px;
        border: 1px solid rgba(122, 135, 255, 0.28);
        background: rgba(122, 135, 255, 0.08);
      }

      .playlist-item:hover {
        transform: translateY(-4px);
        border-color: rgba(122, 135, 255, 0.65);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
        background: rgba(122, 135, 255, 0.12);
      }

      .playlist-cover {
        width: 88px;
        height: 88px;
      }

      .playlist-cover img,
      .playlist-cover-fallback {
        width: 100%;
        height: 100%;
        border-radius: 14px;
      }

      .playlist-cover img {
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .playlist-cover-fallback {
        display: grid;
        place-items: center;
        font-size: 1.8rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.07);
      }

      .playlist-content {
        display: grid;
        gap: 8px;
        align-content: start;
      }

      .playlist-item h4 {
        margin: 0;
        font-size: clamp(1.35rem, 2.3vw, 1.7rem);
        line-height: 1.12;
        letter-spacing: 0.01em;
      }

      .description {
        margin: 0;
        font-size: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .meta-line {
        margin: 0;
        font-size: 0.98rem;
        color: #d4ddfb;
      }

      .create-column {
        width: 100%;
      }

      .create-form {
        display: grid;
        gap: 12px;
        padding: 20px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(15, 24, 53, 0.9);
        position: sticky;
        top: 20px;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
      }

      .inline-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 980px) {
        .playlists-layout {
          grid-template-columns: 1fr;
        }

        .cards-grid {
          grid-template-columns: 1fr;
        }

        .playlist-item {
          grid-template-columns: 74px 1fr;
          min-height: 150px;
        }

        .playlist-cover {
          width: 74px;
          height: 74px;
        }

        .create-form {
          position: static;
        }
      }
    `
  ]
})
export class PlaylistsPageComponent implements OnInit {
  readonly playlists = signal<Playlist[]>([]);
  readonly error = signal('');
  readonly statusMessage = signal('');
  readonly creatingPlaylist = signal(false);
  readonly playlistForm;

  constructor(public readonly api: ApiService, private readonly fb: FormBuilder) {
    this.playlistForm = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      description: [''],
      is_public: [true]
    });
  }

  ngOnInit(): void {
    if (!this.api.isAuthenticated) {
      return;
    }
    this.loadPlaylists();
  }

  createPlaylist(): void {
    if (!this.api.isAuthenticated) {
      this.statusMessage.set('Login is required to create playlist.');
      return;
    }
    if (this.playlistForm.invalid) {
      this.statusMessage.set('Please fill playlist name.');
      return;
    }

    this.creatingPlaylist.set(true);
    this.statusMessage.set('');
    this.api
      .createPlaylist(this.playlistForm.getRawValue())
      .pipe(finalize(() => this.creatingPlaylist.set(false)))
      .subscribe({
        next: (playlist) => {
          this.statusMessage.set(`Playlist "${playlist.name}" created.`);
          this.playlistForm.reset({ name: '', description: '', is_public: true });
          this.loadPlaylists();
        },
        error: (error: HttpErrorResponse) => this.statusMessage.set(this.extractError(error))
      });
  }

  private loadPlaylists(): void {
    this.error.set('');
    this.api.playlists().subscribe({
      next: (data) => this.playlists.set(data),
      error: (error: HttpErrorResponse) => this.error.set(this.extractError(error))
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

  coverFor(playlist: Playlist): string | null {
    return playlist.tracks.find((track) => !!track.artwork_url)?.artwork_url || null;
  }
}
