import { Component, OnInit, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface FallingTrackCard {
  title: string;
  artist: string;
  top: string;
  left: string;
  delay: string;
  duration: string;
  color: string;
}

interface GenreItem {
  name: string;
  image: string;
}

interface ArtistItem {
  name: string;
  image: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, NgClass],
  template: `
    <section class="home-section home-hero card">
      <div class="hero-overlay">
        @for (item of fallingCards; track item.title) {
          <article
            class="falling-card"
            [style.top]="item.top"
            [style.left]="item.left"
            [style.animation-delay]="item.delay"
            [style.animation-duration]="item.duration"
            [style.background]="item.color"
          >
            <p>{{ item.title }}</p>
            <span>{{ item.artist }}</span>
          </article>
        }
      </div>

      <div class="hero-content">
        <p class="eyebrow">SHUMAQ EXPERIENCE</p>
        <h1>Your music story starts with the right vibe.</h1>
        <p class="hero-text">
          Discover tracks, pick favorite genres, choose beloved artists, and build your personal
          taste profile before signing up.
        </p>
        <div class="cta-row">
          <a routerLink="/favsongs" class="btn btn-ghost">Explore Favorite Songs</a>
          <a routerLink="/playlists" class="btn btn-ghost">View Playlists</a>
        </div>
      </div>
    </section>

    <section class="home-section card picker">
      <div class="section-head">
        <h2>Pick your genres</h2>
        <p>Choose from visual genre cards.</p>
      </div>

      <div class="genres-grid">
        @for (genre of genres; track genre.name) {
          <article
            class="genre-card"
            [ngClass]="{ selected: isGenreSelected(genre.name) }"
            tabindex="0"
          >
            <img [src]="genre.image" [alt]="genre.name" />
            <span>{{ genre.name }}</span>
            <div class="genre-actions" role="group" [attr.aria-label]="'Actions for ' + genre.name">
              <button
                type="button"
                class="btn btn-primary action-btn"
                (click)="toggleGenre(genre.name)"
              >
                Pick
              </button>
              <button
                type="button"
                class="btn btn-ghost action-btn"
                (click)="openGenreDetails(genre)"
              >
                Show more
              </button>
            </div>
          </article>
        }
      </div>
    </section>

    <section class="home-section card picker">
      <div class="section-head">
        <h2>Choose favorite artists</h2>
        <p>Build your profile to receive smarter recommendations.</p>
      </div>

      <div class="artists-scroll">
        @for (artist of artists; track artist.name) {
          <button type="button" class="artist-card" [ngClass]="{ selected: isArtistSelected(artist.name) }" (click)="toggleArtist(artist.name)">
            <img [src]="artist.image" [alt]="artist.name" />
            <span>{{ artist.name }}</span>
          </button>
        }
      </div>
    </section>

    <section class="home-section grid">
      <article class="card">
        <h3>Selected Genres</h3>
        <p class="muted">{{ selectedGenresText() }}</p>
      </article>
      <article class="card">
        <h3>Selected Artists</h3>
        <p class="muted">{{ selectedArtistsText() }}</p>
      </article>
      <article class="card">
        <h3>Profile Readiness</h3>
        <p class="muted">{{ completionText() }}</p>
      </article>
      <article class="card">
        <h3>Next Step</h3>
        <p class="muted">Create your account and turn these picks into your personalized feed.</p>
      </article>
    </section>

    <section class="home-section card final-cta">
      <h2>Ready to join Shumaq?</h2>
      <p>Your selected genres and artists will be used as your starter taste profile.</p>
      <button class="btn btn-primary big" type="button" (click)="goToRegistration()">
        Continue to Registration
      </button>
    </section>
  `,
  styles: [
    `
      .home-section + .home-section {
        margin-top: 1.1rem;
      }

      .home-hero {
        position: relative;
        overflow: hidden;
        min-height: 420px;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .falling-card {
        position: absolute;
        width: 170px;
        border-radius: 16px;
        padding: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }

      .falling-card p {
        font-weight: 700;
      }

      .falling-card span {
        color: #d8e0ff;
        font-size: 0.85rem;
      }

      .hero-content {
        position: relative;
        z-index: 2;
        display: grid;
        gap: 1rem;
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
        justify-items: center;
      }

      .hero-content h1 {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .hero-text {
        color: var(--muted);
        max-width: 60ch;
      }

      .hero-content .eyebrow {
        text-align: center;
      }

      .picker {
        display: grid;
        gap: 0.9rem;
      }

      .section-head p {
        color: var(--muted);
      }

      .genres-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.9rem;
      }

      .genre-card {
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        padding: 0;
        aspect-ratio: 1 / 1;
        transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
      }

      .genre-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .genre-card span {
        position: absolute;
        left: 0.7rem;
        bottom: 0.7rem;
        font-weight: 700;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
      }

      .genre-actions {
        position: absolute;
        left: 0.7rem;
        right: 0.7rem;
        bottom: 0.7rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.45rem;
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .action-btn {
        justify-content: center;
        padding: 0.45rem 0.55rem;
        font-size: 0.92rem;
      }

      .genre-card:hover {
        transform: scale(1.05);
        border-color: rgba(105, 255, 253, 0.7);
        box-shadow:
          0 0 18px rgba(103, 241, 255, 0.45),
          0 0 36px rgba(150, 66, 255, 0.28);
      }

      .genre-card:hover span,
      .genre-card:focus-within span {
        opacity: 0.12;
      }

      .genre-card:hover .genre-actions,
      .genre-card:focus-within .genre-actions {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .genre-card.selected {
        border-color: rgba(255, 109, 178, 0.95);
        box-shadow:
          0 0 14px rgba(255, 109, 178, 0.48),
          0 0 30px rgba(122, 135, 255, 0.35);
      }

      .artists-scroll {
        display: flex;
        gap: 0.8rem;
        overflow-x: auto;
        padding-bottom: 0.45rem;
      }

      .artists-scroll::-webkit-scrollbar {
        height: 8px;
      }

      .artists-scroll::-webkit-scrollbar-thumb {
        background: rgba(122, 135, 255, 0.45);
        border-radius: 999px;
      }

      .artist-card {
        min-width: 170px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 14px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.05);
        color: #eef2ff;
        cursor: pointer;
        padding: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .artist-card img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }

      .artist-card span {
        display: block;
        padding: 0.55rem 0.7rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .artist-card:hover {
        transform: translateY(-3px);
        border-color: rgba(105, 255, 253, 0.7);
        box-shadow:
          0 0 16px rgba(103, 241, 255, 0.38),
          0 0 32px rgba(150, 66, 255, 0.24);
      }

      .artist-card.selected {
        background: var(--accent);
        border-color: transparent;
      }

      .final-cta {
        text-align: center;
        display: grid;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .final-cta p {
        color: var(--muted);
      }

      .big {
        justify-self: center;
        min-width: 260px;
      }

      @keyframes fall {
        0% {
          transform: translateY(-180px) rotate(-8deg);
          opacity: 0;
        }
        10% {
          opacity: 0.9;
        }
        100% {
          transform: translateY(560px) rotate(12deg);
          opacity: 0;
        }
      }

      @media (max-width: 900px) {
        .genres-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .genres-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (hover: none), (pointer: coarse) {
        .genre-card span {
          opacity: 0.2;
        }

        .genre-actions {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
      }
    `
  ]
})
export class HomePageComponent implements OnInit {
  readonly genres: GenreItem[] = [
    { name: 'Lo-fi Hip Hop', image: '/assets/lofi.jpg' },
    { name: 'Phonk', image: '/assets/phonk.jpg' },
    { name: 'Indie Pop', image: '/assets/indie_pop.jpg' },
    { name: 'Ambient', image: '/assets/ambient.jpg' },
    { name: 'Drum and Bass', image: '/assets/drum_and_bass.jpg' },
    { name: 'House', image: '/assets/house.png' },
    { name: 'Afro Beat', image: '/assets/afro_beats.jpeg' },
    { name: 'Synthwave', image: '/assets/synthwave.webp' },
    { name: 'Neo Soul', image: '/assets/neo_soul.webp' },
    { name: 'Chillhop', image: '/assets/chillhop.jpg' },
    { name: 'Jazzhop', image: '/assets/jazzhop.jpg' },
    { name: 'R and B', image: '/assets/R_and_B.jpeg' }
  ];

