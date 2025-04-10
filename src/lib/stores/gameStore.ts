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

// Helper function to check if a number can be placed in a cell
function isValidNumberPlacement(grid: number[][], row: number, col: number, value: number): boolean {
	// Check row
	for (let c = 0; c < 9; c++) {
		if (c !== col && grid[row][c] === value) {
			return false;
		}
	}

	// Check column
	for (let r = 0; r < 9; r++) {
		if (r !== row && grid[r][col] === value) {
			return false;
		}
	}

	// Check 3x3 box
	const boxRow = Math.floor(row / 3) * 3;
	const boxCol = Math.floor(col / 3) * 3;
	for (let r = boxRow; r < boxRow + 3; r++) {
		for (let c = boxCol; c < boxCol + 3; c++) {
			if ((r !== row || c !== col) && grid[r][c] === value) {
				return false;
			}
		}
	}

	return true;
}

// Create the initial grid
function createInitialGrid(): Cell[][] {
	return Array(9)
		.fill(null)
		.map(() =>
			Array(9)
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
		for (let c = 0; c < 9; c++) {
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
		for (let r = 0; r < 9; r++) {
			if (r !== row) {
				const cellValue = typeof grid[r][col] === 'number'
					? grid[r][col] as number
					: (grid[r][col] as { value: number | null }).value;
				if (cellValue === value) {
					conflictingCells.push({ row: r, col });
				}
			}
		}

		// Check 3x3 box
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;
		for (let r = boxRow; r < boxRow + 3; r++) {
			for (let c = boxCol; c < boxCol + 3; c++) {
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
			const newState = {...state};
			conflictingCells.forEach(({row, col}) => {
				newState.grid[row][col].isFlashing = true;
			});
			return newState;
		});
		
		// Set a timeout to remove the flashing after 1 second
		const flashTimeout = setTimeout(() => {
			update(state => {
				const newState = {...state};
				conflictingCells.forEach(({row, col}) => {
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
			for (let row = 0; row < 9; row++) {
				for (let col = 0; col < 9; col++) {
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
				
				for (let r = 0; r < 9 && !found; r++) {
					for (let c = 0; c < 9 && !found; c++) {
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
				for (let row = 0; row < 9; row++) {
					for (let col = 0; col < 9; col++) {
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
				
				for (let r = 0; r < 9 && !found; r++) {
					for (let c = 0; c < 9 && !found; c++) {
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
				for (let r = 0; r < 9; r++) {
					for (let c = 0; c < 9; c++) {
						newState.grid[r][c].isHighlighted = false;
					}
				}
				
				// Select new cell
				newState.selectedCell = { row, col };
				newState.grid[row][col].isSelected = true;
				
				// Highlight cells with the same value
				const selectedValue = newState.grid[row][col].value;
				if (selectedValue !== null) {
					for (let r = 0; r < 9; r++) {
						for (let c = 0; c < 9; c++) {
							if (newState.grid[r][c].value === selectedValue) {
								newState.grid[r][c].isHighlighted = true;
							}
						}
					}
				}
				
				return newState;
			}),

		// Game actions
		saveState: () =>
			update((state) => {
				const currentState: GameState = {
					grid: state.grid.map((row) =>
						row.map((cell) => ({
							...cell,
							notes: new Set(cell.notes)
						}))
					),
					selectedCell: { ...state.selectedCell }
				};
				return {
					...state,
					undoStack: [...state.undoStack, currentState],
					redoStack: [] // Clear redo stack when new action is performed
				};
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
						for (let c = 0; c < 9; c++) {
							if (c !== col) {
								newState.grid[row][c].notes.delete(value);
							}
						}

						// Remove this value from notes in the same column
						for (let r = 0; r < 9; r++) {
							if (r !== row) {
								newState.grid[r][col].notes.delete(value);
							}
						}

						// Remove this value from notes in the same 3x3 box
						const boxRow = Math.floor(row / 3) * 3;
						const boxCol = Math.floor(col / 3) * 3;
						for (let r = boxRow; r < boxRow + 3; r++) {
							for (let c = boxCol; c < boxCol + 3; c++) {
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
						newRow = Math.min(8, row + 1);
						break;
					case 'left':
						newCol = Math.max(0, col - 1);
						break;
					case 'right':
						newCol = Math.min(8, col + 1);
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
		autoNotes: () =>
			update((state) => {
				const newState = { ...state };
				
				// For each empty cell
				for (let row = 0; row < 9; row++) {
					for (let col = 0; col < 9; col++) {
						const cell = newState.grid[row][col];
						if (cell.value === null) {
							// Clear existing notes
							cell.notes.clear();
							
							// Check each possible number (1-9)
							for (let num = 1; num <= 9; num++) {
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
				for (let row = 0; row < 9; row++) {
					for (let col = 0; col < 9; col++) {
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
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			positions.push({ row, col });
		}
	}

	// Shuffle the positions
	for (let i = positions.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[positions[i], positions[j]] = [positions[j], positions[i]];
	}

	// Try removing cells one by one
	let removedCells = 0;
	let attempts = 0;
	const maxAttempts = 1000; // Prevent infinite loops

	while (removedCells < cellsToRemove && attempts < maxAttempts) {
		const { row, col } = positions[removedCells];
		const tempValue = puzzle[row][col];
		puzzle[row][col] = null;

		// Check if the puzzle still has a unique solution
		if (hasUniqueSolution(puzzle)) {
			removedCells++;
		} else {
			// If not unique, restore the value and try next position
			puzzle[row][col] = tempValue;
		}
		attempts++;
	}

	return puzzle;
}

// Check if a puzzle has a unique solution
function hasUniqueSolution(puzzle: (number | null)[][]): boolean {
	let solutionCount = 0;
	const maxSolutions = 2; // We only need to find up to 2 solutions

	function solve(puzzle: (number | null)[][], row: number, col: number): boolean {
		if (solutionCount >= maxSolutions) return false;
		if (row === 9) {
			solutionCount++;
			return solutionCount < maxSolutions;
		}
		if (col === 9) return solve(puzzle, row + 1, 0);
		if (puzzle[row][col] !== null) return solve(puzzle, row, col + 1);

		for (let num = 1; num <= 9; num++) {
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
	const grid = Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));

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

	for (let i = 0; i < 81; i++) {
		row = Math.floor(i / 9);
		col = i % 9;

		if (grid[row][col] === 0) {
			isEmpty = true;
			break;
		}
	}

	// If no empty cell is found, the grid is filled
	if (!isEmpty) {
		return true;
	}

	// Try numbers 1-9 in the empty cell
	const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			const cell = grid[row][col];
			if (cell.value === null) continue;

			// Check row
			for (let c = 0; c < 9; c++) {
				if (c !== col && grid[row][c].value === cell.value) {
					// Flash the conflicting cells
					cell.isFlashing = true;
					grid[row][c].isFlashing = true;
				}
			}

			// Check column
			for (let r = 0; r < 9; r++) {
				if (r !== row && grid[r][col].value === cell.value) {
					// Flash the conflicting cells
					cell.isFlashing = true;
					grid[r][col].isFlashing = true;
				}
			}

			// Check 3x3 box
			const boxRow = Math.floor(row / 3) * 3;
			const boxCol = Math.floor(col / 3) * 3;
			for (let r = boxRow; r < boxRow + 3; r++) {
				for (let c = boxCol; c < boxCol + 3; c++) {
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
