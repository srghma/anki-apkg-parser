<script lang="ts">
  import { getAppState, type SortMode } from '$lib/state.svelte';
  import { Sun, Moon, Monitor, ListOrdered, Clock, Tag } from 'lucide-svelte';
  import { setTheme, type Theme } from '$lib/theme';
  import { cn } from '$lib/utils';
  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button';

  type Props = {
    currentTheme: Theme;
    allPos: string[];
  };

  let { currentTheme, allPos }: Props = $props();
  const appState = getAppState();

  const themes: { value: Theme; icon: Component<Record<string, unknown>> }[] = [
    { value: 'light', icon: Sun as unknown as Component<Record<string, unknown>> },
    { value: 'dark', icon: Moon as unknown as Component<Record<string, unknown>> },
    { value: 'system', icon: Monitor as unknown as Component<Record<string, unknown>> }
  ];

  const sortModes: { value: SortMode; icon: Component<Record<string, unknown>>; label: string }[] =
    [
      {
        value: 'index',
        icon: ListOrdered as unknown as Component<Record<string, unknown>>,
        label: 'Sort by Index'
      },
      {
        value: 'due',
        icon: Clock as unknown as Component<Record<string, unknown>>,
        label: 'Sort by Due Date'
      }
    ];
  function handleWheel(e: WheelEvent) {
    if (e.deltaY !== 0) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).scrollLeft += e.deltaY;
    }
  }
</script>

<header class="w-full border-b bg-background/50 backdrop-blur-sm">
  <div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-layers"
          ><path
            d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
          /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path
            d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
          /></svg
        >
      </div>
      <h1 class="text-xl font-bold tracking-tight">Apkg Explorer</h1>
    </div>

    <div class="flex min-w-0 flex-1 items-center justify-end gap-4">
      <div class="flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        <Button
          variant="ghost"
          size="sm"
          class={cn(
            'h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase transition-all duration-200',
            appState.showDue
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => appState.toggleShowDue()}
        >
          Due
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class={cn(
            'h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase transition-all duration-200',
            appState.showNew
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => appState.toggleShowNew()}
        >
          New
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class={cn(
            'h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase transition-all duration-200',
            appState.showNotDue
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => appState.toggleShowNotDue()}
        >
          Not Due
        </Button>
      </div>

      <div class="flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        {#each sortModes as s (s.value)}
          <Button
            variant="ghost"
            size="sm"
            class={cn(
              'h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase transition-all duration-200',
              appState.sortMode === s.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onclick={() => appState.setSortMode(s.value)}
            title={s.label}
          >
            <s.icon size={14} />
            {s.value}
          </Button>
        {/each}
      </div>

      <div
        class="flex min-w-0 flex-1 max-w-[500px] items-center gap-2 overflow-x-auto rounded-full border bg-muted/50 p-1 no-scrollbar"
        onwheel={handleWheel}
      >
        <div class="flex sticky left-0 z-10 items-center gap-1 bg-muted/50 px-2 text-muted-foreground">
          <Tag size={14} />
          <span class="text-[10px] font-bold uppercase whitespace-nowrap">POS:</span>
        </div>
        <div class="flex items-center gap-1 pr-2">
          {#each allPos as pos}
            {@const isDisabled = appState.disabledPos.includes(pos)}
            <Button
              variant="ghost"
              size="sm"
              class={cn(
                'h-7 rounded-full px-3 text-[9px] font-bold whitespace-nowrap transition-all duration-200',
                !isDisabled
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground line-through opacity-50'
              )}
              onclick={() => appState.togglePos(pos)}
            >
              {pos}
            </Button>
          {/each}
        </div>
      </div>

      <div class="flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        {#each themes as t (t.value)}
          <Button
            variant="ghost"
            size="icon"
            class={cn(
              'h-8 w-8 rounded-full transition-all duration-200',
              currentTheme === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onclick={() => setTheme(t.value)}
            title={`Switch to ${t.value} theme`}
          >
            <t.icon size={16} />
          </Button>
        {/each}
      </div>
    </div>
  </div>
</header>

<style>
  :global(.no-scrollbar::-webkit-scrollbar) {
    display: none;
  }
  :global(.no-scrollbar) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
