/**
 * @module solverStrategies
 * Implementation of human-like Sudoku solving strategies.
 */
import { BOX_SIZE, GRID_SIZE, Group } from "./constants";
import { Coord } from "./coord";
import type { Cell } from "$lib/stores/gameStore";

/**
 * Removes notes from every *empty* cell in the supplied coordinates list.
 * @param grid - The Sudoku grid
 * @param targets - List of coordinates to check
 * @param notes - Set of notes to remove
 * @returns Total notes removed
 */
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

/**
 * Remove notes from cells in the same row
 * @param grid - The Sudoku grid
 * @param anchor - The anchor coordinate
 * @param skips - Coordinates to skip
 * @param notes - Notes to remove
 * @returns Number of notes removed
 */
export function removeNotesInRow(
    grid: Cell[][],
    anchor: Coord,
    skips: Coord[],
    notes: Set<number>
): number {
    console.log(`Removing notes ${[...notes]} from row.`);
    const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Row, skips), notes);
    console.log(`${removed} notes removed from cells in row.`);
    return removed;
}

/**
 * Remove notes from cells in the same column
 * @param grid - The Sudoku grid
 * @param anchor - The anchor coordinate
 * @param skips - Coordinates to skip
 * @param notes - Notes to remove
 * @returns Number of notes removed
 */
export function removeNotesInColumn(
    grid: Cell[][],
    anchor: Coord,
    skips: Coord[],
    notes: Set<number>
): number {
    console.log(`Removing notes ${[...notes]} from column.`);
    const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Column, skips), notes);
    console.log(`${removed} notes removed from cells in column.`);
    return removed;
}

/**
 * Remove notes from cells in the same box
 * @param grid - The Sudoku grid
 * @param anchor - The anchor coordinate
 * @param skips - Coordinates to skip
 * @param notes - Notes to remove
 * @returns Number of notes removed
 */
export function removeNotesInBox(
    grid: Cell[][],
    anchor: Coord,
    skips: Coord[],
    notes: Set<number>
): number {
    console.log(`Removing notes ${[...notes]} from box.`);
    const removed = removeNotesFromCells(grid, anchor.coordsFor(Group.Box, skips), notes);
    console.log(`${removed} notes removed from cells in box.`);
    return removed;
}

/**
 * Find a naked pair in the same row
 * @param grid - The Sudoku grid
 * @param pos - The position to check from
 * @returns Coordinate of the paired cell, or null if not found
 */
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

/**
 * Find a naked pair in the same column
 * @param grid - The Sudoku grid
 * @param pos - The position to check from
 * @returns Coordinate of the paired cell, or null if not found
 */
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

/**
 * Find a naked pair in the same box
 * @param grid - The Sudoku grid
 * @param pos - The position to check from
 * @returns Coordinate of the paired cell, or null if not found
 */
export function getNakedPairInBox(grid: Cell[][], pos: Coord): Coord | null {
    const { row, col } = pos;
    const { row: boxRow, col: boxCol } = pos.boxOrigin;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
            // Skip the original cell and cells before it in the box
            if ((r === row && c <= col) || (r < row)) continue;
            if (grid[r][c].notes.size !== 2) continue;
            if (grid[r][c].notes.difference(grid[row][col].notes).size === 0) {
                return new Coord(r, c);
            }
        }
    }
    return null;
}

/**
 * Check if cells are in the same box
 * @param cells - Array of coordinates
 * @returns True if all cells are in the same box
 */
export function areCellsInSameBox(cells: Coord[]): boolean {
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

/**
 * Process naked pairs for a specific cell
 * @param grid - The Sudoku grid
 * @param pos - The position to check
 * @returns Object indicating if a pair was found and if notes were removed
 */
export function processNakedPairs(grid: Cell[][], pos: Coord): { found: boolean, applied: boolean } {
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

/**
 * Apply naked pairs strategy to the entire grid
 * @param grid - The Sudoku grid
 * @returns Object with counts of pairs found and applied
 */
export function applyNakedPairs(grid: Cell[][]): { nakedPairs: number, appliedPairs: number } {
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
    return { nakedPairs, appliedPairs };
}

/**
 * Function to gather clues from a specific direction
 * @param grid - The Sudoku grid
 * @param pos - The position to check from
 * @param direction - The direction to check (row, column, or box)
 * @returns Set of numbers found in the direction
 */
export function getClues(grid: Cell[][], pos: Coord, direction: Group): Set<number> {
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
            const boxIndex = Math.floor(i / BOX_SIZE) * BOX_SIZE + (i % BOX_SIZE);
            const boxRow = box.row + Math.floor(boxIndex / BOX_SIZE);
            const boxCol = box.col + (boxIndex % BOX_SIZE);
            if (boxRow === row && boxCol === col) continue;
            cell = grid[boxRow][boxCol];
        }

        if (cell.value !== null) {
            notes.add(cell.value);
        } else {
            cell.notes.forEach(note => notes.add(note));
        }
    }

    return notes;
}

/**
 * Apply unique notes strategy for a cell in a specific group
 * @param grid - The Sudoku grid
 * @param pos - The position to check
 * @param group - The group to check (row, column, or box)
 * @returns True if a naked single was found
 */
export function applyUniqueNotes(grid: Cell[][], pos: Coord, group: Group): boolean {
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

/**
 * Process naked single for a specific cell
 * @param grid - The Sudoku grid
 * @param pos - The position to check
 * @returns True if a naked single was found
 */
export function processNakedSingle(grid: Cell[][], pos: Coord): boolean {
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

/**
 * Apply naked singles strategy to the entire grid
 * @param grid - The Sudoku grid
 * @returns Number of naked singles found
 */
export function processNakedSingles(grid: Cell[][]): number {
    let nakedSingles = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (processNakedSingle(grid, new Coord(row, col))) {
                nakedSingles++;
            }
        }
    }
    console.log(`${nakedSingles} naked singles applied.`);
    return nakedSingles;
}

/**
 * Remove matching notes from cells in the same row, column, and box
 * @param grid - The Sudoku grid
 * @param pos - The position of the cell with a value
 * @param value - The value to remove from notes
 */
export function removeMatchingNotes(grid: Cell[][], pos: Coord, value: number): void {
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

/**
 * Auto-populate notes for all empty cells
 * @param grid - The Sudoku grid
 */
export function applyAutoNotes(grid: Cell[][]): void {
    // For each empty cell
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = grid[row][col];
            if (cell.value === null) {
                // Clear existing notes
                cell.notes.clear();

                // Check each possible number
                for (let num = 1; num <= GRID_SIZE; num++) {
                    // Check if this number already exists in the same row, column, or box
                    let canPlace = true;
                    
                    // Check row
                    for (let c = 0; c < GRID_SIZE; c++) {
                        if (c !== col && grid[row][c].value === num) {
                            canPlace = false;
                            break;
                        }
                    }
                    
                    // Check column
                    if (canPlace) {
                        for (let r = 0; r < GRID_SIZE; r++) {
                            if (r !== row && grid[r][col].value === num) {
                                canPlace = false;
                                break;
                            }
                        }
                    }
                    
                    // Check box
                    if (canPlace) {
                        const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
                        const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
                        for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
                            for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
                                if ((r !== row || c !== col) && grid[r][c].value === num) {
                                    canPlace = false;
                                    break;
                                }
                            }
                            if (!canPlace) break;
                        }
                    }
                    
                    // If the number can be placed, add it to notes
                    if (canPlace) {
                        cell.notes.add(num);
                    }
                }
            }
        }
    }
}
