import { writable, derived } from 'svelte/store';
import type { SolveStep } from '$lib/sudoku/solveStep';

function createSolveLogStore() {
	const { subscribe, update, set } = writable<SolveStep[]>([]);

	return {
		subscribe,
		addStep: (step: SolveStep) => {
			update((steps) => [...steps, step]);
		},
		clear: () => {
			set([]);
		}
	};
}

export const solveLogStore = createSolveLogStore();
export const stepCount = derived(solveLogStore, ($log) => $log.length);
