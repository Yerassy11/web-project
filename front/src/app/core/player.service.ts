import { Injectable, computed, signal } from '@angular/core';
import { Track } from './api.models';
import { AudioPlaybackCoordinatorService } from './audio-playback-coordinator.service';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly backendOrigin = 'http://localhost:8000';
  private readonly audio = new Audio();

  private readonly queueState = signal<Track[]>([]);
  private readonly indexState = signal(0);
  private readonly playingState = signal(false);
  private readonly currentTimeState = signal(0);
  private readonly durationState = signal(0);
  private readonly volumeState = signal(0.75);

  readonly queue = computed(() => this.queueState());
  readonly currentIndex = computed(() => this.indexState());
  readonly isPlaying = computed(() => this.playingState());
  readonly currentTime = computed(() => this.currentTimeState());
  readonly duration = computed(() => this.durationState());
  readonly volume = computed(() => this.volumeState());
  readonly currentTrack = computed(() => {
    const queue = this.queueState();
    const index = this.indexState();
    return queue.length ? queue[index] ?? null : null;
  });

  constructor(private readonly audioCoordinator: AudioPlaybackCoordinatorService) {
    this.audio.preload = 'metadata';
    this.audio.volume = this.volumeState();

    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeState.set(this.audio.currentTime || 0);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.durationState.set(this.audio.duration || 0);
    });

    this.audio.addEventListener('ended', () => {
      this.next();
    });

    this.audio.addEventListener('play', () => {
      this.playingState.set(true);
    });

    this.audio.addEventListener('pause', () => {
      this.playingState.set(false);
    });
  }

  setQueue(tracks: Track[], startIndex = 0, autoplay = true): void {
    if (!tracks.length) {
      return;
    }

    const normalized = tracks.map((track) => ({
      ...track,
      audio_file: this.normalizeAudioUrl(track.audio_file)
    }));

    const safeIndex = Math.max(0, Math.min(startIndex, normalized.length - 1));
    this.queueState.set(normalized);
    this.indexState.set(safeIndex);
    this.loadCurrentTrack(autoplay);
  }

  playTrack(track: Track, queue?: Track[]): void {
    if (queue?.length) {
      const index = queue.findIndex((item) => item.title === track.title);
      this.setQueue(queue, index >= 0 ? index : 0, true);
      return;
    }

    this.setQueue([track], 0, true);
  }

  enqueue(track: Track): void {
    const normalized: Track = { ...track, audio_file: this.normalizeAudioUrl(track.audio_file) };
    this.queueState.update((queue) => [...queue, normalized]);

    if (!this.currentTrack()) {
      this.indexState.set(0);
      this.loadCurrentTrack(false);
    }
  }

  togglePlayPause(): void {
    if (!this.currentTrack()) {
      return;
    }

    if (this.audio.paused) {
      this.audioCoordinator.pauseActiveInlineAudio();
      void this.audio.play();
      return;
    }

    this.audio.pause();
  }

  prev(): void {
    const queue = this.queueState();
    if (!queue.length) {
      return;
    }

    const nextIndex = this.indexState() === 0 ? queue.length - 1 : this.indexState() - 1;
    this.indexState.set(nextIndex);
    this.loadCurrentTrack(true);
  }

  next(): void {
    const queue = this.queueState();
    if (!queue.length) {
      return;
    }

    const nextIndex = this.indexState() === queue.length - 1 ? 0 : this.indexState() + 1;
    this.indexState.set(nextIndex);
    this.loadCurrentTrack(true);
  }

  seek(seconds: number): void {
    if (!this.currentTrack() || !Number.isFinite(seconds)) {
      return;
    }

    const clamped = Math.max(0, Math.min(seconds, this.durationState() || 0));
    this.audio.currentTime = clamped;
    this.currentTimeState.set(clamped);
  }

  setVolume(value: number): void {
    const normalized = Math.max(0, Math.min(value, 1));
    this.audio.volume = normalized;
    this.volumeState.set(normalized);
  }

  private loadCurrentTrack(autoplay: boolean): void {
    const current = this.currentTrack();
    if (!current) {
      return;
    }

    this.audio.src = this.normalizeAudioUrl(current.audio_file);
    this.audio.load();
    this.currentTimeState.set(0);
    this.durationState.set(0);

    if (autoplay) {
      this.audioCoordinator.pauseActiveInlineAudio();
      void this.audio.play().catch(() => {
        this.playingState.set(false);
      });
    }
  }

  pause(): void {
    this.audio.pause();
  }

  private normalizeAudioUrl(url: string): string {
    if (!url) {
      return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.backendOrigin}${url}`;
    }
    return `${this.backendOrigin}/${url}`;
  }
}
