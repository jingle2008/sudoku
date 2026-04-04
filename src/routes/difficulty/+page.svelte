<script lang="ts">
	import { goto } from '$app/navigation';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { bestTimes } from '$lib/stores/statsStore';
	import { formatTime } from '$lib/stores/timerStore';

	type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

	const difficulties: { value: Difficulty; label: string; description: string }[] = [
		{ value: 'easy', label: 'Easy', description: 'Perfect for beginners' },
		{ value: 'medium', label: 'Medium', description: 'A bit more challenging' },
		{ value: 'hard', label: 'Hard', description: 'For experienced players' },
		{ value: 'expert', label: 'Expert', description: 'Very challenging' },
		{ value: 'master', label: 'Master', description: 'Extremely difficult' },
		{ value: 'extreme', label: 'Extreme', description: 'For the most skilled players' }
	];

	function selectDifficulty(difficulty: Difficulty) {
		goto(`/puzzle/new?difficulty=${difficulty}`);
	}
</script>

<div class="difficulty-container">
	<div class="theme-toggle-wrapper">
		<ThemeToggle />
	</div>
	<h1>Select Difficulty</h1>

	<div class="difficulty-grid">
		{#each difficulties as difficulty (difficulty.value)}
			<button class="difficulty-card" on:click={() => selectDifficulty(difficulty.value)}>
				<div class="difficulty-label">{difficulty.label}</div>
				<div class="difficulty-description">{difficulty.description}</div>
				<div class="difficulty-best-time">
					Best: {$bestTimes[difficulty.value] !== null ? formatTime($bestTimes[difficulty.value] as number) : '—'}
				</div>
			</button>
		{/each}
	</div>

	<button class="back-button" on:click={() => goto('/')}>
		<span>&#8592;</span>
		<span>Back to Home</span>
	</button>
</div>

<style>
	.difficulty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		padding: var(--space-4);
		background: var(--background-color);
		justify-content: center;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-color);
		margin-bottom: var(--space-6);
		text-align: center;
	}

	.difficulty-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
		width: 100%;
		max-width: 480px;
		margin-bottom: var(--space-6);
	}

	.difficulty-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-5) var(--space-4);
		background: var(--surface-color);
		border-radius: var(--radius);
		border: 1.5px solid var(--border-light);
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: center;
	}

	.difficulty-card:hover {
		border-color: var(--primary-color);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}

	.difficulty-card:active {
		transform: scale(0.98);
	}

	.difficulty-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color);
		margin-bottom: var(--space-1);
	}

	.difficulty-description {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.difficulty-best-time {
		font-size: 12px;
		font-family: var(--font-grid);
		color: var(--primary-color);
		margin-top: var(--space-1);
		font-weight: 500;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-color);
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.back-button:hover {
		background: var(--surface-secondary);
		border-color: var(--text-secondary);
	}

	.back-button:active {
		transform: scale(0.98);
	}

	.theme-toggle-wrapper {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
	}

	@media (max-width: 768px) {
		.difficulty-container {
			padding: var(--space-3);
		}

		h1 {
			font-size: 1.5rem;
			margin-bottom: var(--space-4);
		}

		.difficulty-grid {
			gap: var(--space-2);
		}

		.difficulty-card {
			padding: var(--space-4) var(--space-3);
		}

		.difficulty-label {
			font-size: 0.95rem;
		}

		.difficulty-description {
			font-size: 12px;
		}
	}

	@media (max-width: 480px) {
		.difficulty-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
