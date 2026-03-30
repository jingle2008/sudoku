import { generateSudokuPuzzle } from '$lib/sudoku/puzzleGenerator';
import type { Difficulty } from '$lib/stores/gameStore';
import type { Grid } from '$lib/sudoku/engine';

export type PuzzleWorkerRequest = {
	type: 'generate';
	difficulty: Difficulty;
};

export type PuzzleWorkerResponse = {
	type: 'result';
	puzzle: Grid;
};

self.onmessage = (event: MessageEvent<PuzzleWorkerRequest>) => {
	if (event.data.type === 'generate') {
		const puzzle = generateSudokuPuzzle(event.data.difficulty);
		self.postMessage({ type: 'result', puzzle } satisfies PuzzleWorkerResponse);
	}
};
