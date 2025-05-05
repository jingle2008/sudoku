import { writable, derived } from 'svelte/store';
import { Coord } from '$lib/sudoku/coord';
import { BOARD_SIZE, BOX_SIZE, GRID_SIZE, Group } from '$lib/sudoku/constants';
import { isValidPlacement } from '$lib/sudoku/engine';

export type Cell = {
	value: number | null;
	notes: Set<number>;
	isSelected: boolean;
	isHighlighted: boolean;
	isInitial: boolean;
	isFlashing: boolean;
};

export type GameState = {
	grid: Cell[][];
	selectedCell: Coord;
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

// Constants for repeated values
const EMPTY_CELL = null;

function fromBoxIndex(index: number): { row: number, col: number } {
	return {
		row: Math.floor(index / BOX_SIZE),
		col: index % BOX_SIZE
	};
}

function getCellInBox(box: { row: number, col: number }, index: number): { row: number, col: number } {
	const { row: rowOffset, col: colOffset } = fromBoxIndex(index);
	return {
		row: box.row + rowOffset,
		col: box.col + colOffset
	};
}

/** Removes `notes` from every *empty* cell in the supplied coordinates list.  
 *  Returns total notes removed. */
export function removeNotesFromCells(
	grid: Cell[][],
	targets: Coord[],
	notes: Set<number>
): number {
	let removed = 0;
	for (const { row, col } of targets) {
		if (grid[row][col].value !== null) continue;
		for (const n of notes) {
			if (grid[row][col].notes.delete(n)) removed++;
		}
	}
	return removed;
}

// Function to gather clues from a specific direction
function getClues(grid: Cell[][], pos: Coord, direction: Group): Set<number> {
	const notes = new Set<number>();
	const { row, col } = pos;
	const box = pos.boxOrigin;

	for (let i = 0; i < GRID_SIZE; i++) {
		let cell: Cell;
		if (direction === Group.Row) {
			if (i === col) continue;
			cell = grid[row][i];
		} else if (direction === Group.Column) {
			if (i === row) continue;
			cell = grid[i][col];
		} else {
			const c = getCellInBox(box, i);
			if (c.row === row && c.col === col) continue;
			cell = grid[c.row][c.col];
		}

		if (cell.value !== EMPTY_CELL) {
			notes.add(cell.value);
		} else {
			cell.notes.forEach(note => notes.add(note));
		}
	}

	return notes;
}

function applyUniqueNotes(grid: Cell[][], pos: Coord, group: Group): boolean {
	const { row, col } = pos;
	const cell = grid[row][col];
	const clues = getClues(grid, pos, group);
	const uniqueNotes = [...cell.notes].filter(note => !clues.has(note));

	if (uniqueNotes.length === 1) {
		const note = uniqueNotes[0];
		console.log(`Naked single found at (${row},${col}), value: ${note}, unique in ${group}.`);
		cell.notes.clear();
		cell.notes.add(note);
		return true;
	}

	return false;
}

function processNakedSingle(grid: Cell[][], pos: Coord): boolean {
	const { row, col } = pos;
	const cell = grid[row][col];
	if (cell.value !== null) return false;

	if (cell.notes.size === 1) {
		const note = cell.notes.values().next().value;
		console.log(`Naked single found at (${row},${col}), value: ${note}, only note in cell.`);
		return true; // Indicate that a naked single was found
	}

	return applyUniqueNotes(grid, pos, Group.Row)
		|| applyUniqueNotes(grid, pos, Group.Column)
		|| applyUniqueNotes(grid, pos, Group.Box);
}

function processNakedSingles(grid: Cell[][]) {
	let nakedSingles = 0;
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			if (processNakedSingle(grid, new Coord(row, col))) {
				nakedSingles++;
			}
		}
	}
	console.log(`${nakedSingles} naked singles applied.`);
}

export function getNakedPairInRow(grid: Cell[][], pos: Coord): Coord | null {
	const { row, col } = pos;
	for (let c = col + 1; c < GRID_SIZE; c++) {
		if (grid[row][c].notes.size !== 2) continue;
		if (grid[row][c].notes.difference(grid[row][col].notes).size === 0) {
			return pos.withCol(c);
		}
	}
	return null;
}

