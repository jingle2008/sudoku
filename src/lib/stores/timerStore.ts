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

/**
 * Start a new timer, updating elapsedTime every second via store.update.
 * Returns { startTime, timerInterval } to merge into state.
 */
export function startTimer(update: Writable<{ startTime: number | null; elapsedTime: number; timerInterval: number | null }>['update']): { startTime: number; timerInterval: number } {
	const startTime = Date.now();
	const timerInterval = setInterval(() => {
		update((state) => ({
			...state,
			elapsedTime: Math.floor((Date.now() - startTime) / 1000)
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
}

/**
 * Format elapsed time as MM:SS.
 */
export function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
