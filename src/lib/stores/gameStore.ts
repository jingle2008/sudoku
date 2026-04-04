import { writable, derived } from 'svelte/store';
import { Coord } from '$lib/sudoku/coord';
import { BOX_SIZE, GRID_SIZE } from '$lib/sudoku/constants';
import { isValidPlacement } from '$lib/sudoku/engine';
import { generateSudokuPuzzle } from '$lib/sudoku/puzzleGenerator';
import {
	applyNakedPairs,
	processNakedSingles,
	removeMatchingNotes,
} from '$lib/sudoku/solverStrategies';

import type { Cell } from '$lib/sudoku/types';
import type { Grid } from '$lib/sudoku/engine';
import type { PuzzleWorkerRequest, PuzzleWorkerResponse } from '$lib/workers/puzzleWorker';
import { solveLogStore } from './solveLogStore';
import { statsStore } from './statsStore';

import { startTimer, stopTimer, formatTime, type TimerState, initialTimerState } from './timerStore';
import { snapshotState, restoreSnapshot, type HistoryState, type MoveLogEntry, initialHistoryState } from './historyStore';

export type GameState = {
	grid: Cell[][];
	selectedCell: Coord;
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

const createInitialCell = (): Cell => ({
	value: null,
	isSelected: false,
	notes: new Set<number>(),
	isInitial: false,
	isFlashing: false,
	isHighlighted: false,
});

function createInitialGrid(): Cell[][] {
	return Array(GRID_SIZE)
		.fill(null)
		.map(() =>
			Array(GRID_SIZE)
				.fill(null)
				.map(createInitialCell)
		);
}

function findFirstEmptyCell(grid: Cell[][]): Coord {
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			if (grid[r][c].value === null) {
				return new Coord(r, c);
			}
		}
	}
	return new Coord(0, 0);
}

// Track active worker and generation to prevent race conditions
let activeWorker: Worker | null = null;
let generationId = 0;

