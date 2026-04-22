import { Component, signal, computed, HostListener } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../core/player.service';

@Component({
  selector: 'app-music-player-widget',
  standalone: true,
  imports: [NgClass, NgStyle, RouterLink],
  template: `
    <div class="player-widget" [class.expanded]="expanded()" [class.has-track]="!!player.currentTrack()">

      <!-- Collapsed mini-bar (always visible when track loaded) -->
      <div class="mini-bar" (click)="toggleExpand()">
        @if (player.currentTrack(); as track) {
          <div class="mini-artwork">
            @if (track.artwork_url) {
              <img [src]="track.artwork_url" [alt]="track.title" />
            } @else {
              <div class="artwork-placeholder">♪</div>
            }
            <div class="spin-ring" [class.spinning]="player.isPlaying()"></div>
          </div>
          <div class="mini-info">
            <span class="mini-title">{{ track.title }}</span>
            <span class="mini-artist">{{ track.artist }}</span>
          </div>
          <div class="mini-controls" (click)="$event.stopPropagation()">
            <button class="ctrl-btn" type="button" (click)="player.prev()" title="Previous">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button class="ctrl-btn play-btn" type="button" (click)="player.togglePlayPause()" title="Play/Pause">
              @if (player.isPlaying()) {
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button class="ctrl-btn" type="button" (click)="player.next()" title="Next">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
            </button>
          </div>
          <button class="expand-btn" type="button" [title]="expanded() ? 'Collapse' : 'Expand'">
            <svg viewBox="0 0 24 24" fill="currentColor" [class.rotated]="expanded()">
              <path d="m7 14 5-5 5 5z"/>
            </svg>
          </button>
        } @else {
          <div class="no-track">
            <span class="no-track-icon">🎵</span>
            <span class="no-track-text">No track playing</span>
          </div>
        }
      </div>

      <!-- Progress bar (always shown when track loaded) -->
      @if (player.currentTrack()) {
        <div class="progress-strip" (click)="$event.stopPropagation()">
          <div class="progress-track" (click)="onProgressClick($event)">
            <div class="progress-fill" [style.width.%]="progressPercent()"></div>
            <div class="progress-thumb" [style.left.%]="progressPercent()"></div>
          </div>
          <div class="time-labels">
            <span>{{ format(player.currentTime()) }}</span>
            <span>{{ format(player.duration()) }}</span>
          </div>
        </div>
      }

      <!-- Expanded panel -->
      @if (expanded() && player.currentTrack(); as track) {
        <div class="expanded-panel" (click)="$event.stopPropagation()">
          <div class="expanded-artwork-wrap">
            @if (track.artwork_url) {
              <img class="expanded-artwork" [src]="track.artwork_url" [alt]="track.title" />
            } @else {
              <div class="expanded-artwork artwork-placeholder-lg">♪</div>
            }
            <div class="artwork-glow" [style.opacity]="player.isPlaying() ? 1 : 0"></div>
          </div>

          <div class="expanded-meta">
            <h3 class="exp-title">{{ track.title }}</h3>
            <p class="exp-artist">{{ track.artist }}</p>
            @if (track.genre) {
              <span class="genre-badge">{{ track.genre }}</span>
            }
          </div>

          <div class="volume-row">
            <svg class="vol-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="1"
              step="0.01"
              [value]="player.volume()"
              (input)="onVolumeChange($event)"
            />
            <span class="vol-pct">{{ volPct() }}%</span>
          </div>

          <!-- Queue preview -->
          @if (player.queue().length > 1) {
            <div class="queue-section">
              <p class="queue-label">Up next</p>
              <div class="queue-list">
                @for (qtrack of upNextTracks(); track qtrack.title) {
                  <div class="queue-item" [class.active]="qtrack.title === track.title">
                    @if (qtrack.artwork_url) {
                      <img [src]="qtrack.artwork_url" [alt]="qtrack.title" />
                    } @else {
                      <div class="q-placeholder">♪</div>
                    }
                    <div class="q-info">
                      <span class="q-title">{{ qtrack.title }}</span>
                      <span class="q-artist">{{ qtrack.artist }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .player-widget {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      width: 340px;
      background: rgba(10, 14, 34, 0.92);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(122, 135, 255, 0.25);
      border-radius: 20px;
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255,255,255,0.04),
        inset 0 1px 0 rgba(255,255,255,0.08);
      z-index: 9999;
      transition: width 0.3s ease, box-shadow 0.3s ease;
      overflow: hidden;
    }

    .player-widget.expanded {
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.75),
        0 0 40px rgba(122, 135, 255, 0.15),
        0 0 0 1px rgba(255,255,255,0.06),
        inset 0 1px 0 rgba(255,255,255,0.1);
    }

    /* Mini bar */
    .mini-bar {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem 0.75rem;
      cursor: pointer;
      user-select: none;
    }

    .mini-artwork {
      position: relative;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
    }

    .mini-artwork img, .artwork-placeholder {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      object-fit: cover;
      display: block;
    }

    .artwork-placeholder {
      background: linear-gradient(135deg, #2a3080, #1a1f55);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .spin-ring {
      position: absolute;
      inset: -3px;
      border-radius: 13px;
      border: 2px solid transparent;
      background: linear-gradient(135deg, #7a87ff, #ff6db2) border-box;
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: destination-out;
      mask-composite: exclude;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .spin-ring.spinning {
      opacity: 1;
      animation: spin-border 2s linear infinite;
    }

    @keyframes spin-border {
      to { transform: rotate(360deg); }
    }

    .mini-info {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .mini-title {
      font-size: 0.85rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #e7edff;
    }

    .mini-artist {
      font-size: 0.72rem;
      color: #7a87ff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mini-controls {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .ctrl-btn {
      background: none;
      border: none;
      color: #a9b3d6;
      cursor: pointer;
      padding: 0.3rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      transition: color 0.15s, background 0.15s;
    }

    .ctrl-btn:hover {
      color: #e7edff;
      background: rgba(122,135,255,0.15);
    }

    .ctrl-btn svg {
      width: 18px;
      height: 18px;
    }

    .play-btn {
      background: rgba(122, 135, 255, 0.2);
      color: #7a87ff;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      justify-content: center;
    }

    .play-btn:hover {
      background: rgba(122, 135, 255, 0.4);
      color: #fff;
    }

    .play-btn svg {
      width: 20px;
      height: 20px;
    }

    .expand-btn {
      background: none;
      border: none;
      color: #6070a0;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }

    .expand-btn:hover { color: #a9b3d6; }

    .expand-btn svg {
      width: 20px;
      height: 20px;
      transition: transform 0.25s;
    }

    .expand-btn svg.rotated {
      transform: rotate(180deg);
    }

    .no-track {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.2rem 0;
      color: #4a5580;
      font-size: 0.82rem;
    }

    .no-track-icon { font-size: 1.1rem; }

    /* Progress strip */
    .progress-strip {
      padding: 0 0.75rem 0.5rem;
    }

    .progress-track {
      position: relative;
      height: 4px;
      background: rgba(255,255,255,0.08);
      border-radius: 99px;
      cursor: pointer;
      margin-bottom: 0.3rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #7a87ff, #ff6db2);
      border-radius: 99px;
      transition: width 0.1s linear;
    }

    .progress-thumb {
      position: absolute;
      top: 50%;
      width: 10px;
      height: 10px;
      background: #fff;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.15s;
      box-shadow: 0 0 6px rgba(122,135,255,0.8);
    }

    .progress-strip:hover .progress-thumb {
      transform: translate(-50%, -50%) scale(1);
    }

    .time-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: #4a5580;
    }

    /* Expanded panel */
    .expanded-panel {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 1rem 0.75rem 0.75rem;
      animation: slideDown 0.25s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .expanded-artwork-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .expanded-artwork {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 16px;
      display: block;
    }

    .artwork-placeholder-lg {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1f55, #2a1060);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      border-radius: 16px;
    }

    .artwork-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, rgba(122,135,255,0.25) 0%, transparent 70%);
      border-radius: 16px;
      transition: opacity 0.5s;
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    .expanded-meta {
      text-align: center;
      margin-bottom: 0.85rem;
    }

    .exp-title {
      font-size: 1rem;
      font-weight: 800;
      color: #e7edff;
      margin-bottom: 0.2rem;
      letter-spacing: -0.01em;
    }

    .exp-artist {
      font-size: 0.82rem;
      color: #7a87ff;
      margin-bottom: 0.4rem;
    }

    .genre-badge {
      display: inline-block;
      background: rgba(122,135,255,0.15);
      border: 1px solid rgba(122,135,255,0.3);
      color: #a9b3d6;
      font-size: 0.68rem;
      padding: 0.15rem 0.55rem;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Volume */
    .volume-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .vol-icon {
      width: 16px;
      height: 16px;
      color: #6070a0;
      flex-shrink: 0;
    }

    .volume-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: rgba(255,255,255,0.12);
      border-radius: 99px;
      outline: none;
    }

    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #7a87ff;
      cursor: pointer;
      box-shadow: 0 0 6px rgba(122,135,255,0.6);
    }

    .vol-pct {
      font-size: 0.68rem;
      color: #4a5580;
      min-width: 2.5ch;
      text-align: right;
    }

    /* Queue */
    .queue-section {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 0.65rem;
    }

    .queue-label {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4a5580;
      margin-bottom: 0.4rem;
    }

    .queue-list {
      display: grid;
      gap: 0.3rem;
      max-height: 120px;
      overflow-y: auto;
    }

    .queue-list::-webkit-scrollbar { width: 4px; }
    .queue-list::-webkit-scrollbar-thumb {
      background: rgba(122,135,255,0.3);
      border-radius: 99px;
    }

    .queue-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.3rem 0.4rem;
      border-radius: 8px;
      transition: background 0.15s;
    }

    .queue-item.active {
      background: rgba(122,135,255,0.12);
    }

    .queue-item img, .q-placeholder {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .q-placeholder {
      background: rgba(122,135,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .q-info {
      min-width: 0;
    }

    .q-title {
      display: block;
      font-size: 0.73rem;
      font-weight: 600;
      color: #c5cff5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .q-artist {
      display: block;
      font-size: 0.65rem;
      color: #4a5580;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class MusicPlayerWidgetComponent {
  expanded = signal(false);

  constructor(public readonly player: PlayerService) {}

  toggleExpand(): void {
    if (this.player.currentTrack()) {
      this.expanded.update(v => !v);
    }
  }

  progressPercent = computed(() => {
    const d = this.player.duration();
    if (!d) return 0;
    return Math.min(100, (this.player.currentTime() / d) * 100);
  });

  volPct = computed(() => Math.round(this.player.volume() * 100));

  upNextTracks = computed(() => {
    const queue = this.player.queue();
    const idx = this.player.currentIndex();
    if (queue.length <= 1) return [];
    // show next 3 from current
    const result = [];
    for (let i = 1; i <= 3; i++) {
      const nextIdx = (idx + i) % queue.length;
      result.push(queue[nextIdx]);
    }
    return result;
  });

  onProgressClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    this.player.seek(ratio * this.player.duration());
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.player.setVolume(Number(input.value));
  }

  format(seconds: number): string {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const min = Math.floor(safe / 60);
    const sec = (safe % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }
}