  readonly artists: ArtistItem[] = [
    { name: 'Moldanazar', image: '/assets/artists/moldanazar.jpg' },
    { name: 'Jinsang', image: '/assets/artists/jinsang.jpg' },
    { name: 'Yenlik', image: '/assets/artists/yenlik.jpg' },
    { name: 'Joji', image: '/assets/artists/joji.avif' },
    { name: 'Dimash', image: '/assets/artists/dimash.jpg' },
    { name: 'Nujabes', image: '/assets/artists/nujabes.jpeg' },
    { name: 'FKJ', image: '/assets/artists/fkj.jpg' },
    { name: 'ODESZA', image: '/assets/artists/odesza.jpg' },
    { name: 'Tomppabeats', image: '/assets/artists/tomppabeats.jpeg' },
    { name: 'Keshi', image: '/assets/artists/keshi.jpeg' },
    { name: 'Kina', image: '/assets/artists/kina.jpeg' },
    { name: 'The Weeknd', image: '/assets/artists/the_weeknd.jpeg' },
    { name: 'Billie Eilish', image: '/assets/artists/billie_eilish.jpg' },
    { name: 'Shakira', image: '/assets/artists/shakira.jpg' }
  ];

  readonly fallingCards: FallingTrackCard[] = [
    {
      title: 'Night Transit',
      artist: 'Jinsang',
      top: '-120px',
      left: '6%',
      delay: '0s',
      duration: '10s',
      color: 'rgba(77,95,255,0.75)'
    },
    {
      title: 'Blue Lights',
      artist: 'Moldanazar',
      top: '-220px',
      left: '25%',
      delay: '2.2s',
      duration: '11s',
      color: 'rgba(50,183,255,0.72)'
    },
    {
      title: 'Focus Bloom',
      artist: 'Idealism',
      top: '-180px',
      left: '44%',
      delay: '4.5s',
      duration: '12s',
      color: 'rgba(73,214,172,0.72)'
    },
    {
      title: 'After Midnight',
      artist: 'Joji',
      top: '-150px',
      left: '63%',
      delay: '1.3s',
      duration: '10.5s',
      color: 'rgba(255,118,171,0.74)'
    },
    {
      title: 'Gym Pulse',
      artist: 'Sxwxl',
      top: '-260px',
      left: '80%',
      delay: '3.5s',
      duration: '9.8s',
      color: 'rgba(255,102,153,0.75)'
    }
  ];

