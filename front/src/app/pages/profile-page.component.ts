import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { UserProfile } from '../core/api.models';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, DatePipe],
  template: `
    <section class="card">
      <h2>Профиль</h2>
      @if (!api.isAuthenticated) {
        <p>Для просмотра профиля нужно войти в аккаунт.</p>
        <a class="btn btn-primary" routerLink="/auth">Перейти к авторизации</a>
      } @else if (profile()) {
        <div class="grid">
          <article class="card">
            <h3>{{ profile()!.username }}</h3>
            <p class="muted">{{ profile()!.email }}</p>
            <p>{{ profile()!.bio || 'Био пока не заполнено.' }}</p>
            <p>Создан: {{ profile()!.created_at | date: 'short' }}</p>
          </article>
        </div>
      } @else {
        <p>Загрузка профиля...</p>
      }

      @if (error()) {
        <p class="status">{{ error() }}</p>
      }
    </section>
  `
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
      error: () => this.error.set('Не удалось загрузить профиль. Проверьте авторизацию.')
    });
  }
}
