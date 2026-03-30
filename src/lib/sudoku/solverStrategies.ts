/**
 * @module solverStrategies
 * Implementation of human-like Sudoku solving strategies.
 */
import { BOX_SIZE, GRID_SIZE, Group } from "./constants";
import { Coord } from "./coord";
import type { Cell } from "$lib/sudoku/types";
import { solveLogStore } from "$lib/stores/solveLogStore";
import type { SolveStepType } from "./solveStep";

/** Format a Coord as "R{row+1}C{col+1}" for human-readable descriptions */
function fmtCoord(c: Coord): string {
    return `R${c.row + 1}C${c.col + 1}`;
}

/** Format an array of Coords as a comma-separated string */
function fmtCoords(coords: Coord[]): string {
    return coords.map(fmtCoord).join(', ');
}

/** Format a set of numbers as "{1, 2, 3}" */
function fmtSet(nums: Iterable<number>): string {
    return `{${[...nums].sort((a, b) => a - b).join(', ')}}`;
}

/** Compute the 1-based box number from a Coord */
function boxNumber(c: Coord): number {
    return Math.floor(c.row / BOX_SIZE) * BOX_SIZE + Math.floor(c.col / BOX_SIZE) + 1;
}

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
    const targets = anchor.coordsFor(Group.Row, skips);
    const affected = targets.filter(({ row, col }) =>
        grid[row][col].value === null && [...notes].some(n => grid[row][col].notes.has(n))
    );
    const removed = removeNotesFromCells(grid, targets, notes);
    if (removed > 0) {
        solveLogStore.addStep({
            type: 'eliminateRow',
            cells: affected,
            values: [...notes],
            description: `Row ${anchor.row + 1}: eliminated candidates ${fmtSet(notes)} from ${fmtCoords(affected)} (placed values in row)`
        });
    }
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
    const targets = anchor.coordsFor(Group.Column, skips);
    const affected = targets.filter(({ row, col }) =>
        grid[row][col].value === null && [...notes].some(n => grid[row][col].notes.has(n))
    );
    const removed = removeNotesFromCells(grid, targets, notes);
    if (removed > 0) {
        solveLogStore.addStep({
            type: 'eliminateCol',
            cells: affected,
            values: [...notes],
            description: `Column ${anchor.col + 1}: eliminated candidates ${fmtSet(notes)} from ${fmtCoords(affected)} (placed values in column)`
        });
    }
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
    const targets = anchor.coordsFor(Group.Box, skips);
    const affected = targets.filter(({ row, col }) =>
        grid[row][col].value === null && [...notes].some(n => grid[row][col].notes.has(n))
    );
    const removed = removeNotesFromCells(grid, targets, notes);
    if (removed > 0) {
        solveLogStore.addStep({
            type: 'eliminateBox',
            cells: affected,
            values: [...notes],
            description: `Box ${boxNumber(anchor)}: eliminated candidates ${fmtSet(notes)} from ${fmtCoords(affected)} (placed values in box)`
        });
    }
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
    const pairValues = [...cell.notes].sort((a, b) => a - b);

    let pair = getNakedPairInRow(grid, pos);
    if (pair !== null) {
        pairFound = true;
        const cells = [pos, pair];
        const rowTargets = pos.coordsFor(Group.Row, cells);
        const rowAffected = rowTargets.filter(({ row: r, col: c }) =>
            grid[r][c].value === null && [...cell.notes].some(n => grid[r][c].notes.has(n))
        );
        const rowRemoved = removeNotesInRow(grid, pos, cells, cell.notes);
        let boxRemoved = 0;
        let boxAffected: Coord[] = [];
        if (areCellsInSameBox(cells)) {
            const boxTargets = pos.coordsFor(Group.Box, cells);
            boxAffected = boxTargets.filter(({ row: r, col: c }) =>
                grid[r][c].value === null && [...cell.notes].some(n => grid[r][c].notes.has(n))
            );
            boxRemoved = removeNotesInBox(grid, pos, cells, cell.notes);
        }
        const allRemoved = rowRemoved + boxRemoved;
        if (allRemoved > 0) {
            const allAffected = [...rowAffected, ...boxAffected];
            solveLogStore.addStep({
                type: 'nakedPair',
                cells: cells,
                values: pairValues,
                description: `Naked Pair [${pairValues.join(', ')}] in Row ${pos.row + 1} at ${fmtCoords(cells)} — removed ${fmtSet(cell.notes)} from ${fmtCoords(allAffected)}`
            });
        }
        totalNotesRemoved += allRemoved;
    }

    pair = getNakedPairInColumn(grid, pos);
    if (pair !== null) {
        pairFound = true;
        const cells = [pos, pair];
        const colTargets = pos.coordsFor(Group.Column, cells);
        const colAffected = colTargets.filter(({ row: r, col: c }) =>
            grid[r][c].value === null && [...cell.notes].some(n => grid[r][c].notes.has(n))
        );
        const colRemoved = removeNotesInColumn(grid, pos, cells, cell.notes);
        let boxRemoved = 0;
        let boxAffected: Coord[] = [];
        if (areCellsInSameBox(cells)) {
            const boxTargets = pos.coordsFor(Group.Box, cells);
            boxAffected = boxTargets.filter(({ row: r, col: c }) =>
                grid[r][c].value === null && [...cell.notes].some(n => grid[r][c].notes.has(n))
            );
            boxRemoved = removeNotesInBox(grid, pos, cells, cell.notes);
        }
        const allRemoved = colRemoved + boxRemoved;
        if (allRemoved > 0) {
            const allAffected = [...colAffected, ...boxAffected];
            solveLogStore.addStep({
                type: 'nakedPair',
                cells: cells,
                values: pairValues,
                description: `Naked Pair [${pairValues.join(', ')}] in Column ${pos.col + 1} at ${fmtCoords(cells)} — removed ${fmtSet(cell.notes)} from ${fmtCoords(allAffected)}`
            });
        }
        totalNotesRemoved += allRemoved;
    }

    pair = getNakedPairInBox(grid, pos);
    if (pair !== null) {
        pairFound = true;
        const pairCells = [pos, pair];
        const boxTargets = pos.coordsFor(Group.Box, pairCells);
        const boxAffected = boxTargets.filter(({ row: r, col: c }) =>
            grid[r][c].value === null && [...cell.notes].some(n => grid[r][c].notes.has(n))
        );
        const boxRemoved = removeNotesInBox(grid, pos, pairCells, cell.notes);
        if (boxRemoved > 0) {
            solveLogStore.addStep({
                type: 'nakedPair',
                cells: pairCells,
                values: pairValues,
                description: `Naked Pair [${pairValues.join(', ')}] in Box ${boxNumber(pos)} at ${fmtCoords(pairCells)} — removed ${fmtSet(cell.notes)} from ${fmtCoords(boxAffected)}`
            });
        }
        totalNotesRemoved += boxRemoved;
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
        const groupLabel = group === Group.Row
            ? `Row ${row + 1}`
            : group === Group.Column
                ? `Column ${col + 1}`
                : `Box ${boxNumber(pos)}`;
        cell.notes.clear();
        cell.notes.add(note);
        solveLogStore.addStep({
            type: 'uniqueNote',
            cells: [pos],
            values: [note],
            description: `Hidden Single: ${fmtCoord(pos)} = ${note} (unique in ${groupLabel})`
        });
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
        const value = [...cell.notes][0];
        solveLogStore.addStep({
            type: 'nakedSingle',
            cells: [pos],
            values: [value],
            description: `Naked Single: ${fmtCoord(pos)} = ${value} (only candidate remaining)`
        });
        return true;
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
