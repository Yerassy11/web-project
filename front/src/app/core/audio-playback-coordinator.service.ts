import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioPlaybackCoordinatorService {
  private activeInlineAudio: HTMLAudioElement | null = null;

  notifyInlineAudioPlay(audio: HTMLAudioElement): void {
    if (this.activeInlineAudio && this.activeInlineAudio !== audio) {
      this.activeInlineAudio.pause();
    }
    this.activeInlineAudio = audio;
  }

  releaseInlineAudio(audio: HTMLAudioElement): void {
    if (this.activeInlineAudio === audio) {
      this.activeInlineAudio = null;
    }
  }

  pauseActiveInlineAudio(): void {
    if (this.activeInlineAudio) {
      this.activeInlineAudio.pause();
      this.activeInlineAudio = null;
    }
  }
}
