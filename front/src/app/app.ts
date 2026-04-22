import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly title = 'Shumaq';
  searchOpen = false;
  searchQuery = '';
  @ViewChild('headerSearchInput') headerSearchInput?: ElementRef<HTMLInputElement>;

  constructor(public readonly api: ApiService, private readonly router: Router) {}

  logout(): void {
    if (!this.api.isAuthenticated) {
      return;
    }

    this.api.logout().subscribe({
      next: () => this.api.clearTokens(),
      error: () => this.api.clearTokens()
    });
  }

  toggleSearch(): void {
    if (this.searchOpen) {
      this.closeSearch();
      return;
    }
    this.searchOpen = true;
    setTimeout(() => this.headerSearchInput?.nativeElement.focus(), 0);
  }

  closeSearch(): void {
    this.searchOpen = false;
  }

  submitSearch(): void {
    const q = this.searchQuery.trim();
    if (q.length < 2) {
      return;
    }
    this.searchOpen = false;
    void this.router.navigate(['/search'], { queryParams: { q } });
  }
}
