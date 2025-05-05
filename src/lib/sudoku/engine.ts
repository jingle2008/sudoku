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
export function isValidPlacement(grid: Grid, pos: Coord, value: number): boolean {
    const { row, col } = pos;
    for (let i = 0; i < GRID_SIZE; i++) {
        if ((i !== col && grid[row][i] === value) || (i !== row && grid[i][col] === value)) {
            return false;
        }
    }

    const { row: boxRow, col: boxCol } = pos.boxOrigin;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
            if (grid[r][c] === value && (r !== pos.row || c !== pos.col)) return false;
        }
    }

    return true;
}

/**
 * Solve the Sudoku puzzle using backtracking
 * @param grid - The Sudoku grid to solve (modified in-place)
 * @param index - Current index in the grid (defaults to 0)
 * @returns True if solved, false otherwise
 */
export function solve(grid: Grid, index = 0): boolean {
    if (index === GRID_SIZE * GRID_SIZE) return true;

    const { row, col } = Coord.fromIndex(index);
    if (grid[row][col] !== null) return solve(grid, index + 1);

    for (let val = 1; val <= 9; val++) {
        if (!isValidPlacement(grid, new Coord(row, col), val)) continue;

        grid[row][col] = val;
        if (solve(grid, index + 1)) return true;
        grid[row][col] = null;
    }
    return false;
}

/**
 * Check if the given Sudoku puzzle has a unique solution
 * @param puzzle - The Sudoku puzzle grid
 * @returns True if exactly one unique solution exists, false otherwise
 */
export function hasUniqueSolution(puzzle: Grid): boolean {
	let count = 0;

	function dfs(g: Grid, index = 0) {
		if (count > 1) return;

		if (index === 81) { count++; return; }
		const r = ~~(index / 9), c = index % 9;
		if (g[r][c] !== null) return dfs(g, index + 1);

		for (let v = 1; v <= 9; v++) {
			if (!isValidPlacement(g, new Coord(r, c), v)) continue;
			g[r][c] = v; dfs(g, index + 1); g[r][c] = null;
		}
	}

	dfs(puzzle.map(row => [...row]));

	return count === 1;
}