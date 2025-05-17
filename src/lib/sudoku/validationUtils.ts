/**
 * @module validationUtils
 * Utilities for validating Sudoku grid states and checking for conflicts.
 */
import { BOX_SIZE, GRID_SIZE } from "./constants";
import { Coord } from "./coord";
import type { Cell } from "$lib/sudoku/types";
import type { Grid } from "./engine";

/**
 * Find conflicting cells when placing a value
 * @param grid - The Sudoku grid
 * @param pos - The coordinate position to check
 * @param value - The number to place
 * @returns Array of coordinates with conflicting values
 */
export function findConflictingCells<T extends { value: number | null } | number>(
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

    // Check box
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

/**
 * Check if placing a value would create a conflict
 * @param grid - The Sudoku grid
 * @param pos - The coordinate position to check
 * @param value - The number to place
 * @returns True if there is a conflict, false otherwise
 */
export function hasConflict<T extends { value: number | null } | number>(
    grid: T[][],
    pos: Coord,
    value: number
): boolean {
    return findConflictingCells(grid, pos, value).length > 0;
}

/**
 * Flash conflicting cells to highlight errors
 * @param grid - The Sudoku grid
 * @param pos - The coordinate position to check
 * @param value - The number to place
 * @returns Array of coordinates that were flashed
 */
export function flashConflictingCells(
    grid: Cell[][],
    pos: Coord,
    value: number
): Coord[] {
    // Find all conflicting cells
    const conflictingCells = findConflictingCells(grid, pos, value);

    // If no conflicts, return early
    if (conflictingCells.length === 0) {
        return [];
    }

    // Flash the conflicting cells
    conflictingCells.forEach(({ row, col }) => {
        grid[row][col].isFlashing = true;
    });

    return conflictingCells;
}

/**
 * Check if the entire grid is valid (no conflicts)
 * @param grid - The Sudoku grid
 * @returns True if the grid is valid, false otherwise
 */
export function isGridValid(grid: Grid): boolean {
    // Check each cell
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const value = grid[row][col];
            if (value !== null) {
                // Temporarily set to null to check if placing it would create a conflict
                grid[row][col] = null;
                const hasConflicts = hasConflict(grid, new Coord(row, col), value);
                grid[row][col] = value; // Restore the value
                
                if (hasConflicts) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

/**
 * Check if the grid is complete (all cells filled and valid)
 * @param grid - The Sudoku grid
 * @returns True if the grid is complete and valid, false otherwise
 */
export function isGridComplete(grid: Grid): boolean {
    // Check if all cells are filled
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === null) {
                return false;
            }
        }
    }
    
    // Check if the grid is valid
    return isGridValid(grid);
}

/**
 * Check the solution of a game grid and mark conflicts
 * @param grid - The game grid
 * @returns True if the solution is valid, false otherwise
 */
export function checkSolution(grid: Cell[][]): boolean {
    let isValid = true;

    // Clear all flashing states first
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col].isFlashing = false;
        }
    }

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
                    isValid = false;
                }
            }

            // Check column
            for (let r = 0; r < GRID_SIZE; r++) {
                if (r !== row && grid[r][col].value === cell.value) {
                    // Flash the conflicting cells
                    cell.isFlashing = true;
                    grid[r][col].isFlashing = true;
                    isValid = false;
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
                        isValid = false;
                    }
                }
            }
        }
    }

    return isValid;
}

/**
 * Check if the grid is complete (all cells filled) and valid
 * @param grid - The game grid
 * @returns True if the grid is complete and valid, false otherwise
 */
export function isGameComplete(grid: Cell[][]): boolean {
    // Check if all cells are filled
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col].value === null) {
                return false;
            }
        }
    }
    
    // Check if the solution is valid
    return checkSolution(grid);
}
