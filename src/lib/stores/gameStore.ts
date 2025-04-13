import { writable, derived } from 'svelte/store';

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
	selectedCell: { row: number; col: number };
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

enum Group {
	Row = 'row',
	Column = 'column',
	Box = 'box'
}

const BOX_SIZE = 3;
const GRID_SIZE = BOX_SIZE * BOX_SIZE;
const BOARD_SIZE = GRID_SIZE * GRID_SIZE;

function getBoxOrigin(cellRow: number, cellCol: number): { row: number, col: number } {
	return {
		row: Math.floor(cellRow / BOX_SIZE) * BOX_SIZE,
		col: Math.floor(cellCol / BOX_SIZE) * BOX_SIZE
	};
}

function toGridIndex(row: number, col: number): number {
	return row * GRID_SIZE + col;
}

function fromGridIndex(index: number): { row: number, col: number } {
	return {
		row: Math.floor(index / GRID_SIZE),
		col: index % GRID_SIZE
	};
}

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

// Helper function to check if a number can be placed in a cell
function isValidNumberPlacement(grid: number[][], row: number, col: number, value: number): boolean {
	const box = getBoxOrigin(row, col);
	for (let i = 0; i < GRID_SIZE; i++) {
		if ((i !== col && grid[row][i] === value) || (i !== row && grid[i][col] === value)) {
			return false;
		}
		const cell = getCellInBox(box, i);
		if (grid[cell.row][cell.col] === value) {
			return false;
		}
	}
	return true;
}

// Function to gather clues from a specific direction
function getClues(grid: Cell[][], row: number, col: number, direction: Group): Set<number> {
	const notes = new Set<number>();
	const box = getBoxOrigin(row, col);

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

		if (cell.value !== null) {
			notes.add(cell.value);
		} else {
			cell.notes.forEach(note => notes.add(note));
		}
	}

	return notes;
}

function applyUniqueNotes(grid: Cell[][], row: number, col: number, group: Group): boolean {
	const cell = grid[row][col];
	const clues = getClues(grid, row, col, group);
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

function processNakedSingle(grid: Cell[][], row: number, col: number): boolean {
	const cell = grid[row][col];
	if (cell.value !== null) return false;

	if (cell.notes.size === 1) {
		const note = cell.notes.values().next().value;
		console.log(`Naked single found at (${row},${col}), value: ${note}, only note in cell.`);
		return true; // Indicate that a naked single was found
	}

	return applyUniqueNotes(grid, row, col, Group.Row) || applyUniqueNotes(grid, row, col, Group.Column) || applyUniqueNotes(grid, row, col, Group.Box);
}

function applyNakedSingles(grid: Cell[][]) {
	let nakedSingles = 0;
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			if (processNakedSingle(grid, row, col)) {
				nakedSingles++;
			}
		}
	}
	console.log(`${nakedSingles} naked singles applied.`);
}

function getNakedPairInRow(grid: Cell[][], row: number, col: number): number | null {
	for (let c = col + 1; c < GRID_SIZE; c++) {
		if (grid[row][c].notes.size !== 2) continue;
		if (grid[row][c].notes.difference(grid[row][col].notes).size === 0) {
			return c;
		}
	}
	return null;
}

function getNakedPairInColumn(grid: Cell[][], row: number, col: number): number | null {
	for (let r = row + 1; r < GRID_SIZE; r++) {
		if (grid[r][col].notes.size !== 2) continue;
		if (grid[r][col].notes.difference(grid[row][col].notes).size === 0) {
			return r;
		}
	}
	return null;
}

function getNakedPairInBox(grid: Cell[][], row: number, col: number): { row: number, col: number } | null {
	const { row: boxRow, col: boxCol } = getBoxOrigin(row, col);
	for (let r = row + 1; r < boxRow + BOX_SIZE; r++) {
		for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
			if (grid[r][c].notes.size !== 2) continue;
			if (grid[r][c].notes.difference(grid[row][col].notes).size === 0) {
				return { row: r, col: c };
			}
		}
	}
	return null;
}

