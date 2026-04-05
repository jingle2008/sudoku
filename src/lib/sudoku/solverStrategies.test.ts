import { describe, it, expect, beforeEach } from 'vitest';
import {
	removeNotesInRow,
	getNakedPairInRow,
	processNakedSingles,
	applyAutoNotes,
	processNakedSingle,
	removeNotesFromCells,
} from './solverStrategies';
import { Coord } from './coord';
import { GRID_SIZE, Group } from './constants';
import type { Cell } from './types';

function createEmptyGrid(): Cell[][] {
	return Array(GRID_SIZE)
		.fill(null)
		.map(() =>
			Array(GRID_SIZE)
				.fill(null)
				.map(() => ({
					value: null,
					notes: new Set<number>(),
					isSelected: false,
					isInitial: false,
					isFlashing: false, isInScope: false,
					isHighlighted: false
				}))
		);
}

describe('solverStrategies', () => {
	let grid: Cell[][];

	beforeEach(() => {
		grid = createEmptyGrid();
	});

	describe('removeNotesInRow', () => {
		it('removes specified notes from all cells in the row', () => {
			grid[0][3].notes = new Set([1, 2, 5]);
			grid[0][7].notes = new Set([2, 3]);
			const removed = removeNotesInRow(grid, new Coord(0, 0), [], new Set([2, 5]));
			expect(removed).toBe(3); // 2 and 5 from col3, 2 from col7
			expect(grid[0][3].notes).toEqual(new Set([1]));
			expect(grid[0][7].notes).toEqual(new Set([3]));
		});

		it('skips cells with values', () => {
			grid[0][1].value = 5;
			grid[0][1].notes = new Set([5]);
			const removed = removeNotesInRow(grid, new Coord(0, 0), [], new Set([5]));
			expect(removed).toBe(0);
			expect(grid[0][1].notes).toEqual(new Set([5])); // untouched because cell has a value
		});

		it('respects skip coordinates', () => {
			grid[0][2].notes = new Set([4]);
			grid[0][5].notes = new Set([4]);
			const removed = removeNotesInRow(grid, new Coord(0, 0), [new Coord(0, 5)], new Set([4]));
			expect(removed).toBe(1); // only col2, col5 is skipped
			expect(grid[0][5].notes).toEqual(new Set([4]));
		});
	});

	describe('getNakedPairInRow', () => {
		it('finds a naked pair when two cells share the same two notes', () => {
			grid[0][0].notes = new Set([3, 7]);
			grid[0][4].notes = new Set([3, 7]);
			const pair = getNakedPairInRow(grid, new Coord(0, 0));
			expect(pair).toEqual(new Coord(0, 4));
		});

		it('returns null when no naked pair exists', () => {
			grid[0][0].notes = new Set([3, 7]);
			grid[0][4].notes = new Set([3, 8]); // different second note
			const pair = getNakedPairInRow(grid, new Coord(0, 0));
			expect(pair).toBeNull();
		});

		it('ignores cells with more than 2 notes', () => {
			grid[0][0].notes = new Set([3, 7]);
			grid[0][4].notes = new Set([3, 7, 9]); // 3 notes
			const pair = getNakedPairInRow(grid, new Coord(0, 0));
			expect(pair).toBeNull();
		});
	});

	describe('processNakedSingles', () => {
		it('detects cells with only one note as naked singles', () => {
			grid[0][0].notes = new Set([5]);
			grid[3][4].notes = new Set([9]);
			const count = processNakedSingles(grid);
			expect(count).toBe(2);
		});

		it('returns 0 when no naked singles exist', () => {
			grid[0][0].notes = new Set([1, 2]);
			grid[1][1].notes = new Set([3, 4, 5]);
			const count = processNakedSingles(grid);
			expect(count).toBe(0);
		});

		it('finds hidden singles unique in a row', () => {
			// Set up: cell (0,0) has notes {1,2}, all other cells in row 0 have notes that include 1 but not 2
			// So 2 is unique to (0,0) in the row → it's a hidden single
			grid[0][0].notes = new Set([1, 2]);
			for (let c = 1; c < GRID_SIZE; c++) {
				grid[0][c].notes = new Set([1, 3, 4]);
			}
			// Also populate column and box so 2 isn't unique there (to test row specifically)
			for (let r = 1; r < GRID_SIZE; r++) {
				grid[r][0].notes = new Set([2, 3]);
			}

			const count = processNakedSingles(grid);
			expect(count).toBeGreaterThanOrEqual(1);
			// After processing, (0,0) should have only note 2
			expect(grid[0][0].notes).toEqual(new Set([2]));
		});
	});

	describe('applyAutoNotes', () => {
		it('populates notes for empty cells based on constraints', () => {
			// Place values in row 0
			grid[0][0].value = 1;
			grid[0][1].value = 2;
			grid[0][2].value = 3;
			grid[0][3].value = 4;
			grid[0][4].value = 5;
			grid[0][5].value = 6;
			grid[0][6].value = 7;
			grid[0][7].value = 8;
			// grid[0][8] is empty — only 9 is possible
			applyAutoNotes(grid);
			expect(grid[0][8].notes).toEqual(new Set([9]));
		});

		it('does not add notes to cells with values', () => {
			grid[0][0].value = 5;
			applyAutoNotes(grid);
			expect(grid[0][0].notes.size).toBe(0);
		});
	});
});
