import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card auth-shell">
      <div class="auth-toggle">
        <button class="btn" type="button" [class.btn-primary]="mode() === 'register'" [class.btn-ghost]="mode() !== 'register'" (click)="setMode('register')">
          Registration
        </button>
        <button class="btn" type="button" [class.btn-primary]="mode() === 'login'" [class.btn-ghost]="mode() !== 'login'" (click)="setMode('login')">
          Login
        </button>
      </div>

      @if (mode() === 'register') {
        <article>
          <h2>Create Account</h2>
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <label>Email <input type="email" formControlName="email" /></label>
            <label>Username <input type="text" formControlName="username" /></label>
            <label>Password <input type="password" formControlName="password" /></label>
            <label>Repeat password <input type="password" formControlName="password2" /></label>
            <button class="btn btn-primary" [disabled]="loading() || registerForm.invalid" type="submit">
              Create account
            </button>
          </form>
          <p class="muted switch-line">
            Already have an account?
            <button type="button" class="text-btn" (click)="setMode('login')">Login</button>
          </p>
        </article>
      } @else {
        <article>
          <h2>Welcome Back</h2>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <label>Email <input type="email" formControlName="email" /></label>
            <label>Password <input type="password" formControlName="password" /></label>
            <button class="btn btn-primary" [disabled]="loading() || loginForm.invalid" type="submit">
              Login
            </button>
          </form>
          <p class="muted switch-line">
            Don't have an account?
            <button type="button" class="text-btn" (click)="setMode('register')">Register</button>
          </p>
        </article>
      }

      @if (message()) {
        <p class="status">{{ message() }}</p>
      }
      <p class="muted">After successful login your profile page is available: <a routerLink="/profile">/profile</a></p>
    </section>
  `,
  styles: [
    `
      .auth-shell {
        max-width: 680px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }

      .auth-toggle {
        display: flex;
        gap: 0.6rem;
      }

      .switch-line {
        display: flex;
        gap: 0.4rem;
        align-items: center;
      }

      .text-btn {
        border: none;
        background: transparent;
        color: var(--accent);
        cursor: pointer;
        padding: 0;
      }
    `
  ]
})
export class AuthPageComponent {
  readonly loading = signal(false);
  readonly message = signal('');
  readonly mode = signal<'register' | 'login'>('register');
  readonly registerForm;
  readonly loginForm;

  constructor(private readonly fb: FormBuilder, private readonly api: ApiService, private readonly router: Router) {
    this.registerForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  setMode(mode: 'register' | 'login'): void {
    this.mode.set(mode);
    this.message.set('');
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.api
      .register(this.registerForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.api.saveTokens(response.tokens);
          this.message.set('Регистрация прошла успешно.');
          void this.router.navigateByUrl('/profile');
        },
        error: () => this.message.set('Ошибка регистрации. Проверьте данные.')
      });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.api
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.api.saveTokens(response.tokens);
          this.message.set('Вы успешно авторизованы.');
          void this.router.navigateByUrl('/profile');
        },
        error: () => this.message.set('Неверный email или пароль.')
      });
  }
}
