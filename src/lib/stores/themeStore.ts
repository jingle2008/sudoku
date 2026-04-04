import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function getInitialTheme(): 'light' | 'dark' {
	if (browser) {
		const stored = localStorage.getItem('theme');
		if (stored === 'dark' || stored === 'light') return stored;
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
	}
	return 'light';
}

export const theme = writable<'light' | 'dark'>(getInitialTheme());

export function toggleTheme() {
	theme.update((current) => {
		const next = current === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', next);
			document.documentElement.classList.toggle('dark', next === 'dark');
		}
		return next;
	});
}

export function initTheme() {
	if (browser) {
		const current = getInitialTheme();
		document.documentElement.classList.toggle('dark', current === 'dark');
		theme.set(current);
	}
}
