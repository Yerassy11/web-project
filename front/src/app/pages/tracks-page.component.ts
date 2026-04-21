import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Track } from '../core/api.models';
import { AudioPlaybackCoordinatorService } from '../core/audio-playback-coordinator.service';
import { PlayerService } from '../core/player.service';

@Component({
  selector: 'app-tracks-page',
  template: `
    <section class="card endpoint-card">
      <h2>Favorite Songs</h2>

      @if (globalError()) {
        <p class="status">{{ globalError() }}</p>
      }

      @if (!tracks().length && !globalError()) {
        <p class="muted">No favorite songs yet. Like songs from playlists to see them here.</p>
      } @else {
        <div class="tracks-list">
          @for (track of tracks(); track track.title) {
            <article class="card track-item">
              <h3>{{ track.title }}</h3>
              <p class="muted">{{ track.artist }} · {{ track.genre || 'No genre' }}</p>
              <p>Duration: {{ track.duration }} sec</p>
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
    </section>
  `,
  styles: [
    `
      .endpoint-card {
        display: grid;
        gap: 1rem;
      }

      .tracks-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.8rem;
      }

      .track-item {
        display: grid;
        gap: 0.45rem;
      }
    `
  ]
})
export class TracksPageComponent implements OnInit {
  readonly tracks = signal<Track[]>([]);
  readonly globalError = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly audioCoordinator: AudioPlaybackCoordinatorService,
    private readonly player: PlayerService
  ) {}

  ngOnInit(): void {
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
