import { Component, OnInit, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PlayerService } from '../core/player.service';
import { Track } from '../core/api.models';

interface Preference {
  genres: string[];
  artists: string[];
}

@Component({
  selector: 'app-recommendations-page',
  imports: [NgClass, RouterLink],
  template: `
    <section class="reco-page">

      <!-- Hero header -->
      <div class="reco-hero card">
        <div class="hero-bg">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>
        <div class="hero-content">
          <p class="eyebrow">JUST FOR YOU</p>
          <h1>Your <span class="gradient-text">Recommendations</span></h1>
          <p class="hero-sub">
            @if (preferences().genres.length || preferences().artists.length) {
              Based on your taste in
              @if (preferences().genres.length) { <strong>{{ preferences().genres.slice(0,3).join(', ') }}</strong> }
              @if (preferences().genres.length && preferences().artists.length) { and }
              @if (preferences().artists.length) { artists like <strong>{{ preferences().artists.slice(0,2).join(', ') }}</strong> }
            } @else {
              Trending & top-rated tracks picked for you
            }
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button" (click)="playAll()" [disabled]="!tracks().length">
              ▶ Play All
            </button>
            <button class="btn btn-ghost" type="button" (click)="refresh()">
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          class="chip"
          [class.active]="activeFilter() === 'all'"
          type="button"
          (click)="setFilter('all')"
        >All</button>
        @for (genre of preferences().genres.slice(0, 5); track genre) {
          <button
            class="chip"
            [class.active]="activeFilter() === genre"
            type="button"
            (click)="setFilter(genre)"
          >{{ genre }}</button>
        }
      </div>

      <!-- Status messages -->
      @if (loading()) {
        <div class="loading-grid">
          @for (i of skeletonItems; track i) {
            <div class="track-card skeleton">
              <div class="sk-art"></div>
              <div class="sk-lines">
                <div class="sk-line wide"></div>
                <div class="sk-line"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="empty-state card">
          <p class="empty-icon">⚠️</p>
          <p>{{ error() }}</p>
          <button class="btn btn-ghost" type="button" (click)="refresh()">Try again</button>
        </div>
      } @else if (!filteredTracks().length) {
        <div class="empty-state card">
          <p class="empty-icon">🎵</p>
          <h3>No tracks found</h3>
          <p class="muted">Go to Home and pick some genres & artists to personalize your feed.</p>
          <a routerLink="/" class="btn btn-primary">Pick Preferences</a>
        </div>
      } @else {
        <!-- Stats bar -->
        <div class="stats-bar">
          <span class="stat">{{ filteredTracks().length }} tracks</span>
          @if (metaInfo()?.genres_used?.length) {
            <span class="stat">{{ metaInfo()!.genres_used.length }} genre(s) matched</span>
          }
          @if (currentlyPlayingTitle()) {
            <span class="stat playing-stat">▶ {{ currentlyPlayingTitle() }}</span>
          }
        </div>

        <!-- Track grid -->
        <div class="tracks-grid">
          @for (track of filteredTracks(); track track.title; let i = $index) {
            <article
              class="track-card card"
              [class.playing]="isCurrentTrack(track)"
              [style.animation-delay]="(i * 0.04) + 's'"
            >
              <div class="art-wrap" (click)="playTrack(track)">
                @if (track.artwork_url) {
                  <img [src]="track.artwork_url" [alt]="track.title" class="track-art" />
                } @else {
                  <div class="track-art art-placeholder">♪</div>
                }
                <div class="art-overlay">
                  @if (isCurrentTrack(track) && player.isPlaying()) {
                    <div class="eq-bars">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  } @else {
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </div>
              </div>

              <div class="track-info">
                <h3 class="track-title" [title]="track.title">{{ track.title }}</h3>
                <p class="track-artist">{{ track.artist }}</p>
                @if (track.genre) {
                  <span class="track-genre">{{ track.genre }}</span>
                }
              </div>

              <div class="track-actions">
                @if (track.duration) {
                  <span class="duration">{{ formatDuration(track.duration) }}</span>
                }
                <button
                  class="icon-action"
                  type="button"
                  title="Add to favorites"
                  (click)="likeSong(track)"
                  [disabled]="!api.isAuthenticated"
                >♥</button>
                <button
                  class="icon-action"
                  type="button"
                  title="Add to queue"
                  (click)="addToQueue(track)"
                >+</button>
              </div>
            </article>
          }
        </div>
      }

      <!-- Action feedback toast -->
      @if (toastMsg()) {
        <div class="toast">{{ toastMsg() }}</div>
      }
    </section>
  `,
  styles: [`
    .reco-page {
      display: grid;
      gap: 1.25rem;
      animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Hero */
    .reco-hero {
      position: relative;
      overflow: hidden;
      min-height: 200px;
      display: flex;
      align-items: center;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.35;
    }

    .orb-1 {
      width: 250px; height: 250px;
      background: radial-gradient(circle, #7a87ff, transparent);
      top: -80px; left: -60px;
      animation: orb-drift 8s ease-in-out infinite;
    }

    .orb-2 {
      width: 200px; height: 200px;
      background: radial-gradient(circle, #ff6db2, transparent);
      bottom: -60px; right: 20%;
      animation: orb-drift 11s ease-in-out infinite reverse;
    }

    .orb-3 {
      width: 180px; height: 180px;
      background: radial-gradient(circle, #49d6ac, transparent);
      top: 20px; right: -40px;
      animation: orb-drift 9s ease-in-out infinite 2s;
    }

    @keyframes orb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(20px, -15px) scale(1.05); }
      66%       { transform: translate(-10px, 10px) scale(0.95); }
    }

    .hero-content {
      position: relative;
      z-index: 2;
      display: grid;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .hero-content h1 {
      font-size: clamp(1.6rem, 3.5vw, 2.4rem);
      font-weight: 900;
      letter-spacing: -0.02em;
    }

    .gradient-text {
      background: linear-gradient(135deg, #7a87ff, #ff6db2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      color: var(--muted);
      font-size: 0.9rem;
      max-width: 55ch;
    }

    .hero-sub strong { color: #c5cff5; }

    .hero-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    /* Filter chips */
    .filter-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .chip {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: #a9b3d6;
      border-radius: 99px;
      padding: 0.35rem 0.85rem;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.18s;
    }

    .chip:hover {
      background: rgba(122,135,255,0.15);
      border-color: rgba(122,135,255,0.4);
      color: #e7edff;
    }

    .chip.active {
      background: rgba(122,135,255,0.2);
      border-color: rgba(122,135,255,0.7);
      color: #7a87ff;
    }

    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .stat {
      font-size: 0.75rem;
      color: #4a5580;
      background: rgba(255,255,255,0.04);
      padding: 0.25rem 0.65rem;
      border-radius: 99px;
      border: 1px solid rgba(255,255,255,0.07);
    }

    .playing-stat {
      color: #7a87ff;
      border-color: rgba(122,135,255,0.3);
      background: rgba(122,135,255,0.08);
    }

    /* Track grid */
    .tracks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .track-card {
      display: grid;
      gap: 0.7rem;
      padding: 0.85rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      animation: cardIn 0.4s ease both;
      cursor: default;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .track-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(122,135,255,0.1);
      border-color: rgba(122,135,255,0.3);
    }

    .track-card.playing {
      border-color: rgba(122,135,255,0.6);
      box-shadow:
        0 0 0 1px rgba(122,135,255,0.3),
        0 16px 40px rgba(0,0,0,0.5),
        0 0 30px rgba(122,135,255,0.2);
    }

    /* Artwork */
    .art-wrap {
      position: relative;
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
    }

    .track-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .art-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1f55, #2a1060);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .art-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .art-wrap:hover .art-overlay { opacity: 1; }
    .art-wrap:hover .track-art { transform: scale(1.05); }

    .playing .art-overlay { opacity: 1; }

    .play-icon {
      width: 40px;
      height: 40px;
      color: #fff;
      filter: drop-shadow(0 0 8px rgba(122,135,255,0.8));
    }

    /* EQ bars animation */
    .eq-bars {
      display: flex;
      gap: 3px;
      align-items: flex-end;
      height: 24px;
    }

    .eq-bars span {
      width: 4px;
      background: linear-gradient(180deg, #7a87ff, #ff6db2);
      border-radius: 2px;
      animation: eq 0.8s ease-in-out infinite;
    }

    .eq-bars span:nth-child(1) { animation-delay: 0s;    height: 100%; }
    .eq-bars span:nth-child(2) { animation-delay: 0.2s;  height: 60%; }
    .eq-bars span:nth-child(3) { animation-delay: 0.1s;  height: 80%; }
    .eq-bars span:nth-child(4) { animation-delay: 0.3s;  height: 40%; }

    @keyframes eq {
      0%, 100% { transform: scaleY(1); }
      50%       { transform: scaleY(0.3); }
    }

    /* Track info */
    .track-info { display: grid; gap: 2px; }

    .track-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #e7edff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-artist {
      font-size: 0.74rem;
      color: #6070a0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-genre {
      font-size: 0.65rem;
      color: #4a5580;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .track-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-content: flex-end;
    }

    .duration {
      font-size: 0.7rem;
      color: #4a5580;
      margin-right: auto;
    }

    .icon-action {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #6070a0;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .icon-action:hover:not(:disabled) {
      background: rgba(255,109,178,0.15);
      border-color: rgba(255,109,178,0.4);
      color: #ff6db2;
    }

    .icon-action:disabled { opacity: 0.3; cursor: not-allowed; }

    /* Skeleton */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .skeleton {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .sk-art {
      width: 56px;
      height: 56px;
      border-radius: 10px;
      background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      flex-shrink: 0;
    }

    .sk-lines { flex: 1; display: grid; gap: 0.4rem; }

    .sk-line {
      height: 10px;
      border-radius: 4px;
      width: 60%;
      background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .sk-line.wide { width: 85%; }

    @keyframes shimmer {
      to { background-position: -200% 0; }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem;
      display: grid;
      gap: 0.75rem;
      justify-items: center;
    }

    .empty-icon { font-size: 2.5rem; }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 6rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10,14,34,0.95);
      border: 1px solid rgba(122,135,255,0.35);
      color: #c5cff5;
      padding: 0.6rem 1.25rem;
      border-radius: 99px;
      font-size: 0.82rem;
      z-index: 10000;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      animation: toastIn 0.2s ease;
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translate(-50%, 12px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }

    @media (max-width: 640px) {
      .tracks-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class RecommendationsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tracks = signal<Track[]>([]);
  readonly activeFilter = signal('all');
  readonly toastMsg = signal('');
  readonly metaInfo = signal<{ genres_used: string[]; artists_used: string[]; count: number } | null>(null);

  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly preferences = signal<Preference>({ genres: [], artists: [] });

  readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly filteredTracks = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.tracks();
    return this.tracks().filter(t =>
      t.genre?.toLowerCase().includes(filter.toLowerCase()) ||
      t.artist?.toLowerCase().includes(filter.toLowerCase())
    );
  });

  readonly currentlyPlayingTitle = computed(() => {
    const ct = this.player.currentTrack();
    return ct ? ct.title : '';
  });

  constructor(
    public readonly api: ApiService,
    public readonly player: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
    this.loadRecommendations();
  }

  private loadPreferences(): void {
    try {
      const raw = localStorage.getItem('shumaq_onboarding_preferences');
      if (raw) {
        const parsed = JSON.parse(raw) as { genres?: string[]; artists?: string[] };
        this.preferences.set({
          genres: parsed.genres ?? [],
          artists: parsed.artists ?? []
        });
      }
    } catch {
      // ignore
    }
  }

  loadRecommendations(): void {
    this.loading.set(true);
    this.error.set('');
    const pref = this.preferences();
    this.api.getRecommendations({
      genres: pref.genres,
      artists: pref.artists,
      limit: 24
    }).subscribe({
      next: (res) => {
        this.tracks.set(res.results);
        this.metaInfo.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load recommendations. Make sure the backend is running.');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadRecommendations();
  }

  setFilter(f: string): void {
    this.activeFilter.set(f);
  }

  playTrack(track: Track): void {
    this.player.playTrack(track, this.filteredTracks());
  }

  playAll(): void {
    if (!this.filteredTracks().length) return;
    this.player.setQueue(this.filteredTracks(), 0, true);
    this.showToast('Playing all recommendations ▶');
  }

  addToQueue(track: Track): void {
    this.player.enqueue(track);
    this.showToast(`Added "${track.title}" to queue`);
  }

  likeSong(track: Track): void {
    if (!this.api.isAuthenticated) return;
    this.api.likeSong(track.title, {
      artist: track.artist,
      preview_url: (track as any).preview_url ?? '',
      artwork_url: track.artwork_url
    }).subscribe({
      next: () => this.showToast(`♥ Added "${track.title}" to favorites`),
      error: () => this.showToast('Could not add to favorites')
    });
  }

  isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.title === track.title;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private showToast(msg: string): void {
    this.toastMsg.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2800);
  }
}