// given a set of cells, return if they are in the same box
function areCellsInSameBox(cells: { row: number, col: number }[]) {
	if (cells.length < 2) return true;

	const { row: boxRow, col: boxCol } = getBoxOrigin(cells[0].row, cells[0].col);
	for (const cell of cells) {
		const box = getBoxOrigin(cell.row, cell.col);
		if (box.row !== boxRow || box.col !== boxCol) {
			return false;
		}
	}
	return true;
}

function removeNotesInCell(grid: Cell[][], row: number, col: number, notes: Set<number>) {
	let notesRemoved = 0;
	const beforeNotes = [...grid[row][col].notes];

	notes.forEach(function (note) {
		if (grid[row][col].notes.delete(note)) {
			notesRemoved++;
		}
	});

	if (notesRemoved > 0) {
		console.log(`${notesRemoved} notes from cell (${row},${col}) removed, before: ${beforeNotes}, after: ${[...grid[row][col].notes]}`);
	}

	return notesRemoved;
}

// given a grid, a row and columns, return notes from all cells in the row except the columns
export function removeNotesInRow(grid: Cell[][], row: number, columns: number[], notes: Set<number>): number {
	console.log(`Removing notes ${[...notes]} from row (${row}).`);

	let totalNotesRemoved = 0;
	let cellsModified = 0;
	for (let c = 0; c < GRID_SIZE; c++) {
		if (columns.includes(c) || grid[row][c].value !== null) continue;

		const notesRemoved = removeNotesInCell(grid, row, c, notes);
		totalNotesRemoved += notesRemoved;
		cellsModified += notesRemoved > 0 ? 1 : 0;
	}

	console.log(`${totalNotesRemoved} notes removed from ${cellsModified} cells in row (${row}).`);
	return totalNotesRemoved;
}

// now do the same for the column and rows
export function removeNotesInColumn(grid: Cell[][], col: number, rows: number[], notes: Set<number>): number {
	console.log(`Removing notes ${[...notes]} from column (${col}).`);

	let totalNotesRemoved = 0;
	let cellsModified = 0;
	for (let r = 0; r < GRID_SIZE; r++) {
		if (rows.includes(r) || grid[r][col].value !== null) continue;

		const notesRemoved = removeNotesInCell(grid, r, col, notes);
		totalNotesRemoved += notesRemoved;
		cellsModified += notesRemoved > 0 ? 1 : 0;
	}

	console.log(`${totalNotesRemoved} notes removed from ${cellsModified} cells in column (${col}).`);
	return totalNotesRemoved;
}

export function removeNotesInBox(grid: Cell[][], cellInBox: { row: number, col: number },
	cells: number[], notes: Set<number>): number {
	const { row: boxRow, col: boxCol } = getBoxOrigin(cellInBox.row, cellInBox.col);

	console.log(`Removing notes ${[...notes]} from box (${boxRow},${boxCol}).`);

	let totalNotesRemoved = 0;
	let cellsModified = 0;
	for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
		for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
			if (cells.includes(toGridIndex(r, c)) || grid[r][c].value !== null) continue;

			const notesRemoved = removeNotesInCell(grid, r, c, notes);
			totalNotesRemoved += notesRemoved;
			cellsModified += notesRemoved > 0 ? 1 : 0;
		}
	}

	console.log(`${totalNotesRemoved} notes removed from ${cellsModified} cells in box (${boxRow},${boxCol}).`);
	return totalNotesRemoved;
}

