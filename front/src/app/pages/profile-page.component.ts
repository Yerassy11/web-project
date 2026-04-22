import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { FrequentSong, UserProfile } from '../core/api.models';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, FormsModule],
  template: `
    <section class="card profile-shell">
      <div class="profile-header">
        <h2>Profile</h2>
      </div>

      @if (!api.isAuthenticated) {
        <article class="card auth-warning">
          <img class="unauthorized-image" src="/assets/unauthorized.png" alt="Unauthorized access" />
          <h3>Oops, you are not authorized</h3>
          <p class="muted">Please log in to continue.</p>
          <a class="btn btn-primary auth-btn" routerLink="/auth">Login</a>
        </article>
      } @else if (profile()) {
        <div class="profile-layout">
          <article class="card profile-header-card">
            <button class="edit-icon-btn" type="button" (click)="toggleEdit()" aria-label="Edit profile">
              ✎
            </button>

            <div class="hero-content">
              @if (avatarUrl()) {
                <img class="avatar-image" [src]="avatarUrl()!" alt="Profile avatar" />
              } @else {
                <div class="avatar-placeholder">{{ initials() }}</div>
              }

              <div class="hero-copy">
                <h3>{{ profile()!.username }}</h3>
                <p class="hero-email">{{ profile()!.email }}</p>
                <p class="hero-bio">{{ profile()!.bio || 'No bio yet.' }}</p>
              </div>
            </div>

            <div class="profile-pills">
              <span class="pill">🎵 {{ profile()!.playlist_count }} playlists</span>
              <span class="pill">❤ {{ profile()!.favorites_count }} favorites</span>
              <span class="pill">📅 Joined {{ formatJoinedDate(profile()!.created_at) }}</span>
            </div>

            @if (isEditing()) {
              <div class="edit-form">
                <label>
                  Username
                  <input type="text" [(ngModel)]="draftUsername" name="draftUsername" />
                </label>
                <label>
                  Bio
                  <textarea [(ngModel)]="draftBio" name="draftBio" rows="4"></textarea>
                </label>
                <label>
                  Avatar
                  <input type="file" accept="image/*" (change)="onAvatarSelect($event)" />
                </label>
                <div class="edit-actions">
                  <button class="btn btn-primary" type="button" (click)="saveProfile()" [disabled]="saving()">
                    {{ saving() ? 'Saving...' : 'Save profile' }}
                  </button>
                  <button class="btn btn-ghost" type="button" (click)="cancelEdit()" [disabled]="saving()">
                    Cancel
                  </button>
                </div>
              </div>
            }
          </article>

          <article class="card stats-card">
            <h3>Account Info</h3>
            <div class="stats-grid">
              <div class="stat-tile">
                <span class="stat-label">Joined</span>
                <strong class="stat-value">{{ formatJoinedDate(profile()!.created_at) }}</strong>
              </div>
              <div class="stat-tile">
                <span class="stat-label">Playlists</span>
                <strong class="stat-value">{{ profile()!.playlist_count }}</strong>
              </div>
              <div class="stat-tile">
                <span class="stat-label">Favorites</span>
                <strong class="stat-value">{{ profile()!.favorites_count }}</strong>
              </div>
              <div class="stat-tile">
                <span class="stat-label">Avatar</span>
                <strong class="stat-value">{{ profile()!.avatar ? 'Uploaded' : 'Not uploaded' }}</strong>
              </div>
            </div>
          </article>

          <article class="card songs-card">
            <div class="section-head">
              <h3>Frequently Listened Songs</h3>
              <a class="see-all-link" routerLink="/favsongs">See all</a>
            </div>

            @if (profile()!.frequent_songs.length) {
              <div class="songs-list">
                @for (song of profile()!.frequent_songs; track song.title) {
                  <div class="song-row">
                    <span class="song-index">{{ $index + 1 }}</span>
                    <div class="song-meta">
                      <strong>{{ song.title }}</strong>
                      <span>{{ song.artist }}</span>
                    </div>
                    <div class="song-tail">
                      <span class="song-time">{{ formatDuration(song.duration) }}</span>
                      <span class="song-plays">▶ {{ song.play_count }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="muted">No listening activity yet.</p>
            }
          </article>

          <article class="card actions-card">
            <h3>Quick Actions</h3>
            <div class="actions-list">
              <button class="action-btn action-primary" type="button" (click)="startEdit()">✎ Edit profile</button>
              <a class="action-btn action-secondary" routerLink="/playlists">🎼 View playlists</a>
              <a class="action-btn action-secondary" routerLink="/favsongs">❤ Favorite songs</a>
              <a class="action-btn action-ghost" routerLink="/auth">⇄ Switch account</a>
            </div>
          </article>
        </div>
      } @else {
        <p>Loading profile...</p>
      }

      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .profile-shell {
        display: grid;
        gap: 24px;
        padding: 24px;
        border-radius: 24px;
      }

      .profile-header h2 {
        font-size: 2rem;
        font-weight: 700;
      }

      .profile-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
        grid-template-areas:
          'header stats'
          'songs actions';
        gap: 24px;
        align-items: stretch;
      }

      .profile-header-card,
      .stats-card,
      .songs-card,
      .actions-card {
        background: #121f46;
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 22px;
        padding: 24px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
      }

      .profile-header-card {
        grid-area: header;
        display: grid;
        gap: 16px;
        min-height: 320px;
        position: relative;
      }

      .stats-card {
        grid-area: stats;
        display: grid;
        gap: 16px;
        min-height: 320px;
      }

      .songs-card {
        grid-area: songs;
        display: grid;
        gap: 16px;
        min-height: 340px;
      }

      .actions-card {
        grid-area: actions;
        display: grid;
        gap: 16px;
        min-height: 340px;
      }

      .hero-content {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
      }

      .hero-copy h3 {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.15;
      }

      .hero-email {
        margin-top: 6px;
        color: var(--muted);
        font-size: 1rem;
      }

      .hero-bio {
        margin-top: 8px;
        color: var(--muted);
        font-size: 0.98rem;
      }

      .profile-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: #dbe4ff;
        font-size: 0.9rem;
      }

      .edit-icon-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
        cursor: pointer;
      }

      .avatar-placeholder,
      .avatar-image {
        width: 96px;
        height: 96px;
        border-radius: 50%;
      }

      .avatar-placeholder {
        display: grid;
        place-items: center;
        font-size: 1.5rem;
        font-weight: 700;
        background: #2a3767;
      }

      .avatar-image {
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .stats-card h3,
      .songs-card h3,
      .actions-card h3 {
        font-size: 1.6rem;
        font-weight: 650;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .stat-tile {
        display: grid;
        gap: 6px;
        padding: 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.05);
      }

      .stat-label {
        color: var(--muted);
        font-size: 0.85rem;
      }

      .stat-value {
        font-size: 1.04rem;
        font-weight: 600;
      }

      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .see-all-link {
        padding: 8px 12px;
        border-radius: 10px;
        color: #c9d5ff;
        background: rgba(255, 255, 255, 0.06);
        font-size: 0.9rem;
      }

      .songs-list {
        display: grid;
        gap: 10px;
      }

      .song-row {
        display: grid;
        grid-template-columns: 32px 1fr auto;
        align-items: center;
        gap: 12px;
        border-radius: 14px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      .song-index {
        color: var(--muted);
        font-weight: 600;
      }

      .song-meta {
        display: grid;
        gap: 4px;
      }

      .song-meta strong {
        font-size: 1.02rem;
        line-height: 1.2;
      }

      .song-meta span {
        color: var(--muted);
        font-size: 0.9rem;
      }

      .song-tail {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .song-time {
        color: #d5dcf7;
        font-size: 0.9rem;
      }

      .song-plays {
        color: #adbae6;
        font-size: 0.82rem;
      }

      .actions-list {
        display: grid;
        gap: 12px;
      }

      .action-btn {
        min-height: 46px;
        border-radius: 12px;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.98rem;
      }

      .action-primary {
        background: var(--accent);
        color: #fff;
      }

      .action-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #e8eeff;
      }

      .action-ghost {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.2);
        color: #cbd6fb;
      }

      .auth-warning {
        display: grid;
        gap: 10px;
        justify-items: center;
        text-align: center;
        padding: 28px 24px;
      }

      .unauthorized-image {
        width: min(240px, 70vw);
        height: auto;
      }

      .auth-btn {
        min-width: 170px;
      }

      .edit-form {
        display: grid;
        gap: 12px;
        padding-top: 6px;
      }

      .edit-form label {
        display: grid;
        gap: 6px;
      }

      .edit-form textarea,
      .edit-form input[type='text'] {
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.25);
        color: var(--text);
        padding: 0.62rem 0.72rem;
      }

      .edit-actions {
        display: flex;
        gap: 10px;
      }

      @media (max-width: 1024px) {
        .profile-layout {
          grid-template-columns: 1fr;
          grid-template-areas:
            'header'
            'stats'
            'songs'
            'actions';
        }

        .profile-header-card,
        .stats-card,
        .songs-card,
        .actions-card {
          min-height: 0;
        }
      }

      @media (max-width: 640px) {
        .profile-shell {
          padding: 16px;
          gap: 16px;
        }

        .profile-header-card,
        .stats-card,
        .songs-card,
        .actions-card {
          padding: 16px;
          border-radius: 18px;
        }

        .hero-content {
          grid-template-columns: 1fr;
          justify-items: center;
          text-align: center;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .song-row {
          grid-template-columns: 28px 1fr;
        }

        .song-tail {
          grid-column: 1 / -1;
          justify-content: flex-start;
          padding-left: 40px;
        }

        .edit-actions {
          flex-direction: column;
        }
      }
    `
  ]
})
export class ProfilePageComponent implements OnInit {
  readonly profile = signal<UserProfile | null>(null);
  readonly error = signal('');
  readonly isEditing = signal(false);
  readonly saving = signal(false);