export function getNakedPairInColumn(grid: Cell[][], pos: Coord): Coord | null {
	const { row, col } = pos;
	for (let r = row + 1; r < GRID_SIZE; r++) {
		if (grid[r][col].notes.size !== 2) continue;
		if (grid[r][col].notes.difference(grid[row][col].notes).size === 0) {
			return pos.withRow(r);
		}
	}
	return null;
}

export function getNakedPairInBox(grid: Cell[][], pos: Coord): Coord | null {
	const { row, col } = pos;
	const { row: boxRow, col: boxCol } = pos.boxOrigin;
	for (let r = row + 1; r < boxRow + BOX_SIZE; r++) {
		for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
			if (grid[r][c].notes.size !== 2) continue;
			if (grid[r][c].notes.difference(grid[row][col].notes).size === 0) {
				return new Coord(r, c);
			}
		}
	}
	return null;
}

// given a set of cells, return if they are in the same box
function areCellsInSameBox(cells: Coord[]) {
	if (cells.length < 2) return true;

	const box1 = cells[0].boxOrigin;
	for (const cell of cells) {
		const box2 = cell.boxOrigin;
		if (!box1.equals(box2)) {
			return false;
		}
	}
	return true;
}

// Remove value from notes in the same row, column, and box
function removeMatchingNodes(grid: Cell[][], pos: Coord, value: number) {
	const { row, col } = pos;
	for (let c = 0; c < GRID_SIZE; c++) {
		if (c !== col) grid[row][c].notes.delete(value);
	}
	for (let r = 0; r < GRID_SIZE; r++) {
		if (r !== row) grid[r][col].notes.delete(value);
	}
	const { row: boxRow, col: boxCol } = pos.boxOrigin;
	for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
		for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
			if (r !== row || c !== col) grid[r][c].notes.delete(value);
		}
	}
}

// given a grid, a row and columns, return notes from all cells in the row except the columns
export function removeNotesInRow(grid: Cell[][], anchor: Coord, skips: Coord[], notes: Set<number>): number {
	console.log(`Removing notes ${[...notes]} from row.`);
	const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Row, skips), notes);
	console.log(`${removed} notes removed from cells in row.`);
	return removed;
}

// now do the same for the column and rows
export function removeNotesInColumn(grid: Cell[][], anchor: Coord, skips: Coord[], notes: Set<number>): number {
	console.log(`Removing notes ${[...notes]} from column.`);
	const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Column, skips), notes);
	console.log(`${removed} notes removed from cells in column.`);
	return removed;
}

export function removeNotesInBox(grid: Cell[][], anchor: Coord, skips: Coord[], notes: Set<number>): number {
	console.log(`Removing notes ${[...notes]} from box.`);
	const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Box, skips), notes);
	console.log(`${removed} notes removed from cells in box.`);
	return removed;
}

function processNakedPairs(grid: Cell[][], pos: Coord): { found: boolean, applied: boolean } {
	const { row, col } = pos;
	const cell = grid[row][col];
	if (cell.value !== null || cell.notes.size !== 2) return { found: false, applied: false };

	let pairFound = false;
	let totalNotesRemoved = 0;
	let pair = getNakedPairInRow(grid, pos);
	if (pair !== null) {
		pairFound = true;
		console.log(`Naked pair found at row (${row}), columns (${col},${pair.col}), values: ${[...cell.notes]}.`);
		const cells = [pos, pair];
		totalNotesRemoved += removeNotesInRow(grid, pos, cells, cell.notes);
		if (areCellsInSameBox(cells)) {
			totalNotesRemoved += removeNotesInBox(grid, pos, cells, cell.notes);
		}
	}

	pair = getNakedPairInColumn(grid, pos);
	if (pair !== null) {
		pairFound = true;
		console.log(`Naked pair found at column (${col}), rows (${row},${pair.row}), values: ${[...cell.notes]}.`);
		const cells = [pos, pair];
		totalNotesRemoved += removeNotesInColumn(grid, pos, cells, cell.notes);
		if (areCellsInSameBox(cells)) {
			totalNotesRemoved += removeNotesInBox(grid, pos, cells, cell.notes);
		}
	}

	pair = getNakedPairInBox(grid, pos);
	if (pair !== null) {
		pairFound = true;
		console.log(`Naked pair found at (${row},${col}) and (${pair.row},${pair.col}), values: ${[...cell.notes]}.`);
		totalNotesRemoved += removeNotesInBox(grid, pos, [pos, pair], cell.notes);
	}

	return { found: pairFound, applied: totalNotesRemoved > 0 };
}

