<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import {
		gameStore,
		grid,
		isGameStarted,
		formattedTime,
		type Difficulty
	} from '$lib/stores/gameStore';

	let showRestartConfirm = false;
	let currentDifficulty = 'medium';

	// Get difficulty from URL parameter
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		currentDifficulty = urlParams.get('difficulty') || 'medium';
		gameStore.startGame(currentDifficulty as Difficulty);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function handleCellClick(row: number, col: number) {
		gameStore.selectCell(row, col);
	}

	function handleCellKeyDown(event: KeyboardEvent, row: number, col: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCellClick(row, col);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Don't handle keyboard events when dialog is open
		if (showRestartConfirm) return;

		// Handle navigation
		switch (event.key) {
			case 'p':
				if ($isGameStarted) {
					gameStore.togglePencilMode();
				}
				return;
			case 'ArrowUp':
			case 'k':
				gameStore.moveSelection('up');
				return;
			case 'ArrowDown':
			case 'j':
				gameStore.moveSelection('down');
				return;
			case 'ArrowLeft':
			case 'h':
				gameStore.moveSelection('left');
				return;
			case 'ArrowRight':
			case 'l':
				gameStore.moveSelection('right');
				return;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				gameStore.setCellValue(parseInt(event.key));
				return;
			case 'Backspace':
			case 'Delete':
				gameStore.setCellValue(null);
				return;
			default:
				return;
		}
	}

	function confirmRestart() {
		gameStore.restartGame();
		showRestartConfirm = false;
	}

	function cancelRestart() {
		showRestartConfirm = false;
	}

	function goToHome() {
		goto('/');
	}
</script>

<div class="game-container">
	<div class="game-header">
		<button class="back-button" on:click={goToHome}>
			<span class="icon">←</span>
			<span class="text">Home</span>
		</button>
		<div class="difficulty-badge">
			{currentDifficulty}
		</div>
		<div class="timer">
			<span class="timer-icon">⏱️</span>
			<span class="timer-value">{$formattedTime}</span>
		</div>
	</div>

	<div class="game-content">
		<div class="grid">
			{#each $gameStore.grid as row, rowIndex (rowIndex)}
				<div class="row">
					{#each row as cell, colIndex (colIndex)}
						<div
							class="cell"
							class:selected={cell.isSelected}
							class:border-right={colIndex % 3 === 2}
							class:border-bottom={rowIndex % 3 === 2}
							class:initial={cell.isInitial}
							class:highlighted={cell.isHighlighted}
							class:flashing={cell.isFlashing}
							role="button"
							tabindex="0"
							data-row={rowIndex}
							data-col={colIndex}
							on:click={() => gameStore.selectCell(rowIndex, colIndex)}
							on:keydown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
						>
							{#if cell.value !== null}
								<span class="value">{cell.value}</span>
							{:else if cell.notes.size > 0}
								<div class="notes">
									{#each Array(9) as unused, i (i)}
										<span class="note" class:active={cell.notes.has(i + 1)}>
											{cell.notes.has(i + 1) ? i + 1 : ''}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<div class="control-panel-container">
			<ControlPanel />
		</div>
	</div>

	<ConfirmDialog
		isOpen={showRestartConfirm}
		title="Restart Game?"
		message="This will clear all your progress."
		confirmText="Restart"
		cancelText="Cancel"
		onConfirm={confirmRestart}
		onCancel={cancelRestart}
	/>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 0.75rem;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 800px;
		margin-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--secondary-color);
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.back-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.back-button:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.difficulty-badge {
		text-transform: capitalize;
		font-weight: 600;
		padding: 0.4rem 0.8rem;
		background: var(--primary-color);
		color: white;
		border-radius: 20px;
		font-size: 0.9rem;
	}

	.timer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--secondary-color);
		width: 100px;
		justify-content: center;
	}

	.timer-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.timer-value {
		width: 60px;
		text-align: center;
		font-family: monospace;
	}

	.game-content {
		display: flex;
		flex-direction: row;
		gap: 1.5rem;
		align-items: flex-start;
		justify-content: center;
		width: 100%;
		max-width: 900px;
	}

	.control-panel-container {
		width: 400px;
	}

	.notes {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100%;
		height: 100%;
		font-size: 1rem;
		color: #666;
		padding: 4px;
		box-sizing: border-box;
	}

	.note {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		line-height: 1;
	}

	.grid {
		display: flex;
		flex-direction: column;
		border: 2px solid var(--secondary-color);
	}

	.row {
		display: flex;
	}

	.cell {
		width: clamp(40px, 8vw, 60px);
		height: clamp(40px, 8vw, 60px);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(1.2rem, 3vw, 1.8rem);
		cursor: pointer;
		user-select: none;
		background-color: white;
		outline: none;
		position: relative;
	}

	.cell.selected {
		background-color: #bbdefb;
	}

	.cell.highlighted {
		background-color: #e3f2fd;
	}

	.cell.selected.highlighted {
		background-color: #bbdefb;
	}

	.cell.flashing {
		background-color: #ffebee;
		animation: flash 1s ease-in-out;
	}

	@keyframes flash {
		0% { background-color: #ffebee; }
		50% { background-color: #ffcdd2; }
		100% { background-color: #ffebee; }
	}

	.cell.border-right {
		border-right: 2px solid var(--secondary-color);
	}

	.cell.border-bottom {
		border-bottom: 2px solid var(--secondary-color);
	}

	.row:last-child .cell {
		border-bottom: 1px solid var(--border-color);
	}

	.row .cell:last-child {
		border-right: 1px solid var(--border-color);
	}

	.cell:hover {
		background-color: #f5f6fa;
	}

	.cell.selected:hover {
		background-color: #bbdefb;
	}

	.cell:focus {
		outline: none;
	}

	.cell.initial {
		font-weight: 600;
		color: var(--secondary-color);
	}

	.cell:not(.initial) {
		color: var(--primary-color);
	}

	@media (max-width: 768px) {
		.game-content {
			flex-direction: column;
			align-items: center;
		}

		.game-header {
			max-width: 100%;
		}

		.control-panel-container {
			width: 100%;
			max-width: 400px;
		}
	}
</style>
