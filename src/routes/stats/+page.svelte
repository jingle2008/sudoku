<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { statsStore } from '$lib/stores/statsStore';
	import { formatTime } from '$lib/stores/timerStore';

	type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

	const difficulties: { value: Difficulty; label: string }[] = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'hard', label: 'Hard' },
		{ value: 'expert', label: 'Expert' },
		{ value: 'master', label: 'Master' },
		{ value: 'extreme', label: 'Extreme' }
	];

	$: stats = $statsStore;

	$: totalGames = difficulties.reduce((sum, d) => sum + stats[d.value].gamesPlayed, 0);
	$: totalCompleted = difficulties.reduce((sum, d) => sum + stats[d.value].gamesCompleted, 0);
	$: totalTimePlayed = difficulties.reduce((sum, d) => sum + stats[d.value].totalTime, 0);

	function completionRate(played: number, completed: number): string {
		if (played === 0) return '—';
		return Math.round((completed / played) * 100) + '%';
	}

	function displayTime(seconds: number | null): string {
		if (seconds === null) return '—';
		return formatTime(seconds);
	}

	function averageTime(totalTime: number, completed: number): string {
		if (completed === 0) return '—';
		return formatTime(Math.round(totalTime / completed));
	}

	function formatTotalTime(seconds: number): string {
		if (seconds === 0) return '—';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<div class="stats-container">
	<div class="stats-header">
		<a class="back-link" href="/">
			<span>&#8592;</span>
			<span>Home</span>
		</a>
		<h1>Statistics</h1>
		<ThemeToggle />
	</div>

	<div class="summary-cards">
		<div class="summary-card">
			<div class="summary-value">{totalGames}</div>
			<div class="summary-label">Games Played</div>
		</div>
		<div class="summary-card">
			<div class="summary-value">{totalCompleted}</div>
			<div class="summary-label">Completed</div>
		</div>
		<div class="summary-card">
			<div class="summary-value">{completionRate(totalGames, totalCompleted)}</div>
			<div class="summary-label">Win Rate</div>
		</div>
		<div class="summary-card">
			<div class="summary-value">{formatTotalTime(totalTimePlayed)}</div>
			<div class="summary-label">Total Time</div>
		</div>
	</div>

	<div class="difficulty-stats">
		{#each difficulties as diff (diff.value)}
			{@const ds = stats[diff.value]}
			<div class="stat-card">
				<div class="stat-card-header">
					<h2>{diff.label}</h2>
				</div>
				<div class="stat-grid">
					<div class="stat-item">
						<span class="stat-label">Played</span>
						<span class="stat-value">{ds.gamesPlayed}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Completed</span>
						<span class="stat-value">{ds.gamesCompleted}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Win Rate</span>
						<span class="stat-value">{completionRate(ds.gamesPlayed, ds.gamesCompleted)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Best Time</span>
						<span class="stat-value best-time">{displayTime(ds.bestTime)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Avg Time</span>
						<span class="stat-value">{averageTime(ds.totalTime, ds.gamesCompleted)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Streak</span>
						<span class="stat-value">{ds.currentStreak} <span class="streak-best">(best: {ds.bestStreak})</span></span>
					</div>
				</div>
			</div>
		{/each}
	</div>

</div>

<style>
	.stats-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		padding: var(--space-4);
		background: var(--background-color);
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-color);
		margin-bottom: var(--space-6);
		text-align: center;
	}

	/* Summary cards */
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-3);
		width: 100%;
		max-width: 560px;
		margin-bottom: var(--space-6);
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4) var(--space-2);
		background: var(--surface-color);
		border-radius: var(--radius);
		border: 1px solid var(--border-light);
	}

	.summary-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primary-color);
		font-family: var(--font-grid);
	}

	.summary-label {
		font-size: 12px;
		color: var(--text-secondary);
		margin-top: var(--space-1);
	}

	/* Per-difficulty stats */
	.difficulty-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
		width: 100%;
		max-width: 560px;
		margin-bottom: var(--space-6);
	}

	.stat-card {
		background: var(--surface-color);
		border-radius: var(--radius);
		border: 1px solid var(--border-light);
		overflow: hidden;
	}

	.stat-card-header {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--border-light);
	}

	.stat-card-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color);
		margin: 0;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--border-light);
	}

	.stat-item:nth-last-child(-n+2) {
		border-bottom: none;
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-color);
		font-family: var(--font-grid);
	}

	.stat-value.best-time {
		color: var(--primary-color);
	}

	.streak-best {
		font-size: 11px;
		font-weight: 400;
		color: var(--text-secondary);
	}

	/* Header */
	.stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 560px;
		margin-bottom: var(--space-4);
	}

	.stats-header h1 {
		margin: 0;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-color);
		text-decoration: none;
		padding: var(--space-2) var(--space-4);
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		transition: all 0.15s ease;
	}

	.back-link:hover {
		background: var(--surface-secondary);
		border-color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.stats-container {
			padding: var(--space-3);
		}

		h1 {
			font-size: 1.5rem;
			margin-bottom: var(--space-4);
		}

		.summary-cards {
			grid-template-columns: repeat(2, 1fr);
			gap: var(--space-2);
		}

		.difficulty-stats {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}

		.stat-item {
			padding: var(--space-2) var(--space-3);
		}
	}

	@media (max-width: 480px) {
		.summary-cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
