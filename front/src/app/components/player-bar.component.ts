import { Component } from '@angular/core';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-player-bar',
  standalone: true,
  template: `
    <section class="player card">
      @if (player.currentTrack(); as track) {
        <div class="meta">
          <strong>{{ track.title }}</strong>
          <p class="muted">{{ track.artist_name }}</p>
        </div>

        <div class="controls">
          <button class="btn btn-ghost" type="button" (click)="player.prev()">Prev</button>
          <button class="btn btn-primary" type="button" (click)="player.togglePlayPause()">
            {{ player.isPlaying() ? 'Pause' : 'Play' }}
          </button>
          <button class="btn btn-ghost" type="button" (click)="player.next()">Next</button>
        </div>

        <div class="progress">
          <span>{{ format(player.currentTime()) }}</span>
          <input
            type="range"
            min="0"
            [max]="player.duration()"
            [value]="player.currentTime()"
            (input)="onSeek($event)"
          />
          <span>{{ format(player.duration()) }}</span>
        </div>
      } @else {
        <p class="muted">Select a track to start playback.</p>
      }
    </section>
  `,
  styles: [
    `
      .player {
        position: sticky;
        bottom: 0;
        margin-top: 0.8rem;
        display: grid;
        gap: 0.6rem;
      }

      .controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .progress {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        align-items: center;
      }
    `,
  ],
})
export class PlayerBarComponent {
  constructor(public readonly player: PlayerService) {}

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.player.seek(Number(input.value));
  }

  format(seconds: number): string {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const min = Math.floor(safe / 60);
    const sec = (safe % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }
}
