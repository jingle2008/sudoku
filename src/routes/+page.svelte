<script lang="ts">
	import { goto } from '$app/navigation';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<div class="home-container">
	<div class="theme-toggle-wrapper">
		<ThemeToggle />
	</div>
	<div class="title-container">
		<h1>Sudoku</h1>
		<p class="subtitle">Challenge your mind with our Sudoku puzzles</p>
	</div>

	<div class="button-container">
		<button class="primary-btn" on:click={() => goto('/difficulty')}>
			New Game
		</button>
		<button class="secondary-btn" on:click={() => goto('/puzzle/edit')}>
			Edit Puzzle
		</button>
	</div>
</div>

<style>
	.home-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-8);
		background: var(--background-color);
	}

	.title-container {
		text-align: center;
		margin-bottom: var(--space-10);
	}

	h1 {
		font-size: 3.5rem;
		font-weight: 700;
		color: var(--text-color);
		margin-bottom: var(--space-3);
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
	}

	.button-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 280px;
	}

	.primary-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-6);
		font-size: 1.1rem;
		font-weight: 600;
		color: white;
		background: var(--primary-color);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.primary-btn:hover {
		background: var(--primary-hover);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.primary-btn:active {
		transform: scale(0.98);
	}

	.secondary-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-6);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-color);
		background: var(--surface-color);
		border: 1.5px solid var(--border-color);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.secondary-btn:hover {
		background: var(--surface-secondary);
		border-color: var(--text-secondary);
	}

	.secondary-btn:active {
		transform: scale(0.98);
	}

	.theme-toggle-wrapper {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}
	}
</style>
