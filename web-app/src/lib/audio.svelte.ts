export interface AudioTrack {
  url: string;
  title?: string;
}

export class AudioPlayer {
  queue = $state<AudioTrack[]>([]);
  currentIndex = $state(-1);
  isPlaying = $state(false);
  isRepeatQueue = $state(true); // Default to repeating the queue

  private audio: HTMLAudioElement | null = null;
  private oneOffAudio: HTMLAudioElement | null = null;
  private oneOffResolve: (() => void) | null = null;

  currentTrack = $derived(
    this.currentIndex >= 0 && this.currentIndex < this.queue.length
      ? this.queue[this.currentIndex]
      : null
  );

  addToQueue(url: string, title?: string) {
    if (this.queue.some((t) => t.url === url)) return;
    this.queue = [...this.queue, { url, title }];
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
    }
  }

  removeFromQueue(url: string) {
    const index = this.queue.findIndex((t) => t.url === url);
    if (index === -1) return;

    const newQueue = this.queue.filter((t) => t.url !== url);

    if (this.currentIndex === index) {
      this.stop();
      if (newQueue.length > 0) {
        this.currentIndex = index % newQueue.length;
      } else {
        this.currentIndex = -1;
      }
    } else if (this.currentIndex > index) {
      this.currentIndex--;
    }

    this.queue = newQueue;
  }

  isInQueue(url: string) {
    return this.queue.some((t) => t.url === url);
  }

  play() {
    if (this.currentIndex === -1 && this.queue.length > 0) {
      this.currentIndex = 0;
    }
    if (this.currentIndex === -1) return;

    this.stopOneOff();

    if (this.audio && this.audio.src.includes(this.queue[this.currentIndex].url)) {
      this.audio.play();
      this.isPlaying = true;
      return;
    }

    this.startCurrentTrack();
  }

  private startCurrentTrack() {
    this.stop();
    const track = this.currentTrack;
    if (!track) return;

    this.audio = new Audio(track.url);
    this.audio.onended = () => {
      this.handleEnded();
    };
    this.audio.play().catch((e) => {
      console.error('Audio player error', e);
      this.isPlaying = false;
    });
    this.isPlaying = true;
  }

  private handleEnded() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    if (this.currentIndex === this.queue.length - 1) {
      if (this.isRepeatQueue) {
        this.currentIndex = 0;
        this.startCurrentTrack();
      } else {
        this.isPlaying = false;
      }
    } else {
      this.currentIndex++;
      this.startCurrentTrack();
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.isPlaying = false;
  }

  next() {
    if (this.queue.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.startCurrentTrack();
  }

  prev() {
    if (this.queue.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.startCurrentTrack();
  }

  clearQueue() {
    this.stop();
    this.queue = [];
    this.currentIndex = -1;
  }

  // --- One-off Playback ---

  playOnce(url: string): Promise<void> {
    this.stopOneOff();
    // Also pause the queue if it's playing
    this.pause();

    return new Promise((resolve) => {
      this.oneOffResolve = resolve;
      this.oneOffAudio = new Audio(url);
      this.oneOffAudio.onended = () => {
        this.oneOffAudio = null;
        this.oneOffResolve = null;
        resolve();
      };
      this.oneOffAudio.onerror = () => {
        this.oneOffAudio = null;
        this.oneOffResolve = null;
        resolve();
      };
      this.oneOffAudio.play().catch((e) => {
        console.error('One-off audio error', e);
        this.oneOffAudio = null;
        this.oneOffResolve = null;
        resolve();
      });
    });
  }

  private stopOneOff() {
    if (this.oneOffAudio) {
      this.oneOffAudio.pause();
      this.oneOffAudio.currentTime = 0;
      this.oneOffAudio = null;
    }
    if (this.oneOffResolve) {
      this.oneOffResolve();
      this.oneOffResolve = null;
    }
  }

  isCurrentTrack(url: string) {
    return this.currentTrack?.url === url;
  }
}
