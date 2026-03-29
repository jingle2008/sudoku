import { describe, it, expect } from 'vitest';
import { generateSudokuPuzzle, generateSolvedGrid, stringToGrid } from './puzzleGenerator';
import { hasUniqueSolution } from './engine';
import { GRID_SIZE } from './constants';

describe('puzzleGenerator', () => {
	describe('generateSolvedGrid', () => {
		it('produces a fully filled 9x9 grid', () => {
			const grid = generateSolvedGrid();
			expect(grid).toHaveLength(GRID_SIZE);
			for (const row of grid) {
				expect(row).toHaveLength(GRID_SIZE);
				for (const cell of row) {
					expect(cell).toBeGreaterThanOrEqual(1);
					expect(cell).toBeLessThanOrEqual(9);
				}
			}
		});

		it('produces a valid solution (no duplicates in row/col/box)', () => {
			const grid = generateSolvedGrid();
			for (let r = 0; r < GRID_SIZE; r++) {
				expect(new Set(grid[r]).size).toBe(GRID_SIZE);
			}
			for (let c = 0; c < GRID_SIZE; c++) {
				const col = grid.map(row => row[c]);
				expect(new Set(col).size).toBe(GRID_SIZE);
			}
			for (let br = 0; br < 3; br++) {
				for (let bc = 0; bc < 3; bc++) {
					const box: number[] = [];
					for (let r = br * 3; r < br * 3 + 3; r++) {
						for (let c = bc * 3; c < bc * 3 + 3; c++) {
							box.push(grid[r][c]);
						}
					}
					expect(new Set(box).size).toBe(GRID_SIZE);
				}
			}
		});
	});

	describe('generateSudokuPuzzle', () => {
		it('generates a puzzle with the correct number of clues for easy', () => {
			const puzzle = generateSudokuPuzzle('easy');
			const filledCells = puzzle.flat().filter(v => v !== null).length;
			// Easy removes 30 → 51 clues
			expect(filledCells).toBe(81 - 30);
		});

		it('generates a puzzle with the correct number of clues for hard', () => {
			const puzzle = generateSudokuPuzzle('hard');
			const filledCells = puzzle.flat().filter(v => v !== null).length;
			// Hard removes 50 → 31 clues
			expect(filledCells).toBe(81 - 50);
		});

		it('generates a puzzle with a unique solution', () => {
			const puzzle = generateSudokuPuzzle('medium');
			expect(hasUniqueSolution(puzzle)).toBe(true);
		});
	});

	describe('stringToGrid', () => {
		it('converts a string to a grid with nulls for zeros', () => {
			const str = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
			const grid = stringToGrid(str);
			expect(grid[0][0]).toBe(5);
			expect(grid[0][1]).toBe(3);
			expect(grid[0][2]).toBeNull();
			expect(grid[0][3]).toBeNull();
			expect(grid[0][4]).toBe(7);
		});
	});
});
