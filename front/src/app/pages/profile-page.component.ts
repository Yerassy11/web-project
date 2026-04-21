import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { UserProfile } from '../core/api.models';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <section class="card profile-shell">
      <div class="profile-header">
        <h2>Profile</h2>
        <p class="muted">Your account details from backend API.</p>
      </div>

      @if (!api.isAuthenticated) {
        <article class="card">
          <h3>Not authenticated</h3>
          <p>You need to login first to open your profile.</p>
          <a class="btn btn-primary" routerLink="/auth">Go to Auth</a>
        </article>
      } @else if (profile()) {
        <div class="profile-grid">
          <article class="card identity-card">
            <button class="edit-btn" type="button" (click)="toggleEdit()">
              ✎
            </button>

            @if (avatarUrl()) {
              <img class="avatar-image" [src]="avatarUrl()!" alt="Profile avatar" />
            } @else {
              <div class="avatar">{{ initials() }}</div>
            }

            @if (!isEditing()) {
              <h3>{{ profile()!.username }}</h3>
              <p class="muted">{{ profile()!.email }}</p>
              <p>{{ profile()!.bio || 'Bio is empty for now.' }}</p>
            } @else {
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
                    {{ saving() ? 'Saving...' : 'Save' }}
                  </button>
                  <button class="btn btn-ghost" type="button" (click)="cancelEdit()" [disabled]="saving()">
                    Cancel
                  </button>
                </div>
              </div>
            }
          </article>

          <article class="card">
            <h3>Account Metadata</h3>
            <div class="meta-list">
              <p><strong>User ID:</strong> {{ profile()!.id }}</p>
              <p><strong>Created:</strong> {{ profile()!.created_at | date: 'medium' }}</p>
              <p><strong>Avatar:</strong> {{ profile()!.avatar ? 'Uploaded' : 'Not uploaded' }}</p>
              <p><strong>Playlists:</strong> {{ profile()!.playlist_count }}</p>
            </div>
          </article>

          <article class="card">
            <h3>Frequently Listened Songs</h3>
            @if (profile()!.frequent_songs.length) {
              <ul class="song-list">
                @for (song of profile()!.frequent_songs; track song) {
                  <li>{{ song }}</li>
                }
              </ul>
            } @else {
              <p class="muted">No listening data yet.</p>
            }
          </article>

          <article class="card">
            <h3>Quick Actions</h3>
            <div class="actions">
              <a class="btn btn-ghost" routerLink="/favsongs">Open favorite songs</a>
              <a class="btn btn-ghost" routerLink="/playlists">Open playlists</a>
              <a class="btn btn-primary" routerLink="/auth">Switch account</a>
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
        gap: 1rem;
      }

      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .identity-card {
        text-align: center;
        position: relative;
      }

      .edit-btn {
        position: absolute;
        top: 0.7rem;
        right: 0.7rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        border-radius: 10px;
        width: 34px;
        height: 34px;
        cursor: pointer;
      }

      .avatar {
        width: 72px;
        height: 72px;
        margin: 0 auto 0.7rem;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 1.2rem;
        background: var(--accent);
      }

      .avatar-image {
        width: 72px;
        height: 72px;
        margin: 0 auto 0.7rem;
        border-radius: 50%;
        object-fit: cover;
        display: block;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .meta-list {
        display: grid;
        gap: 0.6rem;
      }

      .meta-list p {
        margin: 0;
      }

      .actions {
        display: grid;
        gap: 0.6rem;
      }

      .song-list {
        margin: 0;
        padding-left: 1.1rem;
        display: grid;
        gap: 0.45rem;
      }

      .edit-form {
        display: grid;
        gap: 0.65rem;
        text-align: left;
      }

      .edit-form label {
        display: grid;
        gap: 0.35rem;
      }

      .edit-form textarea,
      .edit-form input[type='text'] {
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.25);
        color: var(--text);
        padding: 0.55rem 0.65rem;
      }

      .edit-actions {
        display: flex;
        gap: 0.55rem;
        justify-content: center;
      }

      @media (max-width: 900px) {
        .profile-grid {
          grid-template-columns: 1fr;
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
