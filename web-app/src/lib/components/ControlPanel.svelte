<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-svelte';

  const appState = getAppState();
  let isMinimized = $state(false);
  let position = $state({ x: window.innerWidth - 240, y: 80 }); // Initial position
  let isDragging = $state(false);
  let dragOffset = { x: 0, y: 0 };
  let hasMoved = $state(false);
  let startPos = { x: 0, y: 0 };

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    hasMoved = false;
    startPos = { x: e.clientX, y: e.clientY };
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    const width = isMinimized ? 48 : 224;
    const height = isMinimized ? 160 : 200;

    newX = Math.max(0, Math.min(newX, window.innerWidth - width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - height));

    position = { x: newX, y: newY };
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function toggleMinimized() {
    if (!hasMoved) {
      isMinimized = !isMinimized;
    }
  }

  // Keep in view on resize
  $effect(() => {
    const handleResize = () => {
      const width = isMinimized ? 48 : 224;
      const height = isMinimized ? 160 : 200;
      position = {
        x: Math.max(0, Math.min(position.x, window.innerWidth - width)),
        y: Math.max(0, Math.min(position.y, window.innerHeight - height))
      };
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const controls = [
    { label: 'Front', state: () => appState.hideFront, toggle: () => appState.toggleFront() },
    { label: 'Back', state: () => appState.hideBack, toggle: () => appState.toggleBack() },
    { label: 'Info', state: () => appState.hideInfo, toggle: () => appState.toggleInfo() }
  ];
</script>

<div
  class={cn(
    'fixed z-50 flex flex-col gap-2 rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur-sm',
    isDragging ? 'cursor-grabbing' : 'transition-all duration-300',
    isMinimized ? 'w-12 items-center' : 'w-56'
  )}
  style="left: {position.x}px; top: {position.y}px;"
>
  <div
    class="mb-1 flex cursor-move items-center justify-between border-b pb-1 active:cursor-grabbing"
    onmousedown={handleMouseDown}
    role="presentation"
  >
    {#if !isMinimized}
      <span class="px-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"
        >Controls</span
      >
    {/if}
    <Button variant="ghost" size="icon" class="h-8 w-8" onclick={toggleMinimized}>
      {#if isMinimized}
        <ChevronDown size={16} />
      {:else}
        <ChevronUp size={16} />
      {/if}
    </Button>
  </div>

  {#if !isMinimized}
    <div class="flex flex-col gap-2 p-1">
      {#each controls as ctrl (ctrl.label)}
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium">{ctrl.label}</span>
          <Button
            variant={ctrl.state() ? 'outline' : 'default'}
            size="sm"
            class="h-8 w-24 gap-2"
            onclick={ctrl.toggle}
          >
            {#if ctrl.state()}
              <EyeOff size={14} />
              Show
            {:else}
              <Eye size={14} />
              Hide
            {/if}
          </Button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      {#each controls as ctrl (ctrl.label)}
        <Button
          variant={ctrl.state() ? 'outline' : 'default'}
          size="icon"
          class="h-8 w-8"
          onclick={ctrl.toggle}
          title={ctrl.state() ? `Show ${ctrl.label}` : `Hide ${ctrl.label}`}
        >
          {#if ctrl.state()}
            <EyeOff size={14} />
          {:else}
            <Eye size={14} />
          {/if}
        </Button>
      {/each}
    </div>
  {/if}
</div>
