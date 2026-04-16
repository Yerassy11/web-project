import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Album, Track } from '../core/api.models';

@Component({
  selector: 'app-tracks-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="card endpoint-card">
      <h2>Tracks Endpoint</h2>
      <p class="muted">GET /api/v1/music/tracks/</p>
      @if (globalError()) {
        <p class="status">{{ globalError() }}</p>
      }
      <div class="grid">
        @for (track of tracks(); track track.id) {
          <article class="card track-item">
            <h3>{{ track.title }}</h3>
            <p class="muted">{{ track.artist }} · {{ track.genre || 'No genre' }}</p>
            <p>Duration: {{ track.duration }} sec</p>
            <audio [src]="track.audio_file" controls></audio>
          </article>
        }
      </div>
    </section>

    <section class="card endpoint-card">
      <h2>Albums Endpoint</h2>
      <p class="muted">GET /api/v1/music/albums/ · POST /api/v1/music/albums/</p>
      <form [formGroup]="albumForm" (ngSubmit)="createAlbum()" class="create-form">
        <h3>Create Album</h3>
        <label>Title <input type="text" formControlName="title" /></label>
        <label>Artist <input type="text" formControlName="artist" /></label>
        <label>Release year <input type="number" formControlName="release_year" /></label>
        <button class="btn btn-primary" type="submit" [disabled]="albumForm.invalid || creatingAlbum()">
          {{ creatingAlbum() ? 'Creating...' : 'Create album' }}
        </button>
      </form>
      @if (albumMessage()) {
        <p class="status">{{ albumMessage() }}</p>
      }
      <div class="grid">
        @for (album of albums(); track album.id) {
          <article class="card album-item">
            <h3>{{ album.title }}</h3>
            <p class="muted">{{ album.artist }} · {{ album.release_year || 'Unknown year' }}</p>
            <p>Tracks: {{ album.track_count }}</p>
            <p>Uploaded by: {{ album.uploaded_by_username }}</p>
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

      .create-form h3 {
        margin: 0;
      }
    `
  ]
})
export class TracksPageComponent implements OnInit {
  readonly tracks = signal<Track[]>([]);
  readonly albums = signal<Album[]>([]);
  readonly globalError = signal('');
  readonly albumMessage = signal('');
  readonly creatingAlbum = signal(false);
  readonly albumForm;

  constructor(private readonly api: ApiService, private readonly fb: FormBuilder) {
    this.albumForm = this.fb.nonNullable.group({
      title: ['', [Validators.required]],
      artist: ['', [Validators.required]],
      release_year: [2026, [Validators.required, Validators.min(1900), Validators.max(2100)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  createAlbum(): void {
    if (!this.api.isAuthenticated) {
      this.albumMessage.set('Login is required to create album.');
      return;
    }
    if (this.albumForm.invalid) {
      this.albumMessage.set('Please fill all album fields.');
      return;
    }

    this.creatingAlbum.set(true);
    this.albumMessage.set('');
    this.api
      .createAlbum(this.albumForm.getRawValue())
      .pipe(finalize(() => this.creatingAlbum.set(false)))
      .subscribe({
        next: () => {
          this.albumMessage.set('Album created successfully.');
          this.albumForm.reset({ title: '', artist: '', release_year: 2026 });
          this.loadData();
        },
        error: (error: HttpErrorResponse) => this.albumMessage.set(this.extractError(error))
      });
  }

  private loadData(): void {
    this.globalError.set('');
    this.api.tracks().subscribe({
      next: (data) => this.tracks.set(data),
      error: (error: HttpErrorResponse) => this.globalError.set(`Tracks error: ${this.extractError(error)}`)
    });

    this.api.albums().subscribe({
      next: (data) => this.albums.set(data),
      error: (error: HttpErrorResponse) => this.globalError.set(`Albums error: ${this.extractError(error)}`)
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
