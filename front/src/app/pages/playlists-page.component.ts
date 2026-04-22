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
            <h3>Added Playlists</h3>
            <div class="cards-grid">
              @for (playlist of playlists(); track playlist.id) {
                <a class="card playlist-item" [routerLink]="['/playlists', playlist.id]">
                  <h4>{{ playlist.name }}</h4>
                  <p class="muted">{{ playlist.description || 'No description' }}</p>
                  <p><strong>Tracks:</strong> {{ playlist.track_count }}</p>
                  <p><strong>Visibility:</strong> {{ playlist.is_public ? 'Public' : 'Private' }}</p>
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

      .playlists-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        gap: 1rem;
        align-items: start;
      }

      .playlists-column {
        display: grid;
        gap: 0.8rem;
      }

      .cards-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .playlist-item {
        display: grid;
        gap: 0.6rem;
        text-decoration: none;
        color: inherit;
        transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        padding: 1.2rem;
        min-height: 220px;
        align-content: start;
        border-radius: 18px;
        border: 1px solid rgba(122, 135, 255, 0.28);
        background: rgba(122, 135, 255, 0.06);
      }

      .playlist-item:hover {
        transform: translateY(-4px);
        border-color: rgba(122, 135, 255, 0.8);
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.3);
      }

      .playlist-item h4 {
        margin: 0;
        font-size: clamp(1.55rem, 2.6vw, 2rem);
        line-height: 1.08;
        letter-spacing: 0.01em;
      }

      .playlist-item p {
        font-size: 1.08rem;
      }

      .create-column {
        width: 100%;
      }

      .create-form {
        display: grid;
        gap: 0.6rem;
        padding: 0.8rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.18);
        position: sticky;
        top: 0.8rem;
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
}
