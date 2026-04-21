import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Track } from '../models/api.models';

@Component({
  selector: 'app-track-list',
  standalone: true,
  template: `
    <section class="card">
      <h3>Track List</h3>

      @if (!tracks.length) {
        <p class="muted">No tracks loaded.</p>
      } @else {
        <div class="list">
          @for (track of tracks; track track.id) {
            <article class="item">
              <div>
                <strong>{{ track.title }}</strong>
                <p class="muted">{{ track.artist_name }} · {{ track.genre || 'Unknown genre' }}</p>
              </div>
              <div class="actions">
                <button class="btn btn-primary" type="button" (click)="play.emit(track)">Play</button>
                <button class="btn btn-ghost" type="button" (click)="like.emit(track.id)">Like</button>
                <button class="btn btn-ghost" type="button" (click)="add.emit(track)">Add to playlist</button>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .list {
        display: grid;
        gap: 0.6rem;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      .actions {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class TrackListComponent {
  @Input() tracks: Track[] = [];
  @Output() play = new EventEmitter<Track>();
  @Output() like = new EventEmitter<number>();
  @Output() add = new EventEmitter<Track>();
}
