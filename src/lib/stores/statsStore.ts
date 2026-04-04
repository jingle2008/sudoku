import { writable, derived } from 'svelte/store';
import type { Difficulty } from './gameStore';

export type DifficultyStats = {
	gamesPlayed: number;
	gamesCompleted: number;
	bestTime: number | null; // seconds, null if never completed
	totalTime: number; // total seconds across completed games
	currentStreak: number;
	bestStreak: number;
};

export type AllStats = Record<Difficulty, DifficultyStats>;

const STORAGE_KEY = 'sudoku-stats';

const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];

function createEmptyStats(): DifficultyStats {
	return {
		gamesPlayed: 0,
		gamesCompleted: 0,
		bestTime: null,
		totalTime: 0,
		currentStreak: 0,
		bestStreak: 0
	};
}

function createEmptyAllStats(): AllStats {
	const stats = {} as AllStats;
	for (const d of difficulties) {
		stats[d] = createEmptyStats();
	}
	return stats;
}

function loadStats(): AllStats {
	if (typeof localStorage === 'undefined') return createEmptyAllStats();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return createEmptyAllStats();
		const parsed = JSON.parse(raw);
		// Ensure all difficulties exist (forward compatibility)
		const stats = createEmptyAllStats();
		for (const d of difficulties) {
			if (parsed[d]) {
				stats[d] = { ...stats[d], ...parsed[d] };
			}
		}
		return stats;
	} catch {
		return createEmptyAllStats();
	}
}

function saveStats(stats: AllStats): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
	} catch {
		// localStorage full or unavailable
	}
}

function createStatsStore() {
	const { subscribe, update, set } = writable<AllStats>(loadStats());

	// Save to localStorage on every change
	subscribe((stats) => {
		saveStats(stats);
	});

	return {
		subscribe,

		/**
		 * Record a game result. Returns whether this was a new best time.
		 */
		recordGame(difficulty: Difficulty, timeSeconds: number, completed: boolean): boolean {
			let isNewBest = false;

			update((stats) => {
				const ds = { ...stats[difficulty] };
				ds.gamesPlayed++;

				if (completed) {
					ds.gamesCompleted++;
					ds.totalTime += timeSeconds;
					ds.currentStreak++;
					if (ds.currentStreak > ds.bestStreak) {
						ds.bestStreak = ds.currentStreak;
					}
					if (ds.bestTime === null || timeSeconds < ds.bestTime) {
						isNewBest = ds.bestTime !== null; // only "new best" if there was a previous best
						ds.bestTime = timeSeconds;
					}
				} else {
					ds.currentStreak = 0;
				}

				return { ...stats, [difficulty]: ds };
			});

			return isNewBest;
		},

		getStats(difficulty: Difficulty): DifficultyStats {
			let result = createEmptyStats();
			const unsub = subscribe((stats) => {
				result = stats[difficulty];
			});
			unsub();
			return result;
		},

		getAllStats(): AllStats {
			let result = createEmptyAllStats();
			const unsub = subscribe((stats) => {
				result = stats;
			});
			unsub();
			return result;
		},

		reset(): void {
			set(createEmptyAllStats());
		}
	};
}

export const statsStore = createStatsStore();

// Derived store for easy access to best times per difficulty
export const bestTimes = derived(statsStore, ($stats) => {
	const times: Record<Difficulty, number | null> = {} as Record<Difficulty, number | null>;
	for (const d of difficulties) {
		times[d] = $stats[d].bestTime;
	}
	return times;
});
