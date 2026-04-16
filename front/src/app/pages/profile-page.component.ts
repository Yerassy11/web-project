import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { UserProfile } from '../core/api.models';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, DatePipe],
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
            <div class="avatar">{{ initials() }}</div>
            <h3>{{ profile()!.username }}</h3>
            <p class="muted">{{ profile()!.email }}</p>
            <p>{{ profile()!.bio || 'Bio is empty for now.' }}</p>
          </article>

          <article class="card">
            <h3>Account Metadata</h3>
            <div class="meta-list">
              <p><strong>User ID:</strong> {{ profile()!.id }}</p>
              <p><strong>Created:</strong> {{ profile()!.created_at | date: 'medium' }}</p>
              <p><strong>Avatar:</strong> {{ profile()!.avatar ? 'Uploaded' : 'Not uploaded' }}</p>
            </div>
          </article>

          <article class="card">
            <h3>Quick Actions</h3>
            <div class="actions">
              <a class="btn btn-ghost" routerLink="/tracks">Open tracks</a>
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .identity-card {
        text-align: center;
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
        background: linear-gradient(130deg, var(--accent), var(--accent-2));
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

  constructor(public readonly api: ApiService) {}

  ngOnInit(): void {
    if (!this.api.isAuthenticated) {
      return;
    }

    this.api.me().subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.error.set('Failed to load profile. Please login again.')
    });
  }

  initials(): string {
    const username = this.profile()?.username ?? '';
    return username.slice(0, 2).toUpperCase();
  }
}
