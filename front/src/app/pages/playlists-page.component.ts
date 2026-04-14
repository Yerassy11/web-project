import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Playlist } from '../core/api.models';

@Component({
  selector: 'app-playlists-page',
  template: `
    <section class="card">
      <h2>Плейлисты</h2>
      <p class="muted">Данные подгружаются с /api/v1/playlists/.</p>
      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
      <div class="grid">
        @for (playlist of playlists(); track playlist.id) {
          <article class="card">
            <h3>{{ playlist.name }}</h3>
            <p class="muted">{{ playlist.description }}</p>
            <p>Автор: {{ playlist.owner_username }}</p>
            <p>Треков: {{ playlist.track_count }}</p>
            <p>{{ playlist.is_public ? 'Публичный' : 'Приватный' }}</p>
          </article>
        }
      </div>
    </section>
  `
})
export class PlaylistsPageComponent implements OnInit {
  readonly playlists = signal<Playlist[]>([]);
  readonly error = signal('');

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.playlists().subscribe({
      next: (data) => this.playlists.set(data),
      error: () => this.error.set('Не удалось загрузить плейлисты.')
    });
  }
}