function processNakedPairs(grid: Cell[][], row: number, col: number): { found: boolean, applied: boolean } {
	const cell = grid[row][col];
	if (cell.value !== null || cell.notes.size !== 2) return { found: false, applied: false };

	let pairFound = false;
	let totalNotesRemoved = 0;
	const pairCol = getNakedPairInRow(grid, row, col);
	if (pairCol !== null) {
		pairFound = true;
		console.log(`Naked pair found at row (${row}), columns (${col},${pairCol}), values: ${[...cell.notes]}.`);
		totalNotesRemoved += removeNotesInRow(grid, row, [col, pairCol], cell.notes);
		if (areCellsInSameBox([{ row, col }, { row, col: pairCol }])) {
			totalNotesRemoved += removeNotesInBox(grid, { row, col }, [toGridIndex(row, col), toGridIndex(row, pairCol)], cell.notes);
		}
	}

	const pairRow = getNakedPairInColumn(grid, row, col);
	if (pairRow !== null) {
		pairFound = true;
		console.log(`Naked pair found at column (${col}), rows (${row},${pairRow}), values: ${[...cell.notes]}.`);
		totalNotesRemoved += removeNotesInColumn(grid, col, [row, pairRow], cell.notes);
		if (areCellsInSameBox([{ row, col }, { row: pairRow, col }])) {
			totalNotesRemoved += removeNotesInBox(grid, { row, col }, [toGridIndex(row, col), toGridIndex(pairRow, col)], cell.notes);
		}
	}

	const pairBox = getNakedPairInBox(grid, row, col);
	if (pairBox !== null) {
		pairFound = true;
		console.log(`Naked pair found at (${row},${col}) and (${pairBox.row},${pairBox.col}), values: ${[...cell.notes]}.`);
		totalNotesRemoved += removeNotesInBox(grid, pairBox, [toGridIndex(row, col), toGridIndex(pairBox.row, pairBox.col)], cell.notes);
	}

	return { found: pairFound, applied: totalNotesRemoved > 0 };
}

function applyNakedPairs(grid: Cell[][]) {
	let nakedPairs = 0;
	let appliedPairs = 0;
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			const { found, applied } = processNakedPairs(grid, row, col);
			if (found) {
				nakedPairs++;
			}
			if (applied) {
				appliedPairs++;
			}
		}
	}
	console.log(`${nakedPairs} naked pairs found, ${appliedPairs} applied.`);
}

// Create the initial grid
function createInitialGrid(): Cell[][] {
	return Array(GRID_SIZE)
		.fill(null)
		.map(() =>
			Array(GRID_SIZE)
				.fill(null)
				.map(() => ({
					value: null,
					isSelected: false,
					notes: new Set<number>(),
					isInitial: false,
					isFlashing: false,
					isHighlighted: false
				}))
		);
}

