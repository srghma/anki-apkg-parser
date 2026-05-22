import { getContext, setContext } from 'svelte';
import { localStorageWritable } from '@babichjacob/svelte-localstorage';
import { type Writable } from 'svelte/store';
import { AudioPlayer } from './audio.svelte';

export type SortMode = 'index' | 'due';

export class AppState {
  private _hideFront: Writable<boolean>;
  private _hideBack: Writable<boolean>;
  private _hideInfo: Writable<boolean>;
  private _sortMode: Writable<SortMode>;

  private _showDue: Writable<boolean>;
  private _showNew: Writable<boolean>;
  private _showNotDue: Writable<boolean>;
  private _disabledPos: Writable<string[]>;

  hideFront = $state(true);
  hideBack = $state(true);
  hideInfo = $state(true);
  sortMode = $state<SortMode>('index');
  showDue = $state(true);
  showNew = $state(true);
  showNotDue = $state(true);
  disabledPos = $state<string[]>([]);

  frontVersion = $state(0);
  backVersion = $state(0);
  infoVersion = $state(0);

  audioPlayer = new AudioPlayer();
  currentTime = $state(Date.now());

  constructor() {
    setInterval(() => {
      this.currentTime = Date.now();
    }, 10000);

    this._hideFront = localStorageWritable('anki-explorer-hide-front', true);
    this._hideBack = localStorageWritable('anki-explorer-hide-back', true);
    this._hideInfo = localStorageWritable('anki-explorer-hide-info', true);
    this._sortMode = localStorageWritable('anki-explorer-sort-mode', 'index');
    this._showDue = localStorageWritable('anki-explorer-show-due', true);
    this._showNew = localStorageWritable('anki-explorer-show-new', true);
    this._showNotDue = localStorageWritable('anki-explorer-show-not-due', true);
    this._disabledPos = localStorageWritable('anki-explorer-disabled-pos', []);

    this._hideFront.subscribe((v) => {
      this.hideFront = v;
      this.frontVersion++;
    });
    this._hideBack.subscribe((v) => {
      this.hideBack = v;
      this.backVersion++;
    });
    this._hideInfo.subscribe((v) => {
      this.hideInfo = v;
      this.infoVersion++;
    });
    this._sortMode.subscribe((v) => {
      this.sortMode = v;
    });
    this._showDue.subscribe((v) => {
      this.showDue = v;
    });
    this._showNew.subscribe((v) => {
      this.showNew = v;
    });
    this._showNotDue.subscribe((v) => {
      this.showNotDue = v;
    });
    this._disabledPos.subscribe((v) => {
      this.disabledPos = v;
    });
  }

  toggleFront() {
    this._hideFront.update((v) => !v);
  }
  toggleBack() {
    this._hideBack.update((v) => !v);
  }
  toggleInfo() {
    this._hideInfo.update((v) => !v);
  }
  setSortMode(mode: SortMode) {
    this._sortMode.set(mode);
  }
  toggleShowDue() {
    this._showDue.update((v) => !v);
  }
  toggleShowNew() {
    this._showNew.update((v) => !v);
  }
  toggleShowNotDue() {
    this._showNotDue.update((v) => !v);
  }

  togglePos(pos: string) {
    this._disabledPos.update((prev) => {
      if (prev.includes(pos)) {
        return prev.filter((p) => p !== pos);
      } else {
        return [...prev, pos];
      }
    });
  }

  showAllFront() {
    this._hideFront.set(false);
  }
  hideAllFront() {
    this._hideFront.set(true);
  }
  showAllBack() {
    this._hideBack.set(false);
  }
  hideAllBack() {
    this._hideBack.set(true);
  }
  showAllInfo() {
    this._hideInfo.set(false);
  }
  hideAllInfo() {
    this._hideInfo.set(true);
  }
}

const APP_STATE_KEY = Symbol('APP_STATE');

export function setAppState() {
  return setContext(APP_STATE_KEY, new AppState());
}

export function getAppState() {
  return getContext<AppState>(APP_STATE_KEY);
}
