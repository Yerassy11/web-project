import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
        <button class="btn" type="button" [class.btn-primary]="mode() === 'forgot'" [class.btn-ghost]="mode() !== 'forgot'" (click)="setMode('forgot')">
          Reset Password
        </button>
      </div>

      @if (mode() === 'register') {
        <article>
          <h2>Create Account</h2>
          <p class="muted">Use a valid email. You will use this email for login.</p>
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <label>Email <input type="email" placeholder="you@example.com" formControlName="email" /></label>
            <label>Username <input type="text" placeholder="your_nickname" formControlName="username" /></label>
            <label>Password <input type="password" placeholder="minimum 6 characters" formControlName="password" /></label>
            <label>Repeat password <input type="password" placeholder="repeat password" formControlName="password2" /></label>
            <button class="btn btn-primary" [disabled]="loading() || registerForm.invalid" type="submit">
              Create account
            </button>
          </form>
          <p class="muted switch-line">
            Already have an account?
            <button type="button" class="text-btn" (click)="setMode('login')">Login</button>
          </p>
        </article>
      } @else if (mode() === 'login') {
        <article>
          <h2>Welcome Back</h2>
          <p class="muted">Login works with your email (not username).</p>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <label>Email <input type="email" placeholder="you@example.com" formControlName="email" /></label>
            <label>Password <input type="password" placeholder="your password" formControlName="password" /></label>
            <button class="btn btn-primary" [disabled]="loading() || loginForm.invalid" type="submit">
              Login
            </button>
          </form>
          <p class="muted switch-line">
            Don't have an account?
            <button type="button" class="text-btn" (click)="setMode('register')">Register</button>
          </p>
          <p class="muted switch-line">
            Forgot your password?
            <button type="button" class="text-btn" (click)="setMode('forgot')">Reset it</button>
          </p>
        </article>
      } @else if (mode() === 'forgot') {
        <article>
          <h2>Reset Password</h2>
          <p class="muted">Enter your email and we will send you a password reset link.</p>
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onRequestPasswordReset()">
            <label>Email <input type="email" placeholder="you@example.com" formControlName="email" /></label>
            <button class="btn btn-primary" [disabled]="loading() || forgotPasswordForm.invalid" type="submit">
              Send reset link
            </button>
          </form>
          <p class="muted switch-line">
            Remembered your password?
            <button type="button" class="text-btn" (click)="setMode('login')">Back to login</button>
          </p>
        </article>
      } @else {
        <article>
          <h2>Set New Password</h2>
          <p class="muted">Choose a new password for your account.</p>
          <form [formGroup]="resetPasswordForm" (ngSubmit)="onConfirmPasswordReset()">
            <label>New password <input type="password" placeholder="minimum 8 characters" formControlName="password" /></label>
            <label>Repeat new password <input type="password" placeholder="repeat new password" formControlName="password2" /></label>
            <button class="btn btn-primary" [disabled]="loading() || resetPasswordForm.invalid || !resetUid() || !resetToken()" type="submit">
              Update password
            </button>
          </form>
          @if (!resetUid() || !resetToken()) {
            <p class="status">Reset link is incomplete. Please open the link from your email again.</p>
          }
          <p class="muted switch-line">
            Need another email?
            <button type="button" class="text-btn" (click)="setMode('forgot')">Request a new reset link</button>
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

      form {
        margin-top: 0.6rem;
      }
    `
  ]
})
export class AuthPageComponent {
  readonly loading = signal(false);
  readonly message = signal('');
  readonly mode = signal<'register' | 'login' | 'forgot' | 'reset'>('register');
  readonly resetUid = signal('');
  readonly resetToken = signal('');
  readonly registerForm;
  readonly loginForm;
  readonly forgotPasswordForm;
  readonly resetPasswordForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
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

    this.forgotPasswordForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.nonNullable.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.route.queryParamMap.subscribe((params) => {
      const mode = params.get('mode');
      const uid = params.get('uid') ?? '';
      const token = params.get('token') ?? '';

      this.resetUid.set(uid);
      this.resetToken.set(token);

      if (mode === 'reset' && uid && token) {
        this.mode.set('reset');
        this.message.set('');
        return;
      }

      if (mode === 'forgot') {
        this.mode.set('forgot');
      }
    });
  }

  setMode(mode: 'register' | 'login' | 'forgot' | 'reset'): void {
    this.mode.set(mode);
    this.message.set('');
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.message.set('Please fill all registration fields correctly.');
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.api
      .register(this.registerForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.registerForm.reset();
          this.mode.set('login');
          this.message.set('Registration successful. Now login with your email and password.');
        },
        error: (error: HttpErrorResponse) => this.message.set(this.extractErrorMessage(error))
      });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.message.set('Please enter a valid email and password.');
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
          this.message.set('Login successful. Redirecting to profile...');
          void this.router.navigateByUrl('/profile');
        },
        error: (error: HttpErrorResponse) => this.message.set(this.extractErrorMessage(error))
      });
  }

  onRequestPasswordReset(): void {
    if (this.forgotPasswordForm.invalid) {
      this.message.set('Please enter a valid email address.');
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.api
      .requestPasswordReset(this.forgotPasswordForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.message.set(response.detail);
          this.forgotPasswordForm.reset();
        },
        error: (error: HttpErrorResponse) => this.message.set(this.extractErrorMessage(error))
      });
  }

  onConfirmPasswordReset(): void {
    if (this.resetPasswordForm.invalid || !this.resetUid() || !this.resetToken()) {
      this.message.set('Please open a valid reset link and enter a new password.');
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.api
      .confirmPasswordReset({
        uid: this.resetUid(),
        token: this.resetToken(),
        ...this.resetPasswordForm.getRawValue()
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.resetPasswordForm.reset();
          this.mode.set('login');
          this.message.set(`${response.detail} Now login with your new password.`);
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        },
        error: (error: HttpErrorResponse) => this.message.set(this.extractErrorMessage(error))
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const data = error.error;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      const value = data[firstKey];
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }

    return 'Request failed. Please check your data and backend connection.';
  }
}
