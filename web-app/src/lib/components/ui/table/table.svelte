<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLTableElement> {
    variant?: 'default' | 'outline';
  }

  let { class: className, variant = 'default', children, ...props }: Props = $props();

  const variants: Record<NonNullable<Props['variant']>, string> = {
    default: 'border-collapse text-sm',
    outline: 'border-collapse text-sm border'
  };
</script>

<table class={cn(variants[variant], className)} {...props}>
  {@render children?.()}
</table>
