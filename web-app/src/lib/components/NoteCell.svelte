<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { cn } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import { Volume2, BookOpen, Repeat, Square } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';

  type Props = {
    type: 'front' | 'back' | 'info';
    title?: string;
    children?: Snippet;
    className?: string;
    audioUrl?: string;
    wiktionaries?: string[];
    onWiktionaryClick?: (content: string) => void;
    isRowRevealed?: boolean;
  };

  let {
    type,
    title,
    children,
    className,
    audioUrl,
    wiktionaries = [],
    onWiktionaryClick,
    isRowRevealed = false
  }: Props = $props();
  const appState = getAppState();

  let isLocallyShown = $state(false);

  // Reset local state when global state for this specific type changes
  $effect(() => {
    let globalHide: boolean;
    if (type === 'front') {
      globalHide = appState.hideFront;
      void appState.frontVersion;
    } else if (type === 'back') {
      globalHide = appState.hideBack;
      void appState.backVersion;
    } else {
      globalHide = appState.hideInfo;
      void appState.infoVersion;
    }

    isLocallyShown = !globalHide;
  });

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const isHidden = $derived(!isLocallyShown && !isRowRevealed);
  const isPlaying = $derived(
    appState.audioPlayer.currentTrack?.url === audioUrl && appState.audioPlayer.isPlaying
  );
  const isRepeating = $derived(!!audioUrl && appState.audioPlayer.isInQueue(audioUrl));

  const hasContent = $derived(!!children);
  const hasWiktionary = $derived(wiktionaries.some((w) => w && w.trim().length > 0));
  const shouldRender = $derived(hasContent || !!audioUrl || hasWiktionary);

  function handleClick() {
    if (isHidden) {
      isLocallyShown = true;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isLocallyShown = false;
        timeoutId = null;
      }, 10000);
    }
  }

  // Cleanup timeout on unmount
  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  function playAudio(e: MouseEvent) {
    e.stopPropagation();
    if (!audioUrl) return;
    appState.audioPlayer.playOnce(audioUrl);
  }

  function toggleRepeat(e: MouseEvent) {
    e.stopPropagation();
    if (!audioUrl) return;

    if (appState.audioPlayer.isInQueue(audioUrl)) {
      appState.audioPlayer.removeFromQueue(audioUrl);
    } else {
      appState.audioPlayer.addToQueue(audioUrl, title || 'Track');
    }
  }

  function handleWiktionaryClick(e: MouseEvent, content: string) {
    e.stopPropagation();
    onWiktionaryClick?.(content);
  }
</script>

{#if shouldRender}
  <div
    role="button"
    tabindex="0"
    class={cn(
      'relative flex min-h-[3rem] w-full flex-col gap-2 rounded-lg border border-transparent p-3 transition-all duration-300',
      isHidden
        ? 'cursor-pointer border-zinc-800 bg-zinc-950 text-transparent shadow-inner select-none hover:bg-zinc-900'
        : 'bg-card text-card-foreground shadow-sm hover:border-muted-foreground/20',
      className
    )}
    onclick={handleClick}
    onkeydown={(e) => e.key === 'Enter' && handleClick()}
  >
    {#if children}
      <div
        class={cn(
          'flex-grow transition-opacity duration-300',
          isHidden ? 'opacity-0' : 'opacity-100'
        )}
      >
        {@render children()}
      </div>
    {/if}

    <div class="mt-auto flex flex-wrap justify-end gap-2">
      {#if audioUrl}
        <div
          class="flex items-center gap-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900/50"
        >
          <Button
            variant="ghost"
            size="sm"
            class={cn(
              'h-7 gap-1.5 rounded-none px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-300',
              isPlaying
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-zinc-400 hover:text-zinc-100',
              isHidden && !isPlaying ? 'text-zinc-500' : ''
            )}
            onclick={playAudio}
          >
            {#if isPlaying}
              <Square size={12} fill="currentColor" />
              Stop
            {:else}
              <Volume2 size={12} />
              Play
            {/if}
          </Button>
          <div class="h-4 w-[1px] bg-zinc-700"></div>
          <Button
            variant="ghost"
            size="icon"
            class={cn(
              'h-7 w-7 rounded-none transition-all duration-300',
              isRepeating
                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                : 'text-zinc-500 hover:text-zinc-100'
            )}
            onclick={toggleRepeat}
            title={isRepeating ? 'Disable Repeat' : 'Repeat Infinitely'}
          >
            <Repeat size={12} class={cn(isRepeating ? 'animate-pulse' : '')} />
          </Button>
        </div>
      {/if}

      {#each wiktionaries as content, i (i)}
        {#if content && content.trim().length > 0}
          <Button
            variant="outline"
            size="sm"
            class={cn(
              'h-7 gap-1.5 px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-300',
              isHidden
                ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
                : ''
            )}
            onclick={(e) => handleWiktionaryClick(e, content)}
          >
            <BookOpen size={12} />
            Wikt {i + 1}
          </Button>
        {/if}
      {/each}
    </div>
  </div>
{/if}
