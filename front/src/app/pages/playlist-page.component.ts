import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { Playlist } from '../models/api.models';
import { ApiService } from '../services/api.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-playlist-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card page">
      <h1>Playlist #{{ playlistId }}</h1>

      @if (apiError) {
        <p class="status">{{ apiError }}</p>
      }

      @if (playlist) {
        <div class="edit-box">
          <h3>Edit playlist</h3>
          <input [(ngModel)]="editTitle" name="editTitle" type="text" placeholder="Title" />
          <input [(ngModel)]="editDescription" name="editDescription" type="text" placeholder="Description" />
          <label>
            <input [(ngModel)]="editPublic" name="editPublic" type="checkbox" />
            Public
          </label>
          <div class="actions">
            <button class="btn btn-primary" type="button" (click)="saveEdit()">Save</button>
            <button class="btn btn-ghost" type="button" (click)="deletePlaylist()">Delete</button>
          </div>
        </div>

        <div class="tracks">
          <h3>Tracks</h3>
          @if (!playlist.tracks.length) {
            <p class="muted">Playlist is empty.</p>
          } @else {
            @for (track of playlist.tracks; track track.id) {
              <article class="track-item">
                <div>
                  <strong>{{ track.title }}</strong>
                  <p class="muted">{{ track.artist_name }}</p>
                </div>
                <button class="btn btn-ghost" type="button" (click)="player.playTrack(track, playlist.tracks)">Play</button>
              </article>
            }
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 0.8rem;
      }

      .edit-box {
        display: grid;
        gap: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 0.75rem;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }

      .track-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.6rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        padding: 0.6rem;
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class PlaylistPageComponent implements OnInit {
  playlistId = 0;
  playlist: Playlist | null = null;

  editTitle = '';
  editDescription = '';
  editPublic = true;

  apiError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    public readonly player: PlayerService,
  ) {}

  ngOnInit(): void {
    this.playlistId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPlaylist();
  }

  loadPlaylist(): void {
    this.apiError = '';

    this.api.getPlaylist(this.playlistId).subscribe({
      next: (playlist) => {
        this.playlist = playlist;
        this.editTitle = playlist.title;
        this.editDescription = playlist.description;
        this.editPublic = playlist.is_public;
      },
      error: (error: HttpErrorResponse) => {
        this.apiError = error.error?.detail || 'Failed to load playlist.';
      },
    });
  }

  saveEdit(): void {
    this.api
      .updatePlaylist(this.playlistId, {
        title: this.editTitle,
        description: this.editDescription,
        is_public: this.editPublic,
      })
      .subscribe({
        next: (playlist) => {
          this.playlist = playlist;
        },
        error: (error: HttpErrorResponse) => {
          this.apiError = error.error?.detail || 'Failed to update playlist.';
        },
      });
  }

  deletePlaylist(): void {
    this.api.deletePlaylist(this.playlistId).subscribe({
      next: () => {
        this.playlist = null;
      },
      error: (error: HttpErrorResponse) => {
        this.apiError = error.error?.detail || 'Failed to delete playlist.';
      },
    });
  }
}
