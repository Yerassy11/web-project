import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Album, Track } from '../core/api.models';

@Component({
  selector: 'app-tracks-page',
  template: `
    <section class="card">
      <h2>Треки</h2>
      <p class="muted">Публичный каталог из /api/v1/music/tracks/.</p>
      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
      <div class="grid">
        @for (track of tracks(); track track.id) {
          <article class="card track-item">
            <h3>{{ track.title }}</h3>
            <p class="muted">{{ track.artist }} · {{ track.genre }}</p>
            <p>Длительность: {{ track.duration }} сек</p>
            <audio [src]="track.audio_file" controls></audio>
          </article>
        }
      </div>
    </section>

    <section class="card">
      <h2>Альбомы</h2>
      <p class="muted">Список из /api/v1/music/albums/.</p>
      <div class="grid">
        @for (album of albums(); track album.id) {
          <article class="card">
            <h3>{{ album.title }}</h3>
            <p class="muted">{{ album.artist }} · {{ album.release_year }}</p>
            <p>Треков: {{ album.track_count }}</p>
            <p>Загрузил: {{ album.uploaded_by_username }}</p>
          </article>
        }
      </div>
    </section>
  `
})
export class TracksPageComponent implements OnInit {
  readonly tracks = signal<Track[]>([]);
  readonly albums = signal<Album[]>([]);
  readonly error = signal('');

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.tracks().subscribe({
      next: (data) => this.tracks.set(data),
      error: () => this.error.set('Не удалось загрузить треки.')
    });

    this.api.albums().subscribe({
      next: (data) => this.albums.set(data),
      error: () => this.error.set('Не удалось загрузить альбомы.')
    });
  }
}
