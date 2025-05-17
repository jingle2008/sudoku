/**
 * Shared Sudoku types for engine, strategies, and store.
 */

export type Cell = {
	value: number | null;
	notes: Set<number>;
	isSelected: boolean;
	isHighlighted: boolean;
	isInitial: boolean;
	isFlashing: boolean;
};
