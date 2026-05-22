<script lang="ts">
  import notes from '../data.json';
  import { setAppState } from '$lib/state.svelte';
  import { getTheme, type Theme } from '$lib/theme';
  import Header from '$lib/components/Header.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import NoteCell from '$lib/components/NoteCell.svelte';
  import WiktionaryModal from '$lib/components/WiktionaryModal.svelte';
  import { WindowVirtualizer } from 'virtua/svelte';
  import { onMount } from 'svelte';
  import { getAnkiState, type NoteStatus } from '$lib/anki.svelte';
  import AnkiRatingButtons from '$lib/components/AnkiRatingButtons.svelte';
  import { cn } from '$lib/utils';
  import AudioPlayerUI from '$lib/components/AudioPlayerUI.svelte';

  interface Note {
    word: string;
    word_audio: string;
    wordrom: string;
    worden: string;
    sent: string;
    sent_audio: string;
    sentrom: string;
    senten: string;
    pos: string;
    ety: string;
    pronunciation: string;
    senses: string;
    derivedTerms: string;
    wiktionary1: string;
    wiktionary2: string;
    wiktionary3: string;
    wiktionary4: string;
    wiktionary5: string;
    wiktionary6: string;
  }

  interface NoteWithMetadata extends Note {
    id: number;
    wiktionaries: string[];
  }

  import { getAppState } from '$lib/state.svelte';

  import { SvelteSet } from 'svelte/reactivity';

  // Initialize global state
  setAppState();
  const anki = getAnkiState();
  const appState = getAppState();

  let currentTheme = $state<Theme>('system');
  let selectedWiktionary = $state<string | null>(null);
  const revealedRows = new SvelteSet<string>();

  onMount(() => {
    currentTheme = getTheme();
    const observer = new MutationObserver(() => {
      currentTheme = getTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  });

  const wiktionaryKeys = [
    'wiktionary1',
    'wiktionary2',
    'wiktionary3',
    'wiktionary4',
    'wiktionary5',
    'wiktionary6'
  ] as const;

  function getWiktionaries(note: Note): string[] {
    return wiktionaryKeys.map((key) => note[key]).filter((w) => w && w.trim().length > 0);
  }

  const baseNotes = (notes as Note[]).map((note, index) => ({
    ...note,
    id: index,
    wiktionaries: getWiktionaries(note)
  })) as NoteWithMetadata[];

  const allPos = [...new Set(baseNotes.map((n) => n.pos?.trim() || 'unknown'))].sort();

  const sortedNotes = $derived.by(() => {
    const now = appState.currentTime;
    let list = baseNotes;

    // Apply filters
    list = list.filter((note) => {
      const notePos = note.pos?.trim() || 'unknown';
      if (appState.disabledPos.includes(notePos)) return false;

      const status = anki.getStatus(note.word);
      if (!status) return appState.showNew;
      if (status.due <= now) return appState.showDue;
      return appState.showNotDue;
    });

    if (appState.sortMode === 'due') {
      return [...list].sort((a, b) => {
        const statusA = anki.getStatus(a.word);
        const statusB = anki.getStatus(b.word);

        const getPriority = (status: NoteStatus | undefined) => {
          if (!status) return 1; // New
          if (status.due <= now) return 0; // Due
          return 2; // Not Due
        };

        const pA = getPriority(statusA);
        const pB = getPriority(statusB);

        if (pA !== pB) return pA - pB;

        const dueA = statusA ? statusA.due : 0;
        const dueB = statusB ? statusB.due : 0;

        if (dueA !== dueB) return dueA - dueB;
        return a.id - b.id;
      });
    }

    return list;
  });

  function handleRevealRow(word: string, reveal: boolean) {
    if (reveal) {
      revealedRows.add(word);
    } else {
      revealedRows.delete(word);
    }
  }

  function hasWordContent(note: Note) {
    return note.word || note.wordrom || note.word_audio;
  }

  function hasSentContent(note: Note) {
    return note.sent || note.sentrom || note.sent_audio;
  }

  function hasEnWordContent(note: Note) {
    return note.worden || note.pos;
  }

  function hasEnSentContent(note: Note) {
    return note.senten && note.senten.trim().length > 0;
  }

  function hasInfoContent(note: NoteWithMetadata) {
    return (
      note.ety ||
      note.pronunciation ||
      note.senses ||
      note.derivedTerms ||
      note.wiktionaries.length > 0
    );
  }

  function getRowClass(word: string) {
    const info = anki.getDueInfo(word, appState.currentTime);

    if (info.isNew) return 'bg-blue-500/5 border-l-4 border-l-blue-500/50';
    if (info.isDue) return 'bg-red-500/5 border-l-4 border-l-red-500';
    if (info.diff !== undefined && info.diff <= 2 * 60000)
      return 'bg-orange-500/5 border-l-4 border-l-orange-500/50';
    if (info.diff !== undefined && info.diff <= 5 * 60000)
      return 'bg-purple-500/5 border-l-4 border-l-purple-500/50';
    if (info.isToday) return 'bg-green-500/5 border-l-4 border-l-green-500/50';

    return 'bg-card text-card-foreground border-l-4 border-l-transparent';
  }
</script>

<div
  class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300"
>
  <Header {currentTheme} {allPos} />

  <main class="relative w-full">
    <ControlPanel />

    <div class="px-4 py-6">
      <div class="mx-auto flex max-w-full flex-col gap-1">
        <!-- Table Header -->
        <div
          class="sticky top-0 z-20 flex w-full border-b bg-background/95 pb-2 text-[10px] font-bold tracking-tight text-muted-foreground uppercase backdrop-blur-md"
        >
          <div class="w-fit min-w-[100px] flex-shrink-0 px-2"># & Anki</div>
          <div class="w-[15%] flex-shrink-0 px-2">Word</div>
          <div class="w-[20%] flex-shrink-0 px-2">Sentence</div>
          <div class="w-[15%] flex-shrink-0 px-2">Translation (W)</div>
          <div class="w-[20%] flex-shrink-0 px-2">Translation (S)</div>
          <div class="flex-grow px-2">Info</div>
        </div>

        <!-- Virtualized List -->
        <WindowVirtualizer data={sortedNotes}>
          {#snippet children(note: NoteWithMetadata)}
            {@const dueInfo = anki.getDueInfo(note.word, appState.currentTime)}
            {@const isRowRevealed = revealedRows.has(note.word)}
            <div class="flex w-full py-1">
              <div
                class={cn(
                  'flex w-full rounded-xl border p-2 shadow-sm transition-all duration-200',
                  getRowClass(note.word)
                )}
              >
                <!-- 1. Number and Anki Buttons -->
                <div
                  class="flex w-fit min-w-[100px] flex-shrink-0 flex-col items-center justify-start gap-2 border-r pr-2"
                >
                  <div class="flex w-full items-center justify-between px-1">
                    <span class="font-mono text-[10px] font-bold tabular-nums opacity-30">
                      {(note.id + 1).toString().padStart(3, '0')}
                    </span>
                    <span
                      class={cn('text-[9px] font-black tracking-tighter uppercase', dueInfo.color)}
                    >
                      {dueInfo.isDue ? '-' : ''}{dueInfo.label}
                    </span>
                  </div>
                  <AnkiRatingButtons
                    word={note.word}
                    word_audio={note.word_audio}
                    sent_audio={note.sent_audio}
                    isRevealed={isRowRevealed}
                    onReveal={(rev) => handleRevealRow(note.word, rev)}
                  />
                </div>

                <!-- 2. Word (Front) -->
                <div class="w-[20%] flex-shrink-0 overflow-hidden p-2">
                  {#if hasWordContent(note)}
                    <NoteCell
                      type="front"
                      title={note.word}
                      audioUrl={note.word_audio}
                      {isRowRevealed}
                    >
                      <div class="flex flex-col gap-1">
                        {#if note.word}
                          <div class="text-2xl leading-tight font-bold text-primary">
                            {note.word}
                          </div>
                        {/if}
                        {#if note.wordrom}
                          <div class="text-sm font-medium text-muted-foreground italic">
                            {note.wordrom}
                          </div>
                        {/if}
                      </div>
                    </NoteCell>
                  {/if}
                </div>

                <!-- 3. Sentence (Front) -->
                <div class="w-[25%] flex-shrink-0 overflow-hidden p-2">
                  {#if hasSentContent(note)}
                    <NoteCell
                      type="front"
                      title={note.sent}
                      audioUrl={note.sent_audio}
                      {isRowRevealed}
                    >
                      <div class="flex flex-col gap-2">
                        {#if note.sent}
                          <div class="text-lg leading-relaxed font-medium">
                            {note.sent}
                          </div>
                        {/if}
                        {#if note.sentrom}
                          <div class="text-sm text-muted-foreground italic">
                            {note.sentrom}
                          </div>
                        {/if}
                      </div>
                    </NoteCell>
                  {/if}
                </div>

                <!-- 4. En Word (Back) -->
                <div class="w-[15%] flex-shrink-0 overflow-hidden p-2">
                  {#if hasEnWordContent(note)}
                    <NoteCell type="back" {isRowRevealed}>
                      <div class="flex flex-col gap-1">
                        {#if note.worden}
                          <div class="text-lg font-bold">
                            {note.worden}
                          </div>
                        {/if}
                        {#if note.pos}
                          <div
                            class="w-fit rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase"
                          >
                            {note.pos}
                          </div>
                        {/if}
                      </div>
                    </NoteCell>
                  {/if}
                </div>

                <!-- 5. En Sentence (Back) -->
                <div class="w-[20%] flex-shrink-0 overflow-hidden p-2">
                  {#if hasEnSentContent(note)}
                    <NoteCell type="back" {isRowRevealed}>
                      <div class="text-base leading-relaxed">
                        {note.senten}
                      </div>
                    </NoteCell>
                  {/if}
                </div>

                <!-- 6. Info -->
                <div class="flex-grow overflow-hidden p-2">
                  {#if hasInfoContent(note)}
                    <NoteCell
                      type="info"
                      wiktionaries={note.wiktionaries}
                      onWiktionaryClick={(content) => (selectedWiktionary = content)}
                      {isRowRevealed}
                    >
                      <div class="flex flex-col gap-3 text-sm">
                        {#if note.ety}
                          <div class="flex flex-col gap-0.5">
                            <span
                              class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                              >Etymology</span
                            >
                            <p>{note.ety}</p>
                          </div>
                        {/if}

                        {#if note.pronunciation}
                          <div class="flex flex-col gap-0.5">
                            <span
                              class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                              >Pronunciation</span
                            >
                            <p>{note.pronunciation}</p>
                          </div>
                        {/if}

                        {#if note.senses}
                          <div class="flex flex-col gap-0.5">
                            <span
                              class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                              >Senses</span
                            >
                            <p>{note.senses}</p>
                          </div>
                        {/if}

                        {#if note.derivedTerms}
                          <div class="flex flex-col gap-0.5">
                            <span
                              class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                              >Derived Terms</span
                            >
                            <p>{note.derivedTerms}</p>
                          </div>
                        {/if}
                      </div>
                    </NoteCell>
                  {/if}
                </div>
              </div>
            </div>
          {/snippet}
        </WindowVirtualizer>
      </div>
    </div>
  </main>

  <WiktionaryModal content={selectedWiktionary} onClose={() => (selectedWiktionary = null)} />
  <AudioPlayerUI />
</div>

<style>
  :global(body) {
    min-height: 100vh;
  }
</style>
