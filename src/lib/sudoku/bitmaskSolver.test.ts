import { describe, it, expect } from "vitest";
import { generateSolvedGrid, generateSudokuPuzzle } from "./puzzleGenerator";
import { solve, hasUniqueSolution } from "./engine";

describe("Sudoku core property-based/randomized tests", () => {
  it("solve(generateSolvedGrid()) should return true", () => {
    for (let i = 0; i < 10; i++) {
      const grid = generateSolvedGrid();
      // Convert to (number|null)[][]
      const gridNull = grid.map(row => row.map(v => v === 0 ? null : v));
      expect(solve(gridNull)).toBe(true);
    }
  });

  it("hasUniqueSolution(puzzle) should be true for every generated puzzle", () => {
    for (let i = 0; i < 10; i++) {
      // Use 'medium' difficulty for speed
      const puzzle = generateSudokuPuzzle("medium");
      expect(hasUniqueSolution(puzzle)).toBe(true);
    }
  });
});