// Create the game store
function createGameStore() {
	const { subscribe, set, update } = writable({
		grid: createInitialGrid(),
		selectedCell: new Coord(0, 0),
		isPencilMode: false,
		isGameStarted: false,
		isGenerating: false,
		...initialHistoryState,
		difficulty: 'medium' as Difficulty,
		initialGrid: [] as (number | null)[][],
		isComplete: false,
		isNewBestTime: false,
		previousBestTime: null as number | null,
		...initialTimerState,
		flashTimeout: null as number | null,
		isAuthoring: false
	});

	// Initialize the first cell as selected
	update((state) => {
		const newState = { ...state };
		newState.grid[0][0].isSelected = true;
		return newState;
	});

	// Helper function to check for conflicts and get conflicting cells
	function findConflictingCells<T extends { value: number | null } | number>(
		grid: T[][],
		pos: Coord,
		value: number
	): Coord[] {
		const { row, col } = pos;
		const conflictingCells: Coord[] = [];

		for (let c = 0; c < GRID_SIZE; c++) {
			if (c !== col) {
				const cellValue = typeof grid[row][c] === 'number'
					? grid[row][c] as number
					: (grid[row][c] as { value: number | null }).value;
				if (cellValue === value) {
					conflictingCells.push(pos.withCol(c));
				}
			}
		}

		for (let r = 0; r < GRID_SIZE; r++) {
			if (r !== row) {
				const cellValue = typeof grid[r][col] === 'number'
					? grid[r][col] as number
					: (grid[r][col] as { value: number | null }).value;
				if (cellValue === value) {
					conflictingCells.push(pos.withRow(r));
				}
			}
		}

		const { row: boxRow, col: boxCol } = pos.boxOrigin;
		for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
			for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
				if (r !== row || c !== col) {
					const cellValue = typeof grid[r][c] === 'number'
						? grid[r][c] as number
						: (grid[r][c] as { value: number | null }).value;
					if (cellValue === value) {
						conflictingCells.push(new Coord(r, c));
					}
				}
			}
		}

		return conflictingCells;
	}

	function hasConflict(grid: Cell[][], pos: Coord, value: number): boolean {
		return findConflictingCells(grid, pos, value).length > 0;
	}

	function flashConflictingCells(grid: Cell[][], pos: Coord, value: number) {
		update(state => {
			if (state.flashTimeout !== null) {
				clearTimeout(state.flashTimeout);
			}
			return state;
		});

		const conflictingCells = findConflictingCells(grid, pos, value);
		if (conflictingCells.length === 0) return;

		update(state => {
			const newState = { ...state };
			conflictingCells.forEach(({ row, col }) => {
				newState.grid[row][col].isFlashing = true;
			});
			return newState;
		});

		const flashTimeout = setTimeout(() => {
			update(state => {
				const newState = { ...state };
				conflictingCells.forEach(({ row, col }) => {
					newState.grid[row][col].isFlashing = false;
				});
				newState.flashTimeout = null;
				return newState;
			});
		}, 1000);

		update(state => ({ ...state, flashTimeout }));
	}

	function handlePencilMode(state: GameState, pos: Coord, value: number | null): string | null {
		const { row, col } = pos;
		if (state.grid[row][col].value !== null) return null;
		if (value !== null) {
			if (hasConflict(state.grid, pos, value)) {
				flashConflictingCells(state.grid, pos, value);
				return null;
			}
			const notes = state.grid[row][col].notes;
			const added = !notes.has(value);
			added ? notes.add(value) : notes.delete(value);
			return added
				? `Note R${row + 1}C${col + 1} + {${value}}`
				: `Note R${row + 1}C${col + 1} - {${value}}`;
		} else {
			state.grid[row][col].notes.clear();
			return `Clear notes R${row + 1}C${col + 1}`;
		}
	}

	function handlePenMode(state: GameState, pos: Coord, value: number | null): string | null {
		const { row, col } = pos;
		if (value !== null) {
			if (hasConflict(state.grid, pos, value)) {
				flashConflictingCells(state.grid, pos, value);
				return null;
			}
			state.grid[row][col].value = value;
			state.grid[row][col].notes.clear();
			removeMatchingNotes(state.grid, pos, value);
			return `Set R${row + 1}C${col + 1} = ${value}`;
		} else {
			state.grid[row][col].value = null;
			return `Delete R${row + 1}C${col + 1}`;
		}
	}

	return {
		subscribe,

		startGame: (difficulty: Difficulty = 'medium') => {
			// Stop any existing timer before starting a new game (prevents timer leak)
			update((state) => {
				stopTimer(state.timerInterval);
				return { ...state, timerInterval: null };
			});

			function applyPuzzle(puzzle: Grid) {
				const initialGrid = puzzle.map((row) => [...row]);

				const newGrid = createInitialGrid();
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						if (puzzle[row][col] !== null) {
							newGrid[row][col].value = puzzle[row][col];
							newGrid[row][col].isInitial = true;
						}
					}
				}

				const timer = startTimer(update);

				update((state) => {
					const firstEmptyCell = findFirstEmptyCell(newGrid);
					newGrid[firstEmptyCell.row][firstEmptyCell.col].isSelected = true;

					return {
						...state,
						grid: newGrid,
						initialGrid,
						isGameStarted: true,
						isGenerating: false,
						difficulty,
						isComplete: false,
						startTime: timer.startTime,
						elapsedTime: 0,
						timerInterval: timer.timerInterval,
						selectedCell: firstEmptyCell
					};
				});
			}

			// Terminate any existing worker and bump generation counter
			if (activeWorker) {
				activeWorker.terminate();
				activeWorker = null;
			}
			generationId++;
			const currentGeneration = generationId;

			// Try to use a Web Worker for puzzle generation
			if (typeof Worker !== 'undefined') {
				update((state) => ({ ...state, isGenerating: true, difficulty }));

				try {
					const worker = new Worker(
						new URL('$lib/workers/puzzleWorker.ts', import.meta.url),
						{ type: 'module' }
					);
					activeWorker = worker;

					worker.onmessage = (event: MessageEvent<PuzzleWorkerResponse>) => {
						if (event.data.type === 'result') {
							if (currentGeneration === generationId) {
								applyPuzzle(event.data.puzzle);
							}
							worker.terminate();
							if (activeWorker === worker) activeWorker = null;
						}
					};

					worker.onerror = () => {
						// Fallback to synchronous generation on worker error
						worker.terminate();
						if (activeWorker === worker) activeWorker = null;
						if (currentGeneration === generationId) {
							applyPuzzle(generateSudokuPuzzle(difficulty));
						}
					};

					worker.postMessage({ type: 'generate', difficulty } satisfies PuzzleWorkerRequest);
				} catch {
					// Fallback to synchronous generation if worker creation fails
					if (currentGeneration === generationId) {
						applyPuzzle(generateSudokuPuzzle(difficulty));
					}
				}
			} else {
				// No Web Worker support - generate synchronously
				applyPuzzle(generateSudokuPuzzle(difficulty));
			}
		},

		restartGame: () => {
			update((state) => {
				stopTimer(state.timerInterval);
				return state;
			});

			update((state) => {
				const newGrid = createInitialGrid();
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						if (state.initialGrid[row][col] !== null) {
							newGrid[row][col].value = state.initialGrid[row][col];
							newGrid[row][col].isInitial = true;
						}
					}
				}

				const timer = startTimer(update);
				const firstEmptyCell = findFirstEmptyCell(newGrid);
				newGrid[firstEmptyCell.row][firstEmptyCell.col].isSelected = true;

				return {
					...state,
					grid: newGrid,
					selectedCell: firstEmptyCell,
					...initialHistoryState,
					isComplete: false,
					startTime: timer.startTime,
					elapsedTime: 0,
					timerInterval: timer.timerInterval
				};
			});
		},

		togglePencilMode: () =>
			update((state) => ({ ...state, isPencilMode: !state.isPencilMode })),

		setPencilMode: (value: boolean) =>
			update((state) => ({ ...state, isPencilMode: value })),

		selectCell: (row: number, col: number) =>
			update((state) => {
				solveLogStore.clearSelection();
				if (state.selectedCell.row === row && state.selectedCell.col === col) {
					return state;
				}

				const newState = { ...state };
				newState.grid[state.selectedCell.row][state.selectedCell.col].isSelected = false;

				for (let r = 0; r < GRID_SIZE; r++) {
					for (let c = 0; c < GRID_SIZE; c++) {
						newState.grid[r][c].isHighlighted = false;
					}
				}

				newState.selectedCell = new Coord(row, col);
				newState.grid[row][col].isSelected = true;

				const selectedValue = newState.grid[row][col].value;
				if (selectedValue !== null) {
					for (let r = 0; r < GRID_SIZE; r++) {
						for (let c = 0; c < GRID_SIZE; c++) {
							if (newState.grid[r][c].value === selectedValue) {
								newState.grid[r][c].isHighlighted = true;
							}
						}
					}
				}

				return newState;
			}),

		undo: () =>
			update((state) => {
				if (state.isComplete) return state;
				if (state.undoStack.length === 0) return state;

				const currentSnapshot = snapshotState(state);
				const previousState = state.undoStack[state.undoStack.length - 1];
				const restored = restoreSnapshot(previousState);

				const lastMove = state.moveLog[state.moveLog.length - 1];

				return {
					...state,
					...restored,
					undoStack: state.undoStack.slice(0, -1),
					redoStack: [...state.redoStack, currentSnapshot],
					moveLog: state.moveLog.slice(0, -1),
					redoMoveLog: lastMove ? [...state.redoMoveLog, lastMove] : state.redoMoveLog
				};
			}),

		redo: () =>
			update((state) => {
				if (state.isComplete) return state;
				if (state.redoStack.length === 0) return state;

				const currentSnapshot = snapshotState(state);
				const nextState = state.redoStack[state.redoStack.length - 1];
				const restored = restoreSnapshot(nextState);

				const redoMove = state.redoMoveLog[state.redoMoveLog.length - 1];

				return {
					...state,
					...restored,
					undoStack: [...state.undoStack, currentSnapshot],
					redoStack: state.redoStack.slice(0, -1),
					moveLog: redoMove ? [...state.moveLog, redoMove] : state.moveLog,
					redoMoveLog: state.redoMoveLog.slice(0, -1)
				};
			}),

		undoToStep: (stepIndex: number) =>
			update((state) => {
				const numUndos = state.moveLog.length - 1 - stepIndex;
				if (numUndos <= 0) return state;

				const newUndoStack = [...state.undoStack];
				const newRedoStack = [...state.redoStack];
				const newMoveLog = [...state.moveLog];
				const newRedoMoveLog = [...state.redoMoveLog];

				let currentGrid = state.grid;
				let currentSelectedCell = state.selectedCell;

				for (let i = 0; i < numUndos; i++) {
					newRedoStack.push(snapshotState({ grid: currentGrid, selectedCell: currentSelectedCell }));
					newRedoMoveLog.push(newMoveLog.pop()!);

					const previous = newUndoStack.pop()!;
					const restored = restoreSnapshot(previous);
					currentGrid = restored.grid;
					currentSelectedCell = restored.selectedCell;
				}

				return {
					...state,
					grid: currentGrid,
					selectedCell: currentSelectedCell,
					undoStack: newUndoStack,
					redoStack: newRedoStack,
					moveLog: newMoveLog,
					redoMoveLog: newRedoMoveLog
				};
			}),

		setCellValue: (value: number | null) =>
			update((state) => {
				solveLogStore.clearSelection();
				const { row, col } = state.selectedCell;
				if (state.grid[row][col].isInitial) return state;

				const currentSnapshot = snapshotState(state);
				const newState = { ...state };

				let description: string | null;
				if (state.isPencilMode) {
					description = handlePencilMode(newState, state.selectedCell, value);
				} else {
					description = handlePenMode(newState, state.selectedCell, value);
				}

				if (description === null) return state;

				const entry: MoveLogEntry = { description, timestamp: state.elapsedTime };
				const result = {
					...newState,
					undoStack: [...state.undoStack, currentSnapshot],
					redoStack: [],
					moveLog: [...state.moveLog, entry],
					redoMoveLog: []
				};

				// Auto-detect completion: all cells filled with no conflicts
				if (!state.isComplete && !state.isPencilMode && value !== null) {
					const allFilled = result.grid.every((r) =>
						r.every((cell) => cell.value !== null)
					);
					if (allFilled) {
						const checked = checkSolution(result);
						const hasErrors = checked.grid.some((r) =>
							r.some((cell) => cell.isFlashing)
						);
						if (!hasErrors) {
							stopTimer(state.timerInterval);
							const prevStats = statsStore.getStats(state.difficulty);
							const previousBestTime = prevStats.bestTime;
							let isNewBestTime = statsStore.recordGame(state.difficulty, state.elapsedTime, true);
							if (previousBestTime === null) {
								isNewBestTime = true;
							}
							return {
								...result,
								isComplete: true,
								isNewBestTime,
								previousBestTime,
								timerInterval: null
							};
						}
					}
				}

				return result;
			}),

		toggleNote: (value: number) =>
			update((state) => {
				solveLogStore.clearSelection();
				const { row, col } = state.selectedCell;
				if (state.grid[row][col].isInitial) return state;

				const currentSnapshot = snapshotState(state);
				const newState = { ...state };

				const description = handlePencilMode(newState, state.selectedCell, value);

				if (description === null) return state;

				const entry: MoveLogEntry = { description, timestamp: state.elapsedTime };
				return {
					...newState,
					undoStack: [...state.undoStack, currentSnapshot],
					redoStack: [],
					moveLog: [...state.moveLog, entry],
					redoMoveLog: []
				};
			}),

		moveSelection: (direction: 'up' | 'down' | 'left' | 'right') =>
			update((state) => {
				const { row, col } = state.selectedCell;
				let newRow = row;
				let newCol = col;

				switch (direction) {
					case 'up': newRow = Math.max(0, row - 1); break;
					case 'down': newRow = Math.min(GRID_SIZE - 1, row + 1); break;
					case 'left': newCol = Math.max(0, col - 1); break;
					case 'right': newCol = Math.min(GRID_SIZE - 1, col + 1); break;
				}

				if (newRow === row && newCol === col) return state;

				const newState = { ...state };
				newState.grid[state.selectedCell.row][state.selectedCell.col].isSelected = false;
				newState.selectedCell = new Coord(newRow, newCol);
				newState.grid[newRow][newCol].isSelected = true;
				return newState;
			}),

		checkSolution: () =>
			update((state) => {
				const newState = checkSolution(state);
				const isComplete = newState.grid.every((row) =>
					row.every((cell) => cell.value !== null && !cell.isFlashing)
				);

				let isNewBestTime = false;
				let previousBestTime: number | null = null;

				if (isComplete && !state.isComplete) {
					// Stop timer
					stopTimer(state.timerInterval);

					// Get previous best before recording
					const prevStats = statsStore.getStats(state.difficulty);
					previousBestTime = prevStats.bestTime;

					// Record the completed game
					isNewBestTime = statsStore.recordGame(state.difficulty, state.elapsedTime, true);
					// First completion ever also counts as "new best" for celebration
					if (previousBestTime === null) {
						isNewBestTime = true;
					}
				}

				return {
					...state,
					isComplete,
					isNewBestTime,
					previousBestTime,
					timerInterval: isComplete ? null : state.timerInterval,
				};
			}),

		applyAutoNotes: () =>
			update((state) => {
				const newState = { ...state };
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						const cell = newState.grid[row][col];
						if (cell.value === null) {
							cell.notes.clear();
							for (let num = 1; num <= GRID_SIZE; num++) {
								if (!hasConflict(newState.grid, new Coord(row, col), num)) {
									cell.notes.add(num);
								}
							}
						}
					}
				}
				return newState;
			}),

		applyNakedSingles: () =>
			update((state) => {
				const newState = { ...state };
				processNakedSingles(newState.grid);
				return newState;
			}),

		applyNakedPairs: () =>
			update((state) => {
				const newState = { ...state };
				applyNakedPairs(newState.grid);
				return newState;
			}),

		formatTime,

		provideHint: () =>
			update((state) => {
				const newState = { ...state };
				let found = false;
				for (let row = 0; row < GRID_SIZE && !found; row++) {
					for (let col = 0; col < GRID_SIZE && !found; col++) {
						const cell = newState.grid[row][col];
						if (cell.value === null && cell.notes.size === 1) {
							cell.isHighlighted = true;
							found = true;
						}
					}
				}
				return newState;
			}),

		initializeEditingGrid: () => {
			update((state) => {
				const newState = { ...state };
				newState.grid = createInitialGrid();
				newState.isGameStarted = true;
				newState.isAuthoring = true;
				const timer = startTimer(update);
				newState.startTime = timer.startTime;
				newState.timerInterval = timer.timerInterval;
				return newState;
			});
		},

		checkEditingSolution: () => {
			let isUnique = false;
			update((state) => {
				const puzzle = state.grid.map(row => row.map(cell => cell.value));
				isUnique = hasUniqueSolution(puzzle);
				return state;
			});
			return isUnique;
		},

		startSolvingMode: () => {
			update((state) => {
				const newState = { ...state };
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						if (newState.grid[row][col].value !== null) {
							newState.grid[row][col].isInitial = true;
						}
					}
				}
				newState.isAuthoring = false;
				return newState;
			});
		},

		recordAbandoned: () => {
			update((state) => {
				if (state.isGameStarted && !state.isComplete && !state.isAuthoring) {
					statsStore.recordGame(state.difficulty, state.elapsedTime, false);
				}
				return state;
			});
		},

		resetGame: () => {
			update((state) => {
				stopTimer(state.timerInterval);
				return {
					...state,
					grid: createInitialGrid(),
					selectedCell: new Coord(0, 0),
					isPencilMode: false,
					isGameStarted: false,
					isGenerating: false,
					isAuthoring: false,
					...initialHistoryState,
					difficulty: 'medium',
					initialGrid: [],
					isComplete: false,
					isNewBestTime: false,
					previousBestTime: null,
					...initialTimerState,
					flashTimeout: null
				};
			});
		}
	};
}

