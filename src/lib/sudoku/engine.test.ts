import { describe, it, expect } from 'vitest';
import { Coord } from './coord';
import type { Grid } from './engine';
import { isValidPlacement, solve, hasUniqueSolution } from './engine';

describe('Sudoku engine', () => {
  const emptyGrid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));

  const solvedGrid: Grid = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  it('correctly validates valid and invalid placements', () => {
    expect(isValidPlacement(emptyGrid, new Coord(0, 0), 1)).toBe(true);
    const invalidGrid = emptyGrid.map(row => [...row]);
    invalidGrid[0][1] = 1; // duplicate in row
    expect(isValidPlacement(invalidGrid, new Coord(0, 0), 1)).toBe(false);
  });

  it('solves empty grid successfully', () => {
    const gridCopy = emptyGrid.map(row => [...row]);
    const solved = solve(gridCopy);
    expect(solved).toBe(true);
    expect(gridCopy[0][0]).toBeGreaterThan(0);
  });

  it('detects unique solution for solved grid', () => {
    expect(hasUniqueSolution(solvedGrid)).toBe(true);
  });

  it('detects non-unique or no solution properly', () => {
    const invalidGrid = emptyGrid.map(row => [...row]);
    expect(hasUniqueSolution(invalidGrid)).toBe(false);
  });
});