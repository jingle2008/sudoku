<script lang="ts">
	import { goto } from '$app/navigation';

	type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

	const difficulties: { value: Difficulty; label: string; icon: string; description: string }[] = [
		{ value: 'easy', label: 'Easy', icon: '🌱', description: 'Perfect for beginners' },
		{ value: 'medium', label: 'Medium', icon: '🌿', description: 'A bit more challenging' },
		{ value: 'hard', label: 'Hard', icon: '🌳', description: 'For experienced players' },
		{ value: 'expert', label: 'Expert', icon: '🔥', description: 'Very challenging' },
		{ value: 'master', label: 'Master', icon: '⚡', description: 'Extremely difficult' },
		{ value: 'extreme', label: 'Extreme', icon: '💀', description: 'For the most skilled players' }
	];

	function selectDifficulty(difficulty: Difficulty) {
		goto(`/puzzle/new?difficulty=${difficulty}`);
	}
</script>

<div class="difficulty-container">
	<h1>Select Difficulty</h1>

	<div class="difficulty-grid">
		{#each difficulties as difficulty (difficulty.value)}
			<button class="difficulty-card" on:click={() => selectDifficulty(difficulty.value)}>
				<div class="difficulty-icon">{difficulty.icon}</div>
				<div class="difficulty-content">
					<div class="difficulty-label">{difficulty.label}</div>
					<div class="difficulty-description">{difficulty.description}</div>
				</div>
			</button>
		{/each}
	</div>

	<button class="back-button" on:click={() => goto('/')}>
		<span class="icon">←</span>
		<span class="text">Back to Home</span>
	</button>
</div>

<style>
	.difficulty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		padding: 1rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		justify-content: center;
	}

	h1 {
		font-size: 2rem;
		color: var(--secondary-color);
		margin-bottom: 1rem;
		text-align: center;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.difficulty-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		width: 100%;
		max-width: 800px;
		margin-bottom: 1rem;
	}

	.difficulty-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 12px;
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.difficulty-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.difficulty-card:active {
		transform: translateY(0);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.difficulty-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.difficulty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.difficulty-label {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--secondary-color);
		margin-bottom: 0.25rem;
	}

	.difficulty-description {
		font-size: 0.9rem;
		color: #7f8c8d;
		text-align: center;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		font-weight: 500;
		color: var(--secondary-color);
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		margin-top: 0.5rem;
	}

	.back-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.back-button:active {
		transform: translateY(0);
		box-shadow: none;
	}

	@media (max-width: 768px) {
		.difficulty-container {
			padding: 0.75rem;
			justify-content: center;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		h1 {
			font-size: 1.5rem;
			margin-bottom: 0.75rem;
		}

		.difficulty-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
			margin-bottom: 0.75rem;
			width: 100%;
		}

		.difficulty-card {
			flex-direction: row;
			padding: 0.5rem;
			align-items: center;
			justify-content: center;
		}

		.difficulty-icon {
			font-size: 1.5rem;
			margin-bottom: 0;
			margin-right: 0.75rem;
			flex-shrink: 0;
		}

		.difficulty-content {
			align-items: center;
			text-align: center;
		}

		.difficulty-label {
			font-size: 1rem;
		}

		.difficulty-description {
			font-size: 0.8rem;
			text-align: center;
		}

		.back-button {
			padding: 0.4rem 0.8rem;
			font-size: 0.9rem;
			margin-top: 0.5rem;
		}
	}

	@media (max-width: 480px) {
		.difficulty-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