// Create the game store
function createGameStore() {
	const { subscribe, set, update } = writable({
		grid: createInitialGrid(),
		selectedCell: { row: 0, col: 0 },
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
		row: number,
		col: number,
		value: number
	): { row: number; col: number }[] {
		const conflictingCells: { row: number; col: number }[] = [];

		// Check row
		for (let c = 0; c < GRID_SIZE; c++) {
			if (c !== col) {
				const cellValue = typeof grid[row][c] === 'number'
					? grid[row][c] as number
					: (grid[row][c] as { value: number | null }).value;
				if (cellValue === value) {
					conflictingCells.push({ row, col: c });
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
					conflictingCells.push({ row: r, col });
				}
			}
		}

		const { row: boxRow, col: boxCol } = getBoxOrigin(row, col);
		for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
			for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
				if (r !== row || c !== col) {
					const cellValue = typeof grid[r][c] === 'number'
						? grid[r][c] as number
						: (grid[r][c] as { value: number | null }).value;
					if (cellValue === value) {
						conflictingCells.push({ row: r, col: c });
					}
				}
			}
		}

		return conflictingCells;
	}

	// Helper function to check for conflicts
	function hasConflict(grid: Cell[][], row: number, col: number, value: number): boolean {
		return findConflictingCells(grid, row, col, value).length > 0;
	}

	// Helper function to flash conflicting cells
	function flashConflictingCells(grid: Cell[][], row: number, col: number, value: number) {
		// Clear any existing flash timeout
		update(state => {
			if (state.flashTimeout !== null) {
				clearTimeout(state.flashTimeout);
			}
			return state;
		});

		// Find all conflicting cells
		const conflictingCells = findConflictingCells(grid, row, col, value);

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
				let firstEmptyCell = { row: 0, col: 0 };
				let found = false;

				for (let r = 0; r < GRID_SIZE && !found; r++) {
					for (let c = 0; c < GRID_SIZE && !found; c++) {
						if (newState.grid[r][c].value === null) {
							firstEmptyCell = { row: r, col: c };
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
				let firstEmptyCell = { row: 0, col: 0 };
				let found = false;

				for (let r = 0; r < GRID_SIZE && !found; r++) {
					for (let c = 0; c < GRID_SIZE && !found; c++) {
						if (newState.grid[r][c].value === null) {
							firstEmptyCell = { row: r, col: c };
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
				newState.selectedCell = { row, col };
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
					selectedCell: { ...state.selectedCell }
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
					selectedCell: { ...previousState.selectedCell },
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
					selectedCell: { ...state.selectedCell }
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
					selectedCell: { ...nextState.selectedCell },
					undoStack: [...state.undoStack, currentState],
					redoStack: newRedoStack
				};
			}),

		// Cell manipulation
		setCellValue: (value: number | null) =>
			update((state) => {
				const { row, col } = state.selectedCell;

				// Don't allow updating initialized cells
				if (state.grid[row][col].isInitial) {
					return state;
				}

				// Create a deep copy of the current state for undo
				const currentState: GameState = {
					grid: state.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: { ...state.selectedCell }
				};

				// Create a new state object for modifications
				const newState = { ...state };

				// Handle pencil mode
				if (state.isPencilMode) {
					if (value !== null) {
						// Check for conflicts before adding the note
						const hasConflictValue = hasConflict(newState.grid, row, col, value);
						if (hasConflictValue) {
							// Flash conflicting cells instead of adding the note
							flashConflictingCells(newState.grid, row, col, value);
							return state; // Return original state without changes
						}

						// Toggle the note
						if (newState.grid[row][col].notes.has(value)) {
							newState.grid[row][col].notes.delete(value);
						} else {
							newState.grid[row][col].notes.add(value);
						}
					} else {
						// Clear all notes
						newState.grid[row][col].notes.clear();
					}
				}
				// Handle pen mode
				else {
					if (value !== null) {
						// Check for conflicts before setting the value
						const hasValueConflict = hasConflict(newState.grid, row, col, value);
						if (hasValueConflict) {
							// Flash conflicting cells instead of setting the value
							flashConflictingCells(newState.grid, row, col, value);
							return state; // Return original state without changes
						}

						// Set the value and clear notes
						newState.grid[row][col].value = value;
						newState.grid[row][col].notes.clear();

						// Remove this value from notes in the same row
						for (let c = 0; c < GRID_SIZE; c++) {
							if (c !== col) {
								newState.grid[row][c].notes.delete(value);
							}
						}

						// Remove this value from notes in the same column
						for (let r = 0; r < GRID_SIZE; r++) {
							if (r !== row) {
								newState.grid[r][col].notes.delete(value);
							}
						}

						const { row: boxRow, col: boxCol } = getBoxOrigin(row, col);
						for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
							for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
								if (r !== row || c !== col) {
									newState.grid[r][c].notes.delete(value);
								}
							}
						}
					} else {
						// Clear the cell
						newState.grid[row][col].value = null;
					}
				}

				// If we've made it here, we've made a valid change
				return {
					...newState,
					undoStack: [...state.undoStack, currentState],
					redoStack: [] // Clear redo stack when new action is performed
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
				newState.selectedCell = { row: newRow, col: newCol };
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
								if (!hasConflict(newState.grid, row, col, num)) {
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
				applyNakedSingles(newState.grid);
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
					selectedCell: { row: 0, col: 0 },
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

		const cell = fromGridIndex(i);
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
			if (isValidNumberPlacement(puzzle as number[][], row, col, num)) {
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
		const cell = fromGridIndex(i);
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
		if (isValidNumberPlacement(grid, row, col, num)) {
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

			const { row: boxRow, col: boxCol } = getBoxOrigin(row, col);
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
