<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="home-container">
	<div class="title-container">
		<h1>Sudoku</h1>
		<p class="subtitle">Challenge your mind with our Sudoku puzzles</p>
	</div>

	<div class="button-container">
		<button class="new-game-button" on:click={() => goto('/difficulty')}>
			<span class="icon">🎮</span>
			<span class="text">New Game</span>
		</button>
		<button class="new-game-button" on:click={() => goto('/puzzle/edit')}>
			<span class="icon">✏️</span>
			<span class="text">Edit Puzzle</span>
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
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.title-container {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 4rem;
		color: var(--secondary-color);
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.subtitle {
		font-size: 1.5rem;
		color: #34495e;
	}

	.button-container {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.new-game-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1rem 2rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: white;
		background: var(--primary-color);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.new-game-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.new-game-button:active {
		transform: translateY(1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.icon {
		font-size: 1.8rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 3rem;
		}

		.subtitle {
			font-size: 1.2rem;
		}

		.new-game-button {
			font-size: 1.2rem;
			padding: 0.8rem 1.6rem;
		}
	}

	.button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: 500;
		text-align: center;
		text-decoration: none;
		color: white;
		background: var(--primary-color);
		border-radius: 8px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.button:active {
		transform: translateY(0);
		box-shadow: none;
	}
</style>
