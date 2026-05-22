import { browser } from '$app/environment';

export type Theme = 'dark' | 'light' | 'system';

export function getTheme(): Theme {
  if (!browser) return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
}

export function setTheme(theme: Theme) {
  if (!browser) return;
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}
