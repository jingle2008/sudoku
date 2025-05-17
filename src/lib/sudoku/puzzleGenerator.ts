/**
 * @module puzzleGenerator
 * Functions for generating Sudoku puzzles of varying difficulty.
 */
import { GRID_SIZE, BOARD_SIZE } from "./constants";
import { Coord } from "./coord";
import { isValidPlacement, hasUniqueSolution } from "./engine";
import type { Grid } from "./engine";
import type { Difficulty } from "$lib/stores/gameStore";

/**
 * Convert a string representation to a Grid
 * @param str - String representation of a Sudoku grid (0 for empty cells)
 * @returns A Grid representation
 */
export function stringToGrid(str: string): Grid {
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

/**
 * Get the number of cells to remove based on difficulty
 * @param difficulty - The difficulty level
 * @returns Number of cells to remove
 */
function getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
        case 'easy':
            return 30; // 51 cells filled
        case 'medium':
            return 40; // 41 cells filled
        case 'hard':
            return 50; // 31 cells filled
        case 'expert':
            return 55; // 26 cells filled
        case 'master':
            return 60; // 21 cells filled
        case 'extreme':
            return 65; // 16 cells filled
    }
}

/**
 * Generate a solved Sudoku grid
 * @returns A completely filled valid Sudoku grid
 */
export function generateSolvedGrid(): number[][] {
    // Start with an empty grid
    const grid = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0));

    // Fill the grid with a valid Sudoku solution
    fillGrid(grid);

    return grid;
}

/**
 * Fill the grid with a valid Sudoku solution using backtracking
 * @param grid - The grid to fill
 * @returns True if the grid was successfully filled
 */
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
        if (isValidPlacement(grid as Grid, new Coord(row, col), num)) {
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

/**
 * Generate a Sudoku puzzle of the specified difficulty
 * @param difficulty - The difficulty level
 * @returns A Sudoku puzzle grid
 */
export function generateSudokuPuzzle(difficulty: Difficulty): Grid {
    // Start with a solved Sudoku grid
    const solvedGrid = generateSolvedGrid();

    // Create a copy of the solved grid
    const puzzle = solvedGrid.map((row) => [...row]) as Grid;

    // Determine how many cells to remove based on difficulty
    const cellsToRemove = getCellsToRemove(difficulty);

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

    return puzzle;
}