function applyNakedPairs(grid: Cell[][]) {
	let nakedPairs = 0;
	let appliedPairs = 0;
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			const { found, applied } = processNakedPairs(grid, new Coord(row, col));
			if (found) nakedPairs++;
			if (applied) appliedPairs++;
		}
	}
	console.log(`${nakedPairs} naked pairs found, ${appliedPairs} applied.`);
}

const createInitialCell = (): Cell => ({
	value: null,
	isSelected: false,
	notes: new Set<number>(),
	isInitial: false,
	isFlashing: false,
	isHighlighted: false,
});

// Create the initial grid
function createInitialGrid(): Cell[][] {
	return Array(GRID_SIZE)
		.fill(null)
		.map(() =>
			Array(GRID_SIZE)
				.fill(null)
				.map(createInitialCell)
		);
}

// Create the game store
function createGameStore() {
	const { subscribe, set, update } = writable({
		grid: createInitialGrid(),
		selectedCell: new Coord(0, 0),
		isPencilMode: false,
		isGameStarted: false,
		undoStack: [] as GameState[],
		redoStack: [] as GameState[],
		difficulty: 'medium' as Difficulty,
		initialGrid: [] as (number | null)[][],
		isComplete: false,
		startTime: null as number | null,
		elapsedTime: 0,
		timerInterval: null as number | null,
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

		// Check row
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

		// Check column
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

	// Helper function to check for conflicts
	function hasConflict(grid: Cell[][], pos: Coord, value: number): boolean {
		return findConflictingCells(grid, pos, value).length > 0;
	}

	// Helper function to flash conflicting cells
	function flashConflictingCells(grid: Cell[][], pos: Coord, value: number) {
		// Clear any existing flash timeout
		update(state => {
			if (state.flashTimeout !== null) {
				clearTimeout(state.flashTimeout);
			}
			return state;
		});

		// Find all conflicting cells
		const conflictingCells = findConflictingCells(grid, pos, value);

		// If no conflicts, return early
		if (conflictingCells.length === 0) {
			return;
		}

		// Flash the conflicting cells
		update(state => {
			const newState = { ...state };
			conflictingCells.forEach(({ row, col }) => {
				newState.grid[row][col].isFlashing = true;
			});
			return newState;
		});

		// Set a timeout to remove the flashing after 1 second
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

		// Store the timeout ID
		update(state => ({
			...state,
			flashTimeout
		}));
	}

	// Handle pencil mode logic
	function handlePencilMode(state: GameState, pos: Coord, value: number | null) {
		const { row, col } = pos;
		if (value !== null) {
			if (hasConflict(state.grid, pos, value)) {
				flashConflictingCells(state.grid, pos, value);
				return;
			}
			const notes = state.grid[row][col].notes;
			notes.has(value) ? notes.delete(value) : notes.add(value);
		} else {
			state.grid[row][col].notes.clear();
		}
	}

	// Handle pen mode logic
	function handlePenMode(state: GameState, pos: Coord, value: number | null) {
		const { row, col } = pos;
		if (value !== null) {
			if (hasConflict(state.grid, pos, value)) {
				flashConflictingCells(state.grid, pos, value);
				return;
			}
			state.grid[row][col].value = value;
			state.grid[row][col].notes.clear();
			removeMatchingNodes(state.grid, pos, value);
		} else {
			state.grid[row][col].value = null;
		}
	}

	return {
		subscribe,
		// Game actions
		startGame: (difficulty: Difficulty = 'medium') => {
			const puzzle = generateSudokuPuzzle(difficulty);
			const initialGrid = puzzle.map((row) => [...row]);

			// Create the grid with the puzzle
			const newGrid = createInitialGrid();
			for (let row = 0; row < GRID_SIZE; row++) {
				for (let col = 0; col < GRID_SIZE; col++) {
					if (puzzle[row][col] !== null) {
						newGrid[row][col].value = puzzle[row][col];
						newGrid[row][col].isInitial = true;
					}
				}
			}

			// Start the timer
			const startTime = Date.now();
			const timerInterval = setInterval(() => {
				update((state) => ({
					...state,
					elapsedTime: Math.floor((Date.now() - startTime) / 1000)
				}));
			}, 1000);

			update((state) => {
				const newState = {
					...state,
					grid: newGrid,
					initialGrid,
					isGameStarted: true,
					difficulty,
					isComplete: false,
					startTime,
					elapsedTime: 0,
					timerInterval
				};

				// Find the first empty cell
				let firstEmptyCell = new Coord(0, 0);
				let found = false;

				for (let r = 0; r < GRID_SIZE && !found; r++) {
					for (let c = 0; c < GRID_SIZE && !found; c++) {
						if (newState.grid[r][c].value === null) {
							firstEmptyCell = new Coord(r, c);
							found = true;
						}
					}
				}

				// Select the first empty cell
				newState.selectedCell = firstEmptyCell;
				newState.grid[firstEmptyCell.row][firstEmptyCell.col].isSelected = true;

				return newState;
			});
		},
		restartGame: () => {
			// Clear the timer interval if it exists
			update((state) => {
				if (state.timerInterval !== null) {
					clearInterval(state.timerInterval);
				}
				return state;
			});

			// Restore the initial values from the initialGrid
			update((state) => {
				const newState = { ...state };

				// Create a new grid
				newState.grid = createInitialGrid();

				// Restore initial values
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						if (state.initialGrid[row][col] !== null) {
							newState.grid[row][col].value = state.initialGrid[row][col];
							newState.grid[row][col].isInitial = true;
						}
					}
				}

				// Reset timer
				const startTime = Date.now();
				const timerInterval = setInterval(() => {
					update((state) => ({
						...state,
						elapsedTime: Math.floor((Date.now() - startTime) / 1000)
					}));
				}, 1000);

				// Find the first empty cell
				let firstEmptyCell = new Coord(0, 0);
				let found = false;

				for (let r = 0; r < GRID_SIZE && !found; r++) {
					for (let c = 0; c < GRID_SIZE && !found; c++) {
						if (newState.grid[r][c].value === null) {
							firstEmptyCell = new Coord(r, c);
							found = true;
						}
					}
				}

				// Select the first empty cell
				newState.selectedCell = firstEmptyCell;
				newState.grid[firstEmptyCell.row][firstEmptyCell.col].isSelected = true;

				// Reset other state properties
				newState.undoStack = [];
				newState.redoStack = [];
				newState.isComplete = false;
				newState.startTime = startTime;
				newState.elapsedTime = 0;
				newState.timerInterval = timerInterval;

				return newState;
			});
		},
		togglePencilMode: () =>
			update((state) => ({
				...state,
				isPencilMode: !state.isPencilMode
			})),
		setPencilMode: (value: boolean) =>
			update((state) => ({
				...state,
				isPencilMode: value
			})),

		// Cell selection
		selectCell: (row: number, col: number) =>
			update((state) => {
				// If the same cell is already selected, do nothing
				if (state.selectedCell.row === row && state.selectedCell.col === col) {
					return state;
				}

				// Create a new state object for modifications
				const newState = { ...state };

				// Deselect previous cell
				newState.grid[state.selectedCell.row][state.selectedCell.col].isSelected = false;

				// Clear all highlights
				for (let r = 0; r < GRID_SIZE; r++) {
					for (let c = 0; c < GRID_SIZE; c++) {
						newState.grid[r][c].isHighlighted = false;
					}
				}

				// Select new cell
				newState.selectedCell = new Coord(row, col);
				newState.grid[row][col].isSelected = true;

				// Highlight cells with the same value
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
				if (state.undoStack.length === 0) return state;

				const currentState: GameState = {
					grid: state.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: state.selectedCell.clone()
				};

				const previousState = state.undoStack[state.undoStack.length - 1];
				const newUndoStack = state.undoStack.slice(0, -1);

				return {
					...state,
					grid: previousState.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: previousState.selectedCell.clone(),
					undoStack: newUndoStack,
					redoStack: [...state.redoStack, currentState]
				};
			}),

		redo: () =>
			update((state) => {
				if (state.redoStack.length === 0) return state;

				const currentState: GameState = {
					grid: state.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: state.selectedCell.clone()
				};

				const nextState = state.redoStack[state.redoStack.length - 1];
				const newRedoStack = state.redoStack.slice(0, -1);

				return {
					...state,
					grid: nextState.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: nextState.selectedCell.clone(),
					undoStack: [...state.undoStack, currentState],
					redoStack: newRedoStack
				};
			}),

		// Cell manipulation
		setCellValue: (value: number | null) =>
			update((state) => {
				const { row, col } = state.selectedCell;

				if (state.grid[row][col].isInitial) {
					return state;
				}

				const currentState: GameState = {
					grid: state.grid.map(row => row.map(cell => ({ ...cell, notes: new Set(cell.notes) }))),
					selectedCell: state.selectedCell.clone()
				};

				const newState = { ...state };

				if (state.isPencilMode) {
					handlePencilMode(newState, state.selectedCell, value);
				} else {
					handlePenMode(newState, state.selectedCell, value);
				}

				return {
					...newState,
					undoStack: [...state.undoStack, currentState],
					redoStack: []
				};
			}),

		// Navigation
		moveSelection: (direction: 'up' | 'down' | 'left' | 'right') =>
			update((state) => {
				const { row, col } = state.selectedCell;
				let newRow = row;
				let newCol = col;

				switch (direction) {
					case 'up':
						newRow = Math.max(0, row - 1);
						break;
					case 'down':
						newRow = Math.min(GRID_SIZE - 1, row + 1);
						break;
					case 'left':
						newCol = Math.max(0, col - 1);
						break;
					case 'right':
						newCol = Math.min(GRID_SIZE - 1, col + 1);
						break;
				}

				// If the position hasn't changed, return the original state
				if (newRow === row && newCol === col) {
					return state;
				}

				// Create a new state object for modifications
				const newState = { ...state };

				// Deselect previous cell
				newState.grid[state.selectedCell.row][state.selectedCell.col].isSelected = false;

				// Select new cell
				newState.selectedCell = new Coord(newRow, newCol);
				newState.grid[newRow][newCol].isSelected = true;

				return newState;
			}),

		// Check if the puzzle is complete and correct
		checkSolution: () =>
			update((state) => {
				const newState = checkSolution(state);
				return {
					...state,
					isComplete: newState.grid.every((row) =>
						row.every((cell) => cell.value !== null && !cell.isFlashing)
					),
				};
			}),

		// Auto-populate notes for empty cells
		applyAutoNotes: () =>
			update((state) => {
				const newState = { ...state };

				// For each empty cell
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						const cell = newState.grid[row][col];
						if (cell.value === null) {
							// Clear existing notes
							cell.notes.clear();

							for (let num = 1; num <= GRID_SIZE; num++) {
								// Check if number can be placed in this cell
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

		// Format elapsed time as MM:SS
		formatTime: (seconds: number) => {
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = seconds % 60;
			return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
		},

		// Initialize an empty grid for editing
		initializeEditingGrid: () => {
			update((state) => {
				const newState = { ...state };
				newState.grid = createInitialGrid();
				newState.isGameStarted = true;
				newState.isAuthoring = true;
				newState.startTime = Date.now();
				newState.timerInterval = setInterval(() => {
					update((state) => ({
						...state,
						elapsedTime: Math.floor((Date.now() - state.startTime!) / 1000)
					}));
				}, 1000);
				return newState;
			});
		},

		// Check if the edited puzzle has a unique solution
		checkEditingSolution: () => {
			let isUnique = false;
			update((state) => {
				// Convert the current grid to a format suitable for solution checking
				const puzzle = state.grid.map(row =>
					row.map(cell => cell.value)
				);
				isUnique = hasUniqueSolution(puzzle);
				return state;
			});
			return isUnique;
		},

		// Start solving mode for the edited puzzle
		startSolvingMode: () => {
			update((state) => {
				const newState = { ...state };
				// Mark all cells with values as initial
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

		// Reset the game state
		resetGame: () => {
			update((state) => {
				if (state.timerInterval !== null) {
					clearInterval(state.timerInterval);
				}
				return {
					...state,
					grid: createInitialGrid(),
					selectedCell: new Coord(0, 0),
					isPencilMode: false,
					isGameStarted: false,
					isAuthoring: false,
					undoStack: [],
					redoStack: [],
					difficulty: 'medium',
					initialGrid: [],
					isComplete: false,
					startTime: null,
					elapsedTime: 0,
					timerInterval: null,
					flashTimeout: null
				};
			});
		}
	};
}

function stringToGrid(str: string): (number | null)[][] {
	const grid = Array(GRID_SIZE)
		.fill(null)
		.map(() => Array(GRID_SIZE).fill(null));

	for (let i = 0; i < BOARD_SIZE; i++) {
		if (str[i] === '0') {
			continue;
		}

		const cell = Coord.fromIndex(i);
		grid[cell.row][cell.col] = parseInt(str[i]);
	}
	return grid;
}

// Generate a Sudoku puzzle of the specified difficulty
function generateSudokuPuzzle(difficulty: Difficulty): (number | null)[][] {

	// Start with a solved Sudoku grid
	const solvedGrid = generateSolvedGrid();

	// Create a copy of the solved grid
	const puzzle = solvedGrid.map((row) => [...row]) as (number | null)[][];

	// Determine how many cells to remove based on difficulty
	let cellsToRemove = 0;
	switch (difficulty) {
		case 'easy':
			cellsToRemove = 30; // 51 cells filled
			break;
		case 'medium':
			cellsToRemove = 40; // 41 cells filled
			break;
		case 'hard':
			cellsToRemove = 50; // 31 cells filled
			break;
		case 'expert':
			cellsToRemove = 55; // 26 cells filled
			break;
		case 'master':
			cellsToRemove = 60; // 21 cells filled
			break;
		case 'extreme':
			cellsToRemove = 65; // 16 cells filled
			break;
	}

	// Create a list of all positions
	const positions = [];
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			positions.push({ row, col });
		}
	}

	// Try removing cells one by one
	let removedCells = 0;
	let attempts = 0;
	let currentPosition = positions.length;
	const maxAttempts = 10000; // Prevent infinite loops

	while (removedCells < cellsToRemove && attempts < maxAttempts) {
		// Reshuffle when reaching end of positions
		if (currentPosition >= positions.length) {
			currentPosition = 0;
			// Fisher-Yates reshuffle
			for (let i = positions.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[positions[i], positions[j]] = [positions[j], positions[i]];
			}
		}

		const { row, col } = positions[currentPosition];

		// Only attempt removal if cell still contains value
		if (puzzle[row][col] !== null) {
			const tempValue = puzzle[row][col];
			puzzle[row][col] = null;

			if (hasUniqueSolution(puzzle)) {
				removedCells++;
			} else {
				puzzle[row][col] = tempValue;
			}
			attempts++;
		}

		currentPosition++;
	}

	const str = "080072100000000900000040008000005000900700000160900400000000350040300010208000604";
	// const str = "800000001020000070050813020210905087009070300400000002000306000700000009060080050";
	return stringToGrid(str);
}

// Check if a puzzle has a unique solution
function hasUniqueSolution(puzzle: (number | null)[][]): boolean {
	let solutionCount = 0;
	const maxSolutions = 2; // We only need to find up to 2 solutions

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

// Generate a solved Sudoku grid
function generateSolvedGrid(): number[][] {
	// Start with an empty grid
	const grid = Array(GRID_SIZE)
		.fill(null)
		.map(() => Array(GRID_SIZE).fill(0));

	// Fill the grid with a valid Sudoku solution
	fillGrid(grid);

	return grid;
}

// Fill the grid with a valid Sudoku solution
function fillGrid(grid: number[][]): boolean {
	// Find an empty cell
	let row = 0;
	let col = 0;
	let isEmpty = false;

	for (let i = 0; i < BOARD_SIZE; i++) {
		const cell = Coord.fromIndex(i);
		row = cell.row;
		col = cell.col;

		if (grid[row][col] === 0) {
			isEmpty = true;
			break;
		}
	}

	// If no empty cell is found, the grid is filled
	if (!isEmpty) {
		return true;
	}

	const numbers = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);

	// Shuffle the numbers for variety
	for (let i = numbers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[numbers[i], numbers[j]] = [numbers[j], numbers[i]];
	}

	for (const num of numbers) {
		// Check if the number can be placed in the cell
		if (isValidPlacement(grid, new Coord(row, col), num)) {
			// Place the number
			grid[row][col] = num;

			// Recursively fill the rest of the grid
			if (fillGrid(grid)) {
				return true;
			}

			// If placing the number doesn't lead to a solution, backtrack
			grid[row][col] = 0;
		}
	}

	// No solution found
	return false;
}

// Create the store
export const gameStore = createGameStore();

// Derived stores for convenience
export const selectedCell = derived(gameStore, ($gameStore) => $gameStore.selectedCell);
export const grid = derived(gameStore, ($gameStore) => $gameStore.grid);
export const isPencilMode = derived(gameStore, ($gameStore) => $gameStore.isPencilMode);
export const isGameStarted = derived(gameStore, ($gameStore) => $gameStore.isGameStarted);
export const canUndo = derived(gameStore, ($gameStore) => $gameStore.undoStack.length > 0);
export const canRedo = derived(gameStore, ($gameStore) => $gameStore.redoStack.length > 0);
export const canDelete = derived(
	gameStore,
	($gameStore) => {
		const cell = $gameStore.grid[$gameStore.selectedCell.row][$gameStore.selectedCell.col];
		return cell.value !== null && !cell.isInitial;
	}
);

// Add derived stores for new properties
export const difficulty = derived(gameStore, ($gameStore) => $gameStore.difficulty);
export const isComplete = derived(gameStore, ($gameStore) => $gameStore.isComplete);
export const initialGrid = derived(gameStore, ($gameStore) => $gameStore.initialGrid);
export const elapsedTime = derived(gameStore, ($gameStore) => $gameStore.elapsedTime);
export const formattedTime = derived(gameStore, ($gameStore) =>
	gameStore.formatTime($gameStore.elapsedTime)
);

// Utility functions for grid operations
function checkSolution(state: GameState): GameState {
	const newState = { ...state };
	const grid = newState.grid;

	// Check each cell
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			const cell = grid[row][col];
			if (cell.value === null) continue;

			// Check row
			for (let c = 0; c < GRID_SIZE; c++) {
				if (c !== col && grid[row][c].value === cell.value) {
					// Flash the conflicting cells
					cell.isFlashing = true;
					grid[row][c].isFlashing = true;
				}
			}

			// Check column
			for (let r = 0; r < GRID_SIZE; r++) {
				if (r !== row && grid[r][col].value === cell.value) {
					// Flash the conflicting cells
					cell.isFlashing = true;
					grid[r][col].isFlashing = true;
				}
			}

			const pos = new Coord(row, col);
			const { row: boxRow, col: boxCol } = pos.boxOrigin;
			for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
				for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
					if (r !== row && c !== col && grid[r][c].value === cell.value) {
						// Flash the conflicting cells
						cell.isFlashing = true;
						grid[r][c].isFlashing = true;
					}
				}
			}
		}
	}

	return newState;
}
