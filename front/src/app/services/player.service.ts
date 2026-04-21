import { Injectable, signal } from '@angular/core';
import { Track } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly audio = new Audio();

  readonly currentTrack = signal<Track | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);

  private queue: Track[] = [];
  private queueIndex = 0;

  constructor() {
    this.audio.addEventListener('timeupdate', () => this.currentTime.set(this.audio.currentTime || 0));
    this.audio.addEventListener('loadedmetadata', () => this.duration.set(this.audio.duration || 0));
    this.audio.addEventListener('play', () => this.isPlaying.set(true));
    this.audio.addEventListener('pause', () => this.isPlaying.set(false));
    this.audio.addEventListener('ended', () => this.next());
  }

  playTrack(track: Track, queue: Track[]): void {
    this.queue = queue;
    this.queueIndex = Math.max(0, queue.findIndex((item) => item.id === track.id));
    this.loadAndPlay(track);
  }

  togglePlayPause(): void {
    if (!this.currentTrack()) {
      return;
    }

    if (this.audio.paused) {
      void this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  seek(value: number): void {
    this.audio.currentTime = value;
    this.currentTime.set(value);
  }

  next(): void {
    if (!this.queue.length) {
      return;
    }

    this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    this.loadAndPlay(this.queue[this.queueIndex]);
  }

  prev(): void {
    if (!this.queue.length) {
      return;
    }

    this.queueIndex = this.queueIndex === 0 ? this.queue.length - 1 : this.queueIndex - 1;
    this.loadAndPlay(this.queue[this.queueIndex]);
  }

  getPlaybackPosition(): number {
    return this.audio.currentTime || 0;
  }

  private loadAndPlay(track: Track): void {
    this.currentTrack.set(track);
    this.audio.src = track.audio_url;
    this.audio.load();
    this.currentTime.set(0);
    this.duration.set(0);
    void this.audio.play().catch(() => {
      this.isPlaying.set(false);
    });
  }
}
