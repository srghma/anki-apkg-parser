<script lang="ts">
  import { getAnkiState, ratingConfigs } from '$lib/anki.svelte';
  import { cn } from '$lib/utils';
  import type { Grade } from 'femto-fsrs';
  import { getAppState } from '$lib/state.svelte';
  import { Grade as GradeEnum } from 'femto-fsrs';

  type Props = {
    word: string;
    word_audio?: string;
    sent_audio?: string;
    isRevealed: boolean;
    onReveal: (reveal: boolean) => void;
    className?: string;
  };

  let { word, word_audio, sent_audio, isRevealed, onReveal, className }: Props = $props();
  const anki = getAnkiState();
  const appState = getAppState();

  const preview = $derived(anki.getPreview(word));

  function handleRate(e: MouseEvent, grade: Grade) {
    e.stopPropagation();
    anki.rate(word, grade);
    onReveal(false);
  }

  async function handleShowAnswer(e: MouseEvent) {
    e.stopPropagation();
    onReveal(true);

    if (word_audio) await appState.audioPlayer.playOnce(word_audio);
    if (sent_audio) await appState.audioPlayer.playOnce(sent_audio);
  }
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
  <div class="grid grid-cols-1 gap-1">
    {#if !isRevealed}
      <button
        onclick={handleShowAnswer}
        class={cn(
          'flex flex-col items-center justify-center rounded border border-transparent px-1 py-1 text-[8px] font-bold transition-all',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
        )}
      >
        SHOW ANSWER
      </button>
      <button
        onclick={(e) => handleRate(e, GradeEnum.EASY)}
        class={cn(
          'flex flex-col items-center justify-center rounded border border-transparent px-1 py-0.5 text-[8px] font-bold transition-all',
          'bg-zinc-100 text-zinc-900 hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100'
        )}
      >
        <span class="uppercase opacity-70">Easy</span>
        <span class="font-medium text-muted-foreground">{preview[GradeEnum.EASY]}</span>
      </button>
    {:else}
      {#each ratingConfigs as config (config.rating)}
        <button
          onclick={(e) => handleRate(e, config.rating)}
          class={cn(
            'flex flex-col items-center justify-center rounded border border-transparent px-1 py-0.5 text-[8px] font-bold transition-all',
            'bg-zinc-100 text-zinc-900 hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100',
            'hover:border-zinc-400 dark:hover:border-zinc-500'
          )}
        >
          <span class="uppercase opacity-70">{config.label}</span>
          <span class="font-medium text-muted-foreground">{preview[config.rating]}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>
