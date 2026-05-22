<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { class: className, children, ...props }: Props = $props();
  type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string };
</script>

<thead class={cn('[&_tr]:border-b', className)} {...props}>
  {@render children?.()}
</thead>