// Check if a puzzle has a unique solution (used by checkEditingSolution)
function hasUniqueSolution(puzzle: (number | null)[][]): boolean {
	let solutionCount = 0;
	const maxSolutions = 2;

	function solve(puzzle: (number | null)[][], row: number, col: number): boolean {
		if (solutionCount >= maxSolutions) return false;
		if (row === GRID_SIZE) {
			solutionCount++;
			return solutionCount < maxSolutions;
		}
		if (col === GRID_SIZE) return solve(puzzle, row + 1, 0);
		if (puzzle[row][col] !== null) return solve(puzzle, row, col + 1);

		for (let num = 1; num <= GRID_SIZE; num++) {
			if (isValidPlacement(puzzle as number[][], new Coord(row, col), num)) {
				puzzle[row][col] = num;
				if (!solve(puzzle, row, col + 1)) return false;
				puzzle[row][col] = null;
			}
		}
		return true;
	}

	solve(puzzle, 0, 0);
	return solutionCount === 1;
}

// Create the store
export const gameStore = createGameStore();

// Derived stores for convenience
export const selectedCell = derived(gameStore, ($gameStore) => $gameStore.selectedCell);
export const grid = derived(gameStore, ($gameStore) => $gameStore.grid);
export const isPencilMode = derived(gameStore, ($gameStore) => $gameStore.isPencilMode);
export const isGameStarted = derived(gameStore, ($gameStore) => $gameStore.isGameStarted);
export const isGenerating = derived(gameStore, ($gameStore) => $gameStore.isGenerating);
export const canUndo = derived(gameStore, ($gameStore) => $gameStore.undoStack.length > 0);
export const canRedo = derived(gameStore, ($gameStore) => $gameStore.redoStack.length > 0);
export const canDelete = derived(
	gameStore,
	($gameStore) => {
		const cell = $gameStore.grid[$gameStore.selectedCell.row][$gameStore.selectedCell.col];
		return cell.value !== null && !cell.isInitial;
	}
);
export const difficulty = derived(gameStore, ($gameStore) => $gameStore.difficulty);
export const isComplete = derived(gameStore, ($gameStore) => $gameStore.isComplete);
export const initialGrid = derived(gameStore, ($gameStore) => $gameStore.initialGrid);
export const elapsedTime = derived(gameStore, ($gameStore) => $gameStore.elapsedTime);
export const formattedTime = derived(gameStore, ($gameStore) =>
	gameStore.formatTime($gameStore.elapsedTime)
);
export const isNewBestTime = derived(gameStore, ($gameStore) => $gameStore.isNewBestTime);
export const previousBestTime = derived(gameStore, ($gameStore) => $gameStore.previousBestTime);
export const moveLog = derived(gameStore, ($gameStore) => $gameStore.moveLog);
export const moveLogCount = derived(gameStore, ($gameStore) => $gameStore.moveLog.length);

function checkSolution(state: GameState): GameState {
	const newState = { ...state };
	const grid = newState.grid;

	// Reset all flashing state before checking
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			grid[row][col].isFlashing = false;
		}
	}

	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			const cell = grid[row][col];
			if (cell.value === null) continue;

			for (let c = 0; c < GRID_SIZE; c++) {
				if (c !== col && grid[row][c].value === cell.value) {
					cell.isFlashing = true;
					grid[row][c].isFlashing = true;
				}
			}

			for (let r = 0; r < GRID_SIZE; r++) {
				if (r !== row && grid[r][col].value === cell.value) {
					cell.isFlashing = true;
					grid[r][col].isFlashing = true;
				}
			}

			const pos = new Coord(row, col);
			const { row: boxRow, col: boxCol } = pos.boxOrigin;
			for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
				for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
					if (r !== row && c !== col && grid[r][c].value === cell.value) {
						cell.isFlashing = true;
						grid[r][c].isFlashing = true;
					}
				}
			}
		}
	}

	return newState;
}
