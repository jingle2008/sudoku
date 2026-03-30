import type { Coord } from './coord';

export type SolveStepType =
	| 'eliminateRow'
	| 'eliminateCol'
	| 'eliminateBox'
	| 'nakedSingle'
	| 'nakedPair'
	| 'uniqueNote'
	| 'setValue';

export type SolveStep = {
	type: SolveStepType;
	cells: Coord[];
	values: number[];
	description: string;
};
