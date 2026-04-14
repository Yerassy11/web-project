import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly title = 'Shumaq';

  constructor(public readonly api: ApiService) {}

  logout(): void {
    if (!this.api.isAuthenticated) {
      return;
    }

    this.api.logout().subscribe({
      next: () => this.api.clearTokens(),
      error: () => this.api.clearTokens()
    });
  }
}
