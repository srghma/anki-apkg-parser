import { createDeck, Grade, type Card } from 'femto-fsrs';
import { SvelteMap, SvelteDate } from 'svelte/reactivity';

// --- Constants (matching React code) ---
export const getOneDayInMs = 24 * 60 * 60 * 1000;
export const INTERVAL_MS_AGAIN = 1 * 60 * 1000; // 1 min
export const INTERVAL_MS_HARD = 5 * 60 * 1000; // 5 mins
export const INTERVAL_MS_GOOD_NEW = 10 * 60 * 1000; // 10 mins

export interface NoteStatus {
  word: string;
  stability: number;
  difficulty: number;
  last_review: number | null;
  due: number;
  reps: number;
  lapses: number;
}

// Initialize FSRS
export const deck = createDeck();

/**
 * CORE LOGIC: Determines the next interval (in ms) and the next FSRS state.
 */
export function calculateNextStep(
  item: Pick<NoteStatus, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number
) {
  const daysSinceReview = () => {
    if (!item.last_review) throw new Error('item.last_review')
    return (now - item.last_review) / getOneDayInMs
  };

  const isNew = item.last_review === null;
  const nextCard: Card =
    isNew ?
      deck.newCard(grade) :
      deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview(), grade)

  const intervalMs = (() => {
    if (grade === Grade.AGAIN) return INTERVAL_MS_AGAIN
    if (grade === Grade.HARD) return INTERVAL_MS_HARD
    if (isNew && grade === Grade.GOOD) return INTERVAL_MS_GOOD_NEW
    const multiplier = (() => {
      return grade === Grade.GOOD ? 0.01 : 0.1
    })()
    return nextCard.I * multiplier * getOneDayInMs;
  })()

  return {
    nextCard,
    intervalMs,
  };
}

export function formatInterval(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(0)}s`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`.replace('.0', '');

  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`.replace('.0', '');

  const days = hours / 24;
  if (days < 30) return `${days.toFixed(2)}d`.replace('.00', '').replace(/(\.\d)0$/, '$1');

  const months = days / 30;
  return `${months.toFixed(2)}mo`.replace('.00', '').replace(/(\.\d)0$/, '$1');
}

// --- IndexedDB Management ---
const DB_NAME = 'AnkiExplorer';
const STORE_NAME = 'noteStatus';
const DB_VERSION = 1;

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'word' });
      }
    };
  });
}

// --- Global Anki State ---
export class AnkiState {
  statuses = $state<SvelteMap<string, NoteStatus>>(new SvelteMap<string, NoteStatus>());
  isLoaded = $state(false);

  constructor() {
    this.init();
  }

  async init() {
    if (typeof window === 'undefined') return;
    try {
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as NoteStatus[];
        results.forEach((r) => this.statuses.set(r.word, r));
        this.isLoaded = true;
      };
    } catch (e) {
      console.error('Failed to init IndexedDB', e);
      this.isLoaded = true;
    }
  }

  getStatus(word: string): NoteStatus | undefined {
    return this.statuses.get(word);
  }

  getDueInfo(word: string, now: number) {
    const status = this.getStatus(word);

    if (!status) {
      return { label: 'New', color: 'text-blue-500', isNew: true, isDue: false };
    }

    const isDue = status.due <= now;
    const diff = status.due - now;
    const isToday =
      status.last_review &&
      new SvelteDate(status.last_review).toDateString() === new SvelteDate(now).toDateString();

    return {
      label: formatInterval(Math.abs(diff)),
      isDue,
      isNew: false,
      isToday,
      diff,
      color: isDue
        ? 'text-red-500'
        : diff <= 2 * 60000
          ? 'text-orange-500'
          : diff <= 5 * 60000
            ? 'text-purple-500'
            : 'text-zinc-500'
    };
  }

  async rate(word: string, grade: Grade) {
    const now = Date.now();
    const current = this.getStatus(word) || {
      word,
      stability: 0,
      difficulty: 0,
      last_review: null,
      due: 0,
      reps: 0,
      lapses: 0
    };

    const { nextCard, intervalMs } = calculateNextStep(current, grade, now);

    const updated: NoteStatus = {
      word,
      stability: nextCard.S,
      difficulty: nextCard.D,
      last_review: now,
      due: now + intervalMs,
      reps: current.reps + 1,
      lapses: grade === Grade.AGAIN ? current.lapses + 1 : current.lapses
    };

    // Update Local State (SvelteMap is reactive)
    this.statuses.set(word, updated);

    // Update IndexedDB
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(updated);
  }

  getPreview(word: string) {
    const now = Date.now();
    const current = this.getStatus(word) || {
      word,
      stability: 0,
      difficulty: 0,
      last_review: null,
      due: 0,
      reps: 0,
      lapses: 0
    };

    return {
      [Grade.AGAIN]: formatInterval(calculateNextStep(current, Grade.AGAIN, now).intervalMs),
      [Grade.HARD]: formatInterval(calculateNextStep(current, Grade.HARD, now).intervalMs),
      [Grade.GOOD]: formatInterval(calculateNextStep(current, Grade.GOOD, now).intervalMs),
      [Grade.EASY]: formatInterval(calculateNextStep(current, Grade.EASY, now).intervalMs)
    };
  }
}

let instance: AnkiState | null = null;
export function getAnkiState() {
  if (!instance) instance = new AnkiState();
  return instance;
}

export const ratingConfigs = [
  { rating: Grade.AGAIN, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { rating: Grade.HARD, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { rating: Grade.GOOD, label: 'Good', color: 'bg-green-500 hover:bg-green-600' },
  { rating: Grade.EASY, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600' }
];
