<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { X, ExternalLink } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  type Props = {
    content: string | null;
    onClose: () => void;
  };

  let { content, onClose }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  $effect(() => {
    if (content) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
</script>

{#if content}
  <div
    role="presentation"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    transition:fade={{ duration: 200 }}
    onkeydown={handleKeydown}
  >
    <!-- Backdrop -->
    <div
      role="presentation"
      class="absolute inset-0 bg-background/80 backdrop-blur-md"
      onclick={onClose}
    ></div>

    <!-- Modal Content -->
    <div
      class="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div class="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <ExternalLink size={18} />
          </div>
          <h3 class="text-lg font-bold tracking-tight">Wiktionary Details</h3>
        </div>
        <Button variant="ghost" size="icon" class="h-10 w-10 rounded-full" onclick={onClose}>
          <X size={20} />
        </Button>
      </div>

      <div class="flex-grow overflow-y-auto px-6 py-8">
        <div class="prose prose-slate dark:prose-invert wiktionary-container max-w-none">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html content}
        </div>
      </div>

      <div class="flex justify-end border-t bg-muted/10 px-6 py-4">
        <Button variant="outline" onclick={onClose}>Close</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .wiktionary-container {
    --tw-prose-body: var(--foreground);
    --tw-prose-headings: var(--foreground);
    --tw-prose-links: var(--primary);
    --tw-prose-bold: var(--foreground);
    --tw-prose-counters: var(--muted-foreground);
    --tw-prose-bullets: var(--muted-foreground);
    --tw-prose-hr: var(--border);
    --tw-prose-quotes: var(--foreground);
    --tw-prose-quote-borders: var(--border);
    --tw-prose-captions: var(--muted-foreground);
    --tw-prose-code: var(--foreground);
    --tw-prose-pre-code: var(--foreground);
    --tw-prose-pre-bg: var(--muted);
    --tw-prose-th-borders: var(--border);
    --tw-prose-td-borders: var(--border);
  }

  .wiktionary-container :global(h3) {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.25rem;
  }

  .wiktionary-container :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .wiktionary-container :global(td),
  .wiktionary-container :global(th) {
    border: 1px solid var(--border);
    padding: 0.5rem;
    text-align: left;
  }

  .wiktionary-container :global(th) {
    background-color: color-mix(in srgb, var(--muted), transparent 50%);
    font-weight: 600;
  }

  .wiktionary-container :global(a) {
    text-decoration: underline;
    text-underline-offset: 2px;
    color: var(--primary);
  }

  .wiktionary-container :global(ul),
  .wiktionary-container :global(ol) {
    padding-left: 1.25rem;
  }

  .wiktionary-container :global(li) {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }
</style>
