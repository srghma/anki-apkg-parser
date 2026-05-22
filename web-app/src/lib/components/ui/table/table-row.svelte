<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { class: className, children, ...props }: Props = $props();
  type Props = HTMLAttributes<HTMLTableRowElement> & { class?: string };
</script>

<tr
  class={cn(
    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    className
  )}
  {...props}
>
  {@render children?.()}
</tr>
