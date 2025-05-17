/**
 * Generic bit-mask-based Sudoku backtracking solver for both (number | null)[][] and number[][] grids.
 * Allows custom empty value and cell accessors for maximum reuse.
 */

import { GRID_SIZE, BOX_SIZE } from "./constants";

/**
 * Bit-mask-based backtracking solver.
 * @param grid - The Sudoku grid (can be number[][] or (number|null)[][])
 * @param isEmpty - Function to check if a cell is empty
 * @param setCell - Function to set a cell value
 * @param onSolution - Callback called when a solution is found
 * @param maxSolutions - Optional: stop after this many solutions
 * @returns True if a solution was found (for solve), or number of solutions (for counting)
 */
export function bitmaskBacktrack<T>(
    grid: T[][],
    isEmpty: (cell: T) => boolean,
    setCell: (row: number, col: number, value: number | null) => void,
    onSolution: () => boolean | void,
    maxSolutions?: number
): boolean | number {
    let solutionCount = 0;
    let found = false;

    const N = GRID_SIZE;
    const rowMask = new Array(N).fill(0);
    const colMask = new Array(N).fill(0);
    const boxMask = new Array(N).fill(0);

    // Initialize masks from grid
    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            const cell = grid[row][col];
            if (!isEmpty(cell)) {
                const val = typeof cell === "number" ? cell : (cell as any);
                const bit = 1 << (val - 1);
                rowMask[row] |= bit;
                colMask[col] |= bit;
                const box = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
                boxMask[box] |= bit;
            }
        }
    }

    function findMRVCell(): { row: number, col: number, legal: number[] } | null {
        let minOptions = N + 1;
        let best: { row: number, col: number, legal: number[] } | null = null;
        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                if (isEmpty(grid[row][col])) {
                    // Compute legal values for this cell
                    const box = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
                    const presentMask = rowMask[row] | colMask[col] | boxMask[box];
                    const legal: number[] = [];
                    for (let v = 1; v <= N; v++) {
                        if ((presentMask & (1 << (v - 1))) === 0) legal.push(v);
                    }
                    if (legal.length < minOptions) {
                        minOptions = legal.length;
                        best = { row, col, legal };
                        if (minOptions === 1) return best;
                    }
                }
            }
        }
        return best;
    }

    function dfs(): boolean {
        if (maxSolutions && solutionCount >= maxSolutions) return false;
        const mrv = findMRVCell();
        if (!mrv) {
            solutionCount++;
            const res = onSolution();
            if (res === true) found = true;
            return res === true;
        }
        const { row, col, legal } = mrv;
        const box = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
        // Shuffle for variety
        const shuffled = legal.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        for (const val of shuffled) {
            const bit = 1 << (val - 1);
            if ((rowMask[row] & bit) || (colMask[col] & bit) || (boxMask[box] & bit)) continue;

            setCell(row, col, val);
            rowMask[row] |= bit;
            colMask[col] |= bit;
            boxMask[box] |= bit;

            if (dfs()) return true;

            setCell(row, col, isEmpty(grid[row][col]) ? null : 0); // Reset to empty
            rowMask[row] &= ~bit;
            colMask[col] &= ~bit;
            boxMask[box] &= ~bit;
        }
        return false;
    }

    dfs();
    return maxSolutions ? solutionCount : found;
}
