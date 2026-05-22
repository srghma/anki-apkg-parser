<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { class: className, children, colspan, ...props }: Props = $props();
  type Props = HTMLAttributes<HTMLTableCellElement> & { class?: string; colspan?: number };
</script>

<td {colspan} class={cn('p-4 align-middle', className)} {...props}>
  {@render children?.()}
</td>
