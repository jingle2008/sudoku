import type { GameState } from './gameStore';

export type HistoryState = {
	undoStack: GameState[];
	redoStack: GameState[];
};

export const initialHistoryState: HistoryState = {
	undoStack: [],
	redoStack: []
};

/**
 * Snapshot the current grid and selectedCell for undo/redo.
 */
export function snapshotState(state: { grid: GameState['grid']; selectedCell: GameState['selectedCell'] }): GameState {
	return {
		grid: state.grid.map((row) =>
			row.map((cell) => ({
				...cell,
				notes: new Set(cell.notes)
			}))
		),
		selectedCell: state.selectedCell.clone()
	};
}

/**
 * Restore a GameState snapshot (deep-copies notes and coord).
 */
export function restoreSnapshot(snapshot: GameState): { grid: GameState['grid']; selectedCell: GameState['selectedCell'] } {
	return {
		grid: snapshot.grid.map((row) =>
			row.map((cell) => ({
				...cell,
				notes: new Set(cell.notes)
			}))
		),
		selectedCell: snapshot.selectedCell.clone()
	};
}
