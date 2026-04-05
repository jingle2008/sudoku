<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { hasSavedGame, clearSavedGame, type Difficulty } from '$lib/stores/gameStore';
	import { formatTime } from '$lib/stores/timerStore';

	let savedGame: { exists: boolean; difficulty?: Difficulty; elapsedTime?: number } = { exists: false };
	let showNewGameConfirm = false;

	onMount(() => {
		savedGame = hasSavedGame();
	});

	function continueGame() {
		goto('/puzzle/new?resume=true');
	}

	function handleNewGame() {
		if (savedGame.exists) {
			showNewGameConfirm = true;
		} else {
			goto('/difficulty');
		}
	}

	function confirmNewGame() {
		clearSavedGame();
		showNewGameConfirm = false;
		goto('/difficulty');
	}

	function cancelNewGame() {
		showNewGameConfirm = false;
	}
</script>

<div class="home-container">
	<div class="theme-toggle-wrapper">
		<ThemeToggle />
	</div>
	<div class="title-container">
		<img src="/favicon.svg" alt="Sudoku" class="app-icon" width="72" height="72" />
		<h1>Sudoku</h1>
		<p class="subtitle">Challenge your mind with our Sudoku puzzles</p>
	</div>

	<div class="button-container">
		{#if savedGame.exists}
			<button class="primary-btn" on:click={continueGame}>
				Continue Game
				<span class="save-info">
					{savedGame.difficulty} · {formatTime(savedGame.elapsedTime ?? 0)}
				</span>
			</button>
			<button class="secondary-btn" on:click={handleNewGame}>
				New Game
			</button>
		{:else}
			<button class="primary-btn" on:click={handleNewGame}>
				New Game
			</button>
		{/if}
		<button class="secondary-btn" on:click={() => goto('/puzzle/edit')}>
			Edit Puzzle
		</button>
		<button class="secondary-btn" on:click={() => goto('/stats')}>
			Statistics
		</button>
	</div>
</div>

<ConfirmDialog
	title="Start a new game?"
	message="Your saved progress will be lost."
	confirmText="Start New"
	cancelText="Cancel"
	isOpen={showNewGameConfirm}
	onConfirm={confirmNewGame}
	onCancel={cancelNewGame}
/>

<style>
	.home-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		height: 100dvh;
		overflow: auto;
		padding: var(--space-8);
		background: var(--background-color);
	}

	.title-container {
		text-align: center;
		margin-bottom: var(--space-10);
	}

	.app-icon {
		margin-bottom: var(--space-4);
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
		flex-direction: column;
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

	.save-info {
		font-size: 0.8rem;
		font-weight: 400;
		opacity: 0.85;
		text-transform: capitalize;
		margin-top: 2px;
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
