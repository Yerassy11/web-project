import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar card">
      <h2>UniSpotify</h2>
      <a routerLink="/home" routerLinkActive="active">Home</a>
      <a routerLink="/login" routerLinkActive="active">Login</a>
      <button class="btn btn-ghost" type="button" (click)="logout()">Logout</button>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }

      a {
        padding: 0.5rem;
        border-radius: 10px;
      }

      a.active {
        background: rgba(255, 255, 255, 0.12);
      }
    `,
  ],
})
export class SidebarComponent {
  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  logout(): void {
    const refresh = localStorage.getItem('refresh_token');

    if (!refresh) {
      localStorage.removeItem('access_token');
      void this.router.navigateByUrl('/login');
      return;
    }

    this.api.logout(refresh).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    void this.router.navigateByUrl('/login');
  }
}
