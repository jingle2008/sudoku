// src/lib/stores/gameStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import type { Cell } from './gameStore';
import { removeNotesInRow, removeNotesInColumn, removeNotesInBox } from './gameStore';

describe('Game Store Functions', () => {
    let grid: Cell[][];

    beforeEach(() => {
        // Initialize a sample grid for testing
        grid = Array(9).fill(null).map(() =>
            Array(9).fill(null).map(() => ({
                value: null,
                notes: new Set<number>(),
                isSelected: false,
                isInitial: false,
                isFlashing: false,
                isHighlighted: false
            }))
        );
    });

    // it('removeNotesInGroup removes notes correctly', () => {
    //     // Setup test data
    //     grid[0][0].notes.add(1);
    //     grid[0][1].notes.add(2);
    //     grid[0][2].notes.add(3);

    //     const group = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
    //     const notesToRemove = new Set([1, 2]);

    //     const removedCount = removeNotesInGroup(grid, group, notesToRemove);

    //     expect(removedCount).toBe(2);
    //     expect(grid[0][0].notes.has(1)).toBe(false);
    //     expect(grid[0][1].notes.has(2)).toBe(false);
    //     expect(grid[0][2].notes.has(3)).toBe(true); // Should remain unchanged
    // });

    it('removeNotesInRow removes notes correctly', () => {
        grid[0][0].notes.add(1);
        grid[0][1].notes.add(2);
        grid[0][2].notes.add(3);

        const notesToRemove = new Set([1, 2]);
        const removedCount = removeNotesInRow(grid, 0, [], notesToRemove);

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[0][1].notes.has(2)).toBe(false);
        expect(grid[0][2].notes.has(3)).toBe(true); // Should remain unchanged
    });

    it('removeNotesInColumn removes notes correctly', () => {
        grid[0][0].notes.add(1);
        grid[1][0].notes.add(2);
        grid[2][0].notes.add(3);

        const notesToRemove = new Set([1, 2]);
        const removedCount = removeNotesInColumn(grid, 0, [], notesToRemove);

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[1][0].notes.has(2)).toBe(false);
        expect(grid[2][0].notes.has(3)).toBe(true); // Should remain unchanged
    });

    it('removeNotesInBox removes notes correctly', () => {
        grid[0][0].notes.add(1);
        grid[0][1].notes.add(2);
        grid[1][0].notes.add(3);

        const notesToRemove = new Set([1, 3]);
        const removedCount = removeNotesInBox(grid, { row: 0, col: 0 }, [], notesToRemove);

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[0][1].notes.has(2)).toBe(true);
        expect(grid[1][0].notes.has(3)).toBe(false); // Should remain unchanged
    });

    it('removeNotesInRow removes notes correctly, excluding specified columns', () => {
        grid[0][0].notes.add(1);
        grid[0][1].notes.add(2);
        grid[0][2].notes.add(3);
        grid[0][3].notes.add(4); // This note should remain

        const notesToRemove = new Set([1, 2, 4]);
        const removedCount = removeNotesInRow(grid, 0, [3], notesToRemove); // Exclude column 3

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[0][1].notes.has(2)).toBe(false);
        expect(grid[0][2].notes.has(3)).toBe(true); // Should remain unchanged
        expect(grid[0][3].notes.has(4)).toBe(true); // Should remain unchanged
    });

    it('removeNotesInColumn removes notes correctly, excluding specified rows', () => {
        grid[0][0].notes.add(1);
        grid[1][0].notes.add(2);
        grid[2][0].notes.add(3);
        grid[3][0].notes.add(4); // This note should remain

        const notesToRemove = new Set([1, 2, 4]);
        const removedCount = removeNotesInColumn(grid, 0, [3], notesToRemove); // Exclude row 3

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[1][0].notes.has(2)).toBe(false);
        expect(grid[2][0].notes.has(3)).toBe(true); // Should remain unchanged
        expect(grid[3][0].notes.has(4)).toBe(true); // Should remain unchanged
    });

    it('removeNotesInBox removes notes correctly, excluding specified cells', () => {
        grid[0][0].notes.add(1);
        grid[0][1].notes.add(2);
        grid[1][0].notes.add(3);
        grid[1][1].notes.add(4); // This note should remain

        const notesToRemove = new Set([1, 2, 4]);
        const removedCount = removeNotesInBox(grid, { row: 0, col: 0 }, [10], notesToRemove); // Exclude cell (1, 1)

        expect(removedCount).toBe(2);
        expect(grid[0][0].notes.has(1)).toBe(false);
        expect(grid[0][1].notes.has(2)).toBe(false);
        expect(grid[1][0].notes.has(3)).toBe(true); // Should remain unchanged
        expect(grid[1][1].notes.has(4)).toBe(true); // Should remain unchanged
    });
});