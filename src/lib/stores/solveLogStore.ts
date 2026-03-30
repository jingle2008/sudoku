import { writable, derived } from 'svelte/store';
import type { SolveStep } from '$lib/sudoku/solveStep';
import type { Coord } from '$lib/sudoku/coord';

type SolveLogState = {
	steps: SolveStep[];
	selectedStepIndex: number | null;
};

function createSolveLogStore() {
	const { subscribe, update, set } = writable<SolveLogState>({
		steps: [],
		selectedStepIndex: null
	});

	return {
		subscribe,
		addStep: (step: SolveStep) => {
			update((state) => ({ ...state, steps: [...state.steps, step] }));
		},
		clear: () => {
			set({ steps: [], selectedStepIndex: null });
		},
		selectStep: (index: number) => {
			update((state) => ({
				...state,
				selectedStepIndex: state.selectedStepIndex === index ? null : index
			}));
		},
		clearSelection: () => {
			update((state) => ({ ...state, selectedStepIndex: null }));
		}
	};
}

export const solveLogStore = createSolveLogStore();
export const stepCount = derived(solveLogStore, ($log) => $log.steps.length);
export const highlightedCells = derived(solveLogStore, ($log): Coord[] => {
	if ($log.selectedStepIndex === null) return [];
	const step = $log.steps[$log.selectedStepIndex];
	return step ? step.cells : [];
});
export const selectedStepIndex = derived(solveLogStore, ($log) => $log.selectedStepIndex);
