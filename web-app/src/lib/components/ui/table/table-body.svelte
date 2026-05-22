<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { class: className, children, ...props }: Props = $props();
  type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string };

  function cnColorSchemeAware(className: string | undefined) {
    return cn('[-webkit-font-smoothing=antialiased]', className);
  }
</script>

<tbody class={cnColorSchemeAware(className)} {...props}>
  {@render children?.()}
</tbody>