  draftUsername = '';
  draftBio = '';
  selectedAvatarFile: File | null = null;

  constructor(public readonly api: ApiService) {}

  ngOnInit(): void {
    if (!this.api.isAuthenticated) {
      return;
    }

    this.loadProfile();
  }

  initials(): string {
    const username = this.profile()?.username ?? '';
    return username.slice(0, 2).toUpperCase();
  }

  avatarUrl(): string | null {
    const avatar = this.profile()?.avatar;
    if (!avatar) {
      return null;
    }
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    if (avatar.startsWith('/')) {
      return `http://localhost:8000${avatar}`;
    }
    return `http://localhost:8000/${avatar}`;
  }

  formatJoinedDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  formatDuration(durationSeconds: number): string {
    const safeDuration = Math.max(0, Math.floor(durationSeconds || 0));
    const minutes = Math.floor(safeDuration / 60);
    const seconds = safeDuration % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      this.cancelEdit();
      return;
    }
    this.startEdit();
  }

  startEdit(): void {
    const current = this.profile();
    if (!current) {
      return;
    }
    this.draftUsername = current.username;
    this.draftBio = current.bio || '';
    this.selectedAvatarFile = null;
    this.error.set('');
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.selectedAvatarFile = null;
    this.error.set('');
  }

  onAvatarSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedAvatarFile = file;
  }

  saveProfile(): void {
    if (!this.profile()) {
      return;
    }

    const payload = new FormData();
    payload.append('username', this.draftUsername.trim());
    payload.append('bio', this.draftBio.trim());
    if (this.selectedAvatarFile) {
      payload.append('avatar', this.selectedAvatarFile);
    }

    this.saving.set(true);
    this.error.set('');
    this.api.updateMe(payload).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isEditing.set(false);
        this.selectedAvatarFile = null;
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Failed to update profile. Please try again.');
        this.saving.set(false);
      }
    });
  }

  private loadProfile(): void {
    this.api.me().subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.error.set('Failed to load profile. Please login again.')
    });
  }
}
