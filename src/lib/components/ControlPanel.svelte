<script lang="ts">
	import {
		gameStore,
		isPencilMode,
		isGameStarted,
		canUndo,
		canRedo,
		canDelete,
		isComplete
	} from '$lib/stores/gameStore';
</script>

<div class="control-panel">
	<div class="mode-toggle">
		<button
			class:active={$isPencilMode}
			on:click={() => gameStore.setPencilMode(true)}
			disabled={!$isGameStarted}
		>
			Pencil Mode
		</button>
		<button
			class:active={!$isPencilMode}
			on:click={() => gameStore.setPencilMode(false)}
			disabled={!$isGameStarted}
		>
			Pen Mode
		</button>
	</div>

	<div class="number-grid">
		<div class="number-pad">
			{#each Array(9) as unused, i (i)}
				<button on:click={() => gameStore.setCellValue(i + 1)}>
					{i + 1}
				</button>
			{/each}
		</div>
	</div>

	<div class="action-buttons">
		<div class="action-row">
			<button
				class="undo"
				on:click={() => gameStore.undo()}
				disabled={!$canUndo}
				title="Undo"
				aria-label="Undo last action"
			>
				Undo
			</button>
			<button
				class="redo"
				on:click={() => gameStore.redo()}
				disabled={!$canRedo}
				title="Redo"
				aria-label="Redo last undone action"
			>
				Redo
			</button>
		</div>
		<div class="action-row">
			<button
				class="delete"
				on:click={() => gameStore.setCellValue(null)}
				disabled={!$canDelete}
				title="Delete"
				aria-label="Delete current cell value"
			>
				Delete
			</button>
			<button
				class="check"
				on:click={() => gameStore.checkSolution()}
				disabled={!$isGameStarted}
				title="Check Solution"
				aria-label="Check if the current solution is correct"
			>
				Check
			</button>
		</div>
		<div class="action-row">
			<button
				class="auto-notes"
				on:click={() => gameStore.autoNotes()}
				disabled={!$isGameStarted}
				title="Auto Notes"
				aria-label="Automatically populate notes for empty cells"
			>
				Auto Notes
			</button>
			<button
				class="restart"
				on:click={() => gameStore.restartGame()}
				title="Restart Game"
				aria-label="Restart the game"
			>
				Restart
			</button>
		</div>
	</div>

	{#if $isComplete}
		<div class="completion-message">🎉 Congratulations! You've completed the puzzle! 🎉</div>
	{/if}
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 450px;
	}

	.mode-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.mode-toggle button {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		background: white;
		cursor: pointer;
		border-radius: 4px;
		font-size: clamp(0.8rem, 2vw, 1rem);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	.mode-toggle button.active {
		background: var(--primary-color);
		color: white;
		border-color: #2980b9;
	}

	.mode-toggle button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.mode-toggle button:disabled:hover {
		background: inherit;
		transform: none;
		box-shadow: none;
	}

	.mode-toggle button:disabled:active {
		transform: none;
		box-shadow: none;
	}

	.mode-toggle button:active {
		transform: scale(0.95);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.number-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
		width: 100%;
	}

	.number-pad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.number-pad button {
		padding: 0;
		font-size: clamp(2.4rem, 6vw, 3rem);
		border: 1px solid var(--border-color);
		background: white;
		cursor: pointer;
		border-radius: 4px;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	.number-pad button:hover {
		background: #e9ecef;
	}

	.number-pad button:active {
		transform: scale(0.95);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-row {
		display: flex;
		gap: 0.5rem;
	}

	.action-row button {
		flex: 1;
	}

	.action-buttons button {
		padding: clamp(0.5rem, 1.5vw, 0.75rem);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		color: white;
		font-size: clamp(0.8rem, 2vw, 1rem);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	.action-buttons button:active {
		transform: scale(0.95);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.delete {
		background: var(--danger-color);
	}

	.check {
		background: var(--success-color);
	}

	.restart {
		background: #6c757d;
	}

	.undo {
		background: #6c757d;
	}

	.redo {
		background: #6c757d;
	}

	.undo:disabled,
	.redo:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.action-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.action-buttons button:disabled:hover {
		background: inherit;
		transform: none;
		box-shadow: none;
	}

	.action-buttons button:disabled:active {
		transform: none;
		box-shadow: none;
	}

	.auto-notes {
		background: #6c757d;
	}

	.completion-message {
		text-align: center;
		padding: 0.75rem;
		background: #d4edda;
		color: #155724;
		border-radius: 4px;
		font-weight: 500;
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.control-panel {
			max-width: 100%;
		}
	}
</style>
