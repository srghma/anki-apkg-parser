<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    X,
    ListMusic,
    Minimize2,
    Maximize2,
    GripVertical,
    Repeat,
    Trash2
  } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  const appState = getAppState();
  const player = appState.audioPlayer;

  let isMinimized = $state(false);
  let position = $state({ x: 20, y: 100 });
  let isDragging = $state(false);
  let dragOffset = { x: 0, y: 0 };

  function handleMouseDown(e: MouseEvent) {
    // Only drag from the header area (already handled by role="presentation" on the header div)
    isDragging = true;
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    // Boundary check
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    const width = isMinimized ? 256 : 320; // w-64 is 256px, w-80 is 320px
    const height = isMinimized ? 56 : 400; // h-14 is 56px

    newX = Math.max(0, Math.min(newX, window.innerWidth - width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - height));

    position = { x: newX, y: newY };
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  // Keep in view on resize
  $effect(() => {
    const handleResize = () => {
      const width = isMinimized ? 256 : 320;
      const height = isMinimized ? 56 : 400;
      position = {
        x: Math.max(0, Math.min(position.x, window.innerWidth - width)),
        y: Math.max(0, Math.min(position.y, window.innerHeight - height))
      };
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const queue = $derived(player.queue);
  const currentTrack = $derived(player.currentTrack);
  const isPlaying = $derived(player.isPlaying);
</script>

{#if queue.length > 0}
  <div
    class={cn(
      'fixed z-[100] flex flex-col rounded-xl border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md',
      isDragging ? 'cursor-grabbing' : 'transition-all duration-300',
      isMinimized ? 'h-14 w-64' : 'h-[400px] w-80'
    )}
    style="left: {position.x}px; top: {position.y}px;"
  >
    <!-- Header / Drag handle -->
    <div
      class="flex h-12 cursor-move items-center justify-between border-b px-3 active:cursor-grabbing"
      onmousedown={handleMouseDown}
      role="presentation"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <GripVertical size={16} class="text-muted-foreground" />
        <ListMusic size={18} class="text-primary" />
        <span class="truncate text-xs font-bold tracking-wider uppercase">
          {isMinimized ? currentTrack?.title || 'Audio Player' : 'Audio Queue'}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          onclick={() => (isMinimized = !isMinimized)}
        >
          {#if isMinimized}
            <Maximize2 size={14} />
          {:else}
            <Minimize2 size={14} />
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-destructive hover:bg-destructive/10"
          onclick={() => player.clearQueue()}
        >
          <X size={14} />
        </Button>
      </div>
    </div>

    {#if !isMinimized}
      <!-- Main Player Info -->
      <div class="flex flex-col gap-3 border-b bg-muted/30 p-4">
        <div class="flex flex-col gap-1 text-center">
          <span class="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase"
            >Now Playing</span
          >
          <h3 class="truncate text-lg font-bold text-primary">
            {currentTrack?.title || 'No Track Selected'}
          </h3>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => player.prev()}>
            <SkipBack size={20} fill="currentColor" />
          </Button>

          <Button
            variant="default"
            size="icon"
            class="h-12 w-12 rounded-full shadow-lg"
            onclick={() => (isPlaying ? player.pause() : player.play())}
          >
            {#if isPlaying}
              <Pause size={24} fill="currentColor" />
            {:else}
              <Play size={24} fill="currentColor" class="ml-1" />
            {/if}
          </Button>

          <Button variant="ghost" size="icon" onclick={() => player.next()}>
            <SkipForward size={20} fill="currentColor" />
          </Button>
        </div>

        <div class="mt-1 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            class={cn(
              'h-7 gap-1.5 text-[10px] font-bold uppercase',
              player.isRepeatQueue ? 'text-primary' : 'text-muted-foreground'
            )}
            onclick={() => (player.isRepeatQueue = !player.isRepeatQueue)}
          >
            <Repeat size={14} />
            {player.isRepeatQueue ? 'Repeat On' : 'Repeat Off'}
          </Button>
          <span class="font-mono text-[10px] text-muted-foreground">
            {player.currentIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      <!-- Queue List -->
      <div class="flex-grow overflow-y-auto p-2">
        <div class="flex flex-col gap-1">
          {#each queue as track, i (track.url + i)}
            <div
              class={cn(
                'group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors',
                player.currentIndex === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              )}
            >
              <button
                class="flex flex-grow items-center gap-3 overflow-hidden text-left"
                onclick={() => {
                  player.currentIndex = i;
                  player.play();
                }}
              >
                <span class="font-mono text-[10px] opacity-40">{i + 1}</span>
                <span class="truncate text-sm font-medium">{track.title}</span>
                {#if player.currentIndex === i && isPlaying}
                  <div class="mb-0.5 flex h-3 items-end gap-0.5">
                    <div class="w-1 animate-[bounce_0.6s_infinite] bg-primary"></div>
                    <div class="w-1 animate-[bounce_0.8s_infinite] bg-primary"></div>
                    <div class="w-1 animate-[bounce_0.4s_infinite] bg-primary"></div>
                  </div>
                {/if}
              </button>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7 opacity-0 group-hover:opacity-100"
                onclick={(e) => {
                  e.stopPropagation();
                  player.removeFromQueue(track.url);
                }}
              >
                <Trash2 size={12} class="text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  @keyframes bounce {
    0%,
    100% {
      height: 4px;
    }
    50% {
      height: 12px;
    }
  }
</style>
