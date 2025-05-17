/**
 * @module engine
 * Core Sudoku solving algorithms and validation utilities.
 */
import { BOX_SIZE, GRID_SIZE } from "./constants";
import { Coord } from "./coord";

export type Grid = (number | null)[][];

/**
 * Check if placing a given value at a position in the grid is valid
 * @param grid - The Sudoku grid
 * @param pos - The coordinate position to check
 * @param value - The number to place
 * @returns True if the placement is valid, false otherwise
 */
export function isValidPlacement(
    grid: Grid,
    pos: Coord,
    value: number
): boolean {
    const { row, col } = pos;
    for (let i = 0; i < GRID_SIZE; i++) {
        if ((i !== col && grid[row][i] === value) || (i !== row && grid[i][col] === value)) {
            return false;
        }
    }

    const { row: boxRow, col: boxCol } = pos.boxOrigin;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
            if (grid[r][c] === value && (r !== pos.row || c !== pos.col)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Internal backtracking function for solving and solution counting.
 * @param grid - The Sudoku grid (modified in-place)
 * @param index - Current index in the grid (defaults to 0)
 * @param onSolution - Callback called when a solution is found
 * @param maxSolutions - Optional: stop after this many solutions
 * @returns True if a solution was found (for solve), or number of solutions (for counting)
 */
export function getLegalValues(grid: Grid, row: number, col: number): number[] {
    const present = new Set<number>();
    for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[row][i] !== null) present.add(grid[row][i]!);
        if (grid[i][col] !== null) present.add(grid[i][col]!);
    }
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
            if (grid[r][c] !== null) present.add(grid[r][c]!);
        }
    }
    const legal: number[] = [];
    for (let v = 1; v <= GRID_SIZE; v++) {
        if (!present.has(v)) legal.push(v);
    }
    return legal;
}

export function findMRVCell(grid: Grid): { row: number, col: number, legal: number[] } | null {
    let minOptions = GRID_SIZE + 1;
    let best: { row: number, col: number, legal: number[] } | null = null;
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === null) {
                const legal = getLegalValues(grid, row, col);
                if (legal.length < minOptions) {
                    minOptions = legal.length;
                    best = { row, col, legal };
                    if (minOptions === 1) return best; // can't do better
                }
            }
        }
    }
    return best;
}

import { bitmaskBacktrack } from "./bitmaskSolver";

function backtrack(
    grid: Grid,
    index: number,
    onSolution: () => boolean | void,
    maxSolutions?: number
): boolean | number {
    return bitmaskBacktrack<number | null>(
        grid,
        (cell) => cell === null,
        (row, col, value) => { grid[row][col] = value; },
        onSolution,
        maxSolutions
    );
}

/**
 * Solve the Sudoku puzzle using backtracking
 * @param grid - The Sudoku grid to solve (modified in-place)
 * @param index - Current index in the grid (defaults to 0)
 * @returns True if solved, false otherwise
 */
export function solve(grid: Grid, index = 0): boolean {
    return !!backtrack(grid, index, () => true);
}

/**
 * Check if the given Sudoku puzzle has a unique solution
 * @param puzzle - The Sudoku puzzle grid
 * @returns True if exactly one unique solution exists, false otherwise
 */
export function hasUniqueSolution(puzzle: Grid): boolean {
    // Use a copy to avoid mutating the original puzzle
    const gridCopy: Grid = puzzle.map(row => [...row]);
    const count = backtrack(gridCopy, 0, () => {}, 2) as number;
    return count === 1;
}
