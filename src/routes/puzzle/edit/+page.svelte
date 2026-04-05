<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import {
		gameStore,
		grid,
		isGameStarted,
		formattedTime,
		type Difficulty
	} from '$lib/stores/gameStore';

	let showExitConfirm = false;
	let showInvalidPuzzleDialog = false;

	onMount(() => {
		// Initialize an empty grid for editing
		gameStore.initializeEditingGrid();
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
		if (showExitConfirm || showInvalidPuzzleDialog) return;

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

	function handleCheckSolution() {
		if (gameStore.checkEditingSolution()) {
			// If valid, switch to solving mode
			gameStore.startSolvingMode();
		} else {
			showInvalidPuzzleDialog = true;
		}
	}

	function confirmExit() {
		gameStore.resetGame();
		goto('/');
		showExitConfirm = false;
	}

	function cancelExit() {
		showExitConfirm = false;
	}

	function closeInvalidDialog() {
		showInvalidPuzzleDialog = false;
	}
</script>

<div class="game-container">
	<div class="game-header">
		<button class="back-button" on:click={() => showExitConfirm = true}>
			<span class="icon">←</span>
			<span class="text">Exit</span>
		</button>
		<div class="mode-badge">
			Edit Mode
		</div>
		<div class="header-right">
			<div class="timer">
				<span class="timer-icon">⏱️</span>
				<span class="timer-value">{$formattedTime}</span>
			</div>
			<ThemeToggle />
		</div>
	</div>

	<div class="game-content">
		<div class="game-board">
			<div class="grid">
				{#each $gameStore.grid as row, rowIndex (rowIndex)}
					<div class="row">
						{#each row as cell, colIndex (colIndex)}
							<div
								class="cell"
								class:selected={cell.isSelected}
								class:border-right={colIndex % 3 === 2 && colIndex !== 8}
								class:border-bottom={rowIndex % 3 === 2 && rowIndex !== 8}
								class:border-left={colIndex % 3 === 0 && colIndex !== 0}
								class:border-top={rowIndex % 3 === 0 && rowIndex !== 0}
								class:initial={cell.isInitial}
								class:highlighted={cell.isHighlighted}
								class:in-scope={cell.isInScope && !cell.isSelected && !cell.isHighlighted}
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
				<ControlPanel on:check={handleCheckSolution} />
			</div>
		</div>
	</div>

	<ConfirmDialog
		isOpen={showExitConfirm}
		title="Exit Edit Mode?"
		message="All unsaved changes will be lost."
		confirmText="Exit"
		cancelText="Cancel"
		onConfirm={confirmExit}
		onCancel={cancelExit}
	/>

	<ConfirmDialog
		isOpen={showInvalidPuzzleDialog}
		title="Invalid Puzzle"
		message="This puzzle does not have a unique solution. Please modify it and try again."
		confirmText="OK"
		onConfirm={closeInvalidDialog}
		onCancel={closeInvalidDialog}
	/>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: var(--space-4);
		box-sizing: border-box;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 800px;
		margin-bottom: var(--space-2);
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
		transform: scale(0.97);
	}

	.mode-badge {
		font-weight: 600;
		padding: var(--space-2) var(--space-4);
		background: var(--primary-color);
		color: white;
		border-radius: 20px;
		font-size: 14px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.timer {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-color);
		width: 100px;
		justify-content: center;
	}

	.timer-icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.timer-value {
		width: 60px;
		text-align: center;
		font-family: var(--font-grid);
		font-size: 16px;
	}

	.game-content {
		display: flex;
		flex-direction: row;
		gap: var(--space-8);
		align-items: flex-start;
		justify-content: center;
		width: 100%;
		max-width: 900px;
	}

	.game-board {
		display: flex;
		flex-direction: row;
		gap: var(--space-8);
		align-items: flex-start;
	}

	.control-panel-container {
		width: 400px;
	}

	.grid {
		display: flex;
		flex-direction: column;
		border: 2.5px solid var(--grid-box-border);
		border-radius: 2px;
	}

	.row {
		display: flex;
	}

	.cell {
		width: clamp(40px, 8vw, 60px);
		height: clamp(40px, 8vw, 60px);
		border: 1px solid var(--grid-cell-border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-grid);
		font-size: 20px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		background-color: var(--surface-color);
		outline: none;
		position: relative;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition: background-color 0.1s ease;
	}

	.cell.initial {
		font-weight: 700;
		color: var(--grid-given-color);
	}

	.cell:not(.initial) {
		font-weight: 400;
		color: var(--grid-user-color);
	}

	.cell.selected {
		background-color: var(--grid-selected-bg);
		box-shadow: inset 0 0 0 2px var(--grid-selected-border);
		z-index: 1;
	}

	.cell.in-scope {
		background-color: var(--grid-scope-bg);
	}

	.cell.highlighted:not(.selected) {
		background-color: var(--grid-highlight-bg);
	}

	.cell.selected.highlighted {
		background-color: var(--grid-selected-bg);
		box-shadow: inset 0 0 0 2px var(--grid-selected-border);
	}

	.cell.flashing {
		background-color: var(--danger-light);
		animation: flash 1s ease-in-out;
	}

	@keyframes flash {
		0% { background-color: var(--danger-light); }
		50% { background-color: #fca5a5; }
		100% { background-color: var(--danger-light); }
	}

	.cell.border-right {
		border-right: 2.5px solid var(--grid-box-border);
	}

	.cell.border-bottom {
		border-bottom: 2.5px solid var(--grid-box-border);
	}

	.cell.border-left {
		border-left: 2.5px solid var(--grid-box-border);
	}

	.cell.border-top {
		border-top: 2.5px solid var(--grid-box-border);
	}

	.cell:hover {
		background-color: var(--primary-lighter);
	}

	.cell.selected:hover {
		background-color: var(--grid-selected-bg);
	}

	.cell:focus {
		outline: none;
	}

	.notes {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100%;
		height: 100%;
		padding: 2px;
		box-sizing: border-box;
	}

	.note {
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-grid);
		font-size: 10px;
		line-height: 1;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.game-container {
			padding: var(--space-2);
			gap: var(--space-3);
		}

		.game-content {
			flex-direction: column;
			align-items: center;
			gap: var(--space-2);
		}

		.game-board {
			display: inline-flex;
			flex-direction: column;
			gap: 0;
		}

		.game-header {
			max-width: 100%;
		}

		.control-panel-container {
			width: 100%;
		}

		.cell {
			min-width: 40px;
			min-height: 40px;
		}
	}
</style> 