import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card page">
      <h1>Login</h1>
      <label>
        Username
        <input [(ngModel)]="username" name="username" type="text" />
      </label>
      <label>
        Password
        <input [(ngModel)]="password" name="password" type="password" />
      </label>
      <button class="btn btn-primary" type="button" (click)="login()">Login</button>

      @if (errorMessage) {
        <p class="status">{{ errorMessage }}</p>
      }
    </section>
  `,
  styles: [
    `
      .page {
        max-width: 440px;
        margin: 1rem auto;
        display: grid;
        gap: 0.7rem;
      }
    `,
  ],
})
export class LoginPageComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  login(): void {
    this.errorMessage = '';

    this.api.login(this.username, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        void this.router.navigateByUrl('/home');
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.detail || 'Login failed. Check credentials.';
      },
    });
  }
}
