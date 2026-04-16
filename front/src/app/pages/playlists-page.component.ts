import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Playlist } from '../core/api.models';

@Component({
  selector: 'app-playlists-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="card endpoint-card">
      <h2>Playlists Endpoint</h2>
      <p class="muted">GET /api/v1/playlists/ · POST /api/v1/playlists/</p>

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

      <form [formGroup]="addTrackForm" (ngSubmit)="addTrackToPlaylist()" class="create-form">
        <h3>Add Track To Playlist</h3>
        <label>Playlist ID <input type="number" formControlName="playlist_id" /></label>
        <label>Track ID <input type="number" formControlName="track_id" /></label>
        <button class="btn btn-ghost" type="submit" [disabled]="addTrackForm.invalid || addingTrack()">
          {{ addingTrack() ? 'Adding...' : 'Add track' }}
        </button>
      </form>

      @if (statusMessage()) {
        <p class="status">{{ statusMessage() }}</p>
      }
      @if (error()) {
        <p class="status">{{ error() }}</p>
      }

      <div class="grid">
        @for (playlist of playlists(); track playlist.id) {
          <article class="card playlist-item">
            <h3>{{ playlist.name }}</h3>
            <p class="muted">{{ playlist.description || 'No description' }}</p>
            <p><strong>ID:</strong> {{ playlist.id }}</p>
            <p><strong>Owner:</strong> {{ playlist.owner_username }}</p>
            <p><strong>Tracks:</strong> {{ playlist.track_count }}</p>
            <p><strong>Visibility:</strong> {{ playlist.is_public ? 'Public' : 'Private' }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .endpoint-card {
        display: grid;
        gap: 1rem;
      }

      .create-form {
        display: grid;
        gap: 0.6rem;
        padding: 0.8rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.18);
      }

      .inline-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    `
  ]
})
export class PlaylistsPageComponent implements OnInit {
  readonly playlists = signal<Playlist[]>([]);
  readonly error = signal('');
  readonly statusMessage = signal('');
  readonly creatingPlaylist = signal(false);
  readonly addingTrack = signal(false);
  readonly myPlaylists = computed(() => this.playlists().filter((playlist) => !playlist.is_public || this.api.isAuthenticated));
  readonly playlistForm;
  readonly addTrackForm;

  constructor(private readonly api: ApiService, private readonly fb: FormBuilder) {
    this.playlistForm = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      description: [''],
      is_public: [true]
    });

    this.addTrackForm = this.fb.nonNullable.group({
      playlist_id: [0, [Validators.required, Validators.min(1)]],
      track_id: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
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

  addTrackToPlaylist(): void {
    if (!this.api.isAuthenticated) {
      this.statusMessage.set('Login is required to modify playlist.');
      return;
    }
    if (this.addTrackForm.invalid) {
      this.statusMessage.set('Provide valid playlist ID and track ID.');
      return;
    }

    const { playlist_id, track_id } = this.addTrackForm.getRawValue();
    this.addingTrack.set(true);
    this.statusMessage.set('');
    this.api
      .addTrackToPlaylist(playlist_id, track_id, 0)
      .pipe(finalize(() => this.addingTrack.set(false)))
      .subscribe({
        next: (playlist) => {
          this.statusMessage.set(`Track added to playlist "${playlist.name}".`);
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
