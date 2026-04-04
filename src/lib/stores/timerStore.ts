import type { Writable } from 'svelte/store';

export type TimerState = {
	startTime: number | null;
	elapsedTime: number;
	timerInterval: number | null;
};

export const initialTimerState: TimerState = {
	startTime: null,
	elapsedTime: 0,
	timerInterval: null
};

// Track visibility-based pause state
let hiddenAt: number | null = null;
let totalHiddenMs = 0;
let visibilityHandler: (() => void) | null = null;

/**
 * Start a new timer, updating elapsedTime every second via store.update.
 * Returns { startTime, timerInterval } to merge into state.
 */
export function startTimer(update: Writable<{ startTime: number | null; elapsedTime: number; timerInterval: number | null }>['update']): { startTime: number; timerInterval: number } {
	const startTime = Date.now();
	totalHiddenMs = 0;
	hiddenAt = null;

	// Clean up previous visibility listener
	if (visibilityHandler && typeof document !== 'undefined') {
		document.removeEventListener('visibilitychange', visibilityHandler);
	}

	visibilityHandler = () => {
		if (document.hidden) {
			hiddenAt = Date.now();
		} else if (hiddenAt !== null) {
			totalHiddenMs += Date.now() - hiddenAt;
			hiddenAt = null;
		}
	};

	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', visibilityHandler);
	}

	const timerInterval = setInterval(() => {
		if (hiddenAt !== null) return; // Don't update while hidden
		update((state) => ({
			...state,
			elapsedTime: Math.floor((Date.now() - startTime - totalHiddenMs) / 1000)
		}));
	}, 1000) as unknown as number;
	return { startTime, timerInterval };
}

/**
 * Clear an existing timer interval.
 */
export function stopTimer(timerInterval: number | null): void {
	if (timerInterval !== null) {
		clearInterval(timerInterval);
	}
	if (visibilityHandler && typeof document !== 'undefined') {
		document.removeEventListener('visibilitychange', visibilityHandler);
		visibilityHandler = null;
	}
	hiddenAt = null;
}

/**
 * Format elapsed time as MM:SS.
 */
export function formatTime(seconds: number): string {
	if (seconds >= 3600) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;
		return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