  private readonly selectedGenres = signal<string[]>([]);
  private readonly selectedArtists = signal<string[]>([]);

  readonly selectedGenresText = computed(() =>
    this.selectedGenres().length ? this.selectedGenres().join(', ') : 'No genres selected yet.'
  );
  readonly selectedArtistsText = computed(() =>
    this.selectedArtists().length ? this.selectedArtists().join(', ') : 'No artists selected yet.'
  );
  readonly completionText = computed(() => {
    const genreCount = this.selectedGenres().length;
    const artistCount = this.selectedArtists().length;
    return `You picked ${genreCount} genre(s) and ${artistCount} artist(s).`;
  });

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('shumaq_onboarding_preferences');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { genres?: string[]; artists?: string[] };
      if (Array.isArray(parsed.genres)) this.selectedGenres.set(parsed.genres);
      if (Array.isArray(parsed.artists)) this.selectedArtists.set(parsed.artists);
    } catch {
      // Ignore malformed localStorage payload.
    }
  }

  isGenreSelected(genre: string): boolean {
    return this.selectedGenres().includes(genre);
  }

  isArtistSelected(artist: string): boolean {
    return this.selectedArtists().includes(artist);
  }

  toggleGenre(genre: string): void {
    this.selectedGenres.update((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]
    );
    this.persistPreferences();
  }

  openGenreDetails(genre: GenreItem): void {
    void this.router.navigate(['/genre', genre.name], {
      queryParams: { image: genre.image }
    });
  }

  toggleArtist(artist: string): void {
    this.selectedArtists.update((current) =>
      current.includes(artist) ? current.filter((item) => item !== artist) : [...current, artist]
    );
    this.persistPreferences();
  }

  goToRegistration(): void {
    this.persistPreferences();
    void this.router.navigateByUrl('/auth');
  }

  private persistPreferences(): void {
    localStorage.setItem(
      'shumaq_onboarding_preferences',
      JSON.stringify({
        genres: this.selectedGenres(),
        artists: this.selectedArtists(),
        savedAt: new Date().toISOString()
      })
    );
  }
}
