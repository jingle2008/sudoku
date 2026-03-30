<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import SolveLogPanel from '$lib/components/SolveLogPanel.svelte';
	import { solveLogStore, highlightedCells } from '$lib/stores/solveLogStore';
	import {
		gameStore,
		grid,
		isGameStarted,
		formattedTime,
		canUndo,
		canRedo,
		type Difficulty
	} from '$lib/stores/gameStore';

	let showRestartConfirm = false;
	let showShortcuts = false;
	let currentDifficulty = 'medium';

	// Get difficulty from URL parameter
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		currentDifficulty = urlParams.get('difficulty') || 'medium';
		solveLogStore.clear();
		gameStore.startGame(currentDifficulty as Difficulty);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function isSolveHighlighted(row: number, col: number, cells: import('$lib/sudoku/coord').Coord[]): boolean {
		return cells.some(c => c.row === row && c.col === col);
	}

	function handleCellClick(row: number, col: number) {
		solveLogStore.clearSelection();
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

		const isMod = event.ctrlKey || event.metaKey;

		// Undo: Ctrl+Z / Cmd+Z
		if (isMod && !event.shiftKey && event.key === 'z') {
			event.preventDefault();
			if ($canUndo) gameStore.undo();
			return;
		}

		// Redo: Ctrl+Shift+Z / Cmd+Shift+Z
		if (isMod && event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
			event.preventDefault();
			if ($canRedo) gameStore.redo();
			return;
		}

		// Toggle shortcut help
		if (event.key === '?') {
			showShortcuts = !showShortcuts;
			return;
		}

		switch (event.key) {
			case 'p':
			case 'n':
				if ($isGameStarted) {
					gameStore.togglePencilMode();
				}
				return;
			case 'ArrowUp':
			case 'k':
				event.preventDefault();
				gameStore.moveSelection('up');
				return;
			case 'ArrowDown':
			case 'j':
				event.preventDefault();
				gameStore.moveSelection('down');
				return;
			case 'ArrowLeft':
			case 'h':
				event.preventDefault();
				gameStore.moveSelection('left');
				return;
			case 'ArrowRight':
			case 'l':
				event.preventDefault();
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
				solveLogStore.clearSelection();
				gameStore.setCellValue(parseInt(event.key));
				return;
			case 'Backspace':
			case 'Delete':
				solveLogStore.clearSelection();
				gameStore.setCellValue(null);
				return;
			default:
				return;
		}
	}

	function confirmRestart() {
		solveLogStore.clear();
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

	<button class="shortcuts-toggle" on:click={() => (showShortcuts = !showShortcuts)} title="Keyboard shortcuts (?)">
		?
	</button>

	{#if showShortcuts}
		<div class="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
			<div class="shortcuts-header">
				<strong>Keyboard Shortcuts</strong>
				<button class="shortcuts-close" on:click={() => (showShortcuts = false)}>&times;</button>
			</div>
			<dl class="shortcuts-list">
				<div><dt>1-9</dt><dd>Set cell value / toggle note</dd></div>
				<div><dt>Arrow keys</dt><dd>Navigate cells</dd></div>
				<div><dt>N / P</dt><dd>Toggle pencil mode</dd></div>
				<div><dt>Delete / Backspace</dt><dd>Clear cell</dd></div>
				<div><dt>Ctrl+Z</dt><dd>Undo</dd></div>
				<div><dt>Ctrl+Shift+Z</dt><dd>Redo</dd></div>
				<div><dt>H/J/K/L</dt><dd>Vim-style navigation</dd></div>
				<div><dt>?</dt><dd>Toggle this help</dd></div>
			</dl>
		</div>
	{/if}

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
							class:solve-highlight={isSolveHighlighted(rowIndex, colIndex, $highlightedCells)}
							role="button"
							tabindex="0"
							data-row={rowIndex}
							data-col={colIndex}
							on:click={() => handleCellClick(rowIndex, colIndex)}
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

	<SolveLogPanel />

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
		box-sizing: border-box;
		max-width: 100vw;
		overflow-x: hidden;
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
		width: clamp(36px, calc((100vw - 2rem) / 9), 60px);
		height: clamp(36px, calc((100vw - 2rem) / 9), 60px);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(1.1rem, 3vw, 1.8rem);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		background-color: white;
		outline: none;
		position: relative;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
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

	.cell.solve-highlight {
		box-shadow: inset 0 0 0 2.5px #f0a030;
		background-color: #fff8e1;
	}

	.cell.selected.solve-highlight {
		background-color: #bbdefb;
		box-shadow: inset 0 0 0 2.5px #f0a030;
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

	.grid {
		max-width: calc(100vw - 1.5rem);
	}

	.shortcuts-toggle {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
		background: white;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--secondary-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.shortcuts-toggle:hover {
		background: #f0f0f0;
	}

	.shortcuts-panel {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 340px;
		font-size: 0.85rem;
	}

	.shortcuts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.shortcuts-close {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #666;
		padding: 0 0.25rem;
	}

	.shortcuts-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.shortcuts-list div {
		display: flex;
		gap: 0.75rem;
	}

	.shortcuts-list dt {
		font-weight: 600;
		min-width: 120px;
		color: var(--secondary-color);
		font-family: monospace;
		font-size: 0.8rem;
	}

	.shortcuts-list dd {
		margin: 0;
		color: #555;
	}

	@media (max-width: 768px) {
		.game-container {
			justify-content: flex-start;
			padding: 0.5rem;
			padding-bottom: env(safe-area-inset-bottom, 2rem);
			gap: 0.5rem;
		}

		.game-content {
			flex-direction: column;
			align-items: center;
			gap: 0.75rem;
		}

		.game-header {
			max-width: 100%;
			margin-bottom: 0.25rem;
		}

		.control-panel-container {
			width: 100%;
			max-width: 400px;
		}

		.cell {
			width: calc((100vw - 1.5rem) / 9);
			height: calc((100vw - 1.5rem) / 9);
		}

		.notes {
			font-size: 0.65rem;
			padding: 1px;
		}

		.note {
			font-size: 0.6rem;
		}
	}

	@media (max-width: 375px) {
		.game-container {
			padding: 0.25rem;
		}

		.cell {
			width: calc((100vw - 1rem) / 9);
			height: calc((100vw - 1rem) / 9);
			font-size: 1rem;
		}

		.back-button {
			padding: 0.3rem 0.5rem;
			font-size: 0.8rem;
		}

		.difficulty-badge {
			padding: 0.3rem 0.6rem;
			font-size: 0.8rem;
		}

		.timer {
			font-size: 0.9rem;
			width: 80px;
		}
	}
</style>
