import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { InternetSongResult } from '../core/api.models';

@Component({
  selector: 'app-genre-details-page',
  imports: [RouterLink],
  template: `
    <section class="genre-details card">
      <a class="back-link" routerLink="/">← Back to Home</a>

      <div class="details-grid">
        <aside class="genre-side">
          @if (genreImage()) {
            <img class="genre-image" [src]="genreImage()" [alt]="genreName() + ' genre artwork'" />
          } @else {
            <div class="genre-image fallback">No image</div>
          }
          <h1>{{ genreName() }}</h1>
          <p class="muted">Auto-picked from iTunes search for this genre.</p>
        </aside>

        <div class="tracks-side">
          <div class="tracks-head">
            <h2>Top tracks</h2>
            <p class="muted">Showing 6 songs.</p>
          </div>

          @if (loading()) {
            <p class="muted">Loading songs...</p>
          } @else if (error()) {
            <div class="error-box">
              <p>{{ error() }}</p>
              <button type="button" class="btn btn-ghost" (click)="loadTracks()">Try again</button>
            </div>
          } @else if (!tracks().length) {
            <p class="muted">No songs found for this genre right now.</p>
          } @else {
            <div class="tracks-list">
              @for (track of tracks(); track track.title + track.artist) {
                <article class="track-row">
                  @if (track.artwork_url) {
                    <img [src]="track.artwork_url" [alt]="track.title" />
                  } @else {
                    <div class="thumb-fallback">♪</div>
                  }
                  <div class="meta">
                    <h3>{{ track.title }}</h3>
                    <p class="muted">{{ track.artist }}</p>
                  </div>
                  @if (track.preview_url) {
                    <audio [src]="track.preview_url" controls preload="none"></audio>
                  }
                </article>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .genre-details {
        display: grid;
        gap: 1rem;
      }

      .back-link {
        color: #c6d4ff;
        text-decoration: none;
        width: fit-content;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .details-grid {
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 1rem;
      }

      .genre-side {
        display: grid;
        align-content: start;
        gap: 0.75rem;
      }

      .genre-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .fallback {
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.04);
      }

      .tracks-side {
        display: grid;
        gap: 0.8rem;
        align-content: start;
      }

      .tracks-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.8rem;
      }

      .tracks-list {
        display: grid;
        gap: 0.6rem;
      }

      .track-row {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        gap: 0.65rem;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.55rem;
      }

      .track-row img,
      .thumb-fallback {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        object-fit: cover;
      }

      .thumb-fallback {
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.08);
      }

      .meta h3 {
        margin: 0;
        font-size: 1rem;
      }

      .meta p {
        margin: 0.2rem 0 0;
      }

      .error-box {
        display: grid;
        gap: 0.6rem;
      }

      audio {
        width: 210px;
      }

      @media (max-width: 940px) {
        .details-grid {
          grid-template-columns: 1fr;
        }

        audio {
          width: 170px;
        }
      }

      @media (max-width: 640px) {
        .track-row {
          grid-template-columns: 56px 1fr;
        }

        audio {
          grid-column: 1 / -1;
          width: 100%;
        }
      }
    `
  ]
})
export class GenreDetailsPageComponent implements OnInit {
  readonly tracks = signal<InternetSongResult[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly genreName = signal('');
  readonly genreImage = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.genreName.set((params.get('name') || '').trim());
      this.loadTracks();
    });

    this.route.queryParamMap.subscribe((params) => {
      this.genreImage.set((params.get('image') || '').trim());
    });
  }

  loadTracks(): void {
    const genre = this.genreName();
    if (!genre) {
      this.error.set('Genre is missing in URL.');
      this.tracks.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.api.searchInternetSongs(genre).subscribe({
      next: (payload) => {
        this.tracks.set(payload.results.slice(0, 6));
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.detail || 'Failed to load genre tracks.');
        this.tracks.set([]);
        this.loading.set(false);
      }
    });
  }
}
