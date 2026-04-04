<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import CelebrationOverlay from '$lib/components/CelebrationOverlay.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import SolveLogPanel from '$lib/components/SolveLogPanel.svelte';
	import MoveHistoryPanel from '$lib/components/MoveHistoryPanel.svelte';
	import { solveLogStore, highlightedCells } from '$lib/stores/solveLogStore';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import {
		gameStore,
		grid,
		isGameStarted,
		isGenerating,
		isComplete,
		isNewBestTime,
		previousBestTime,
		elapsedTime,
		formattedTime,
		difficulty,
		canUndo,
		canRedo,
		type Difficulty
	} from '$lib/stores/gameStore';
	import { formatTime } from '$lib/stores/timerStore';

	let showCelebration = false;
	let showRestartConfirm = false;
	let showShortcuts = false;
	let currentDifficulty = 'medium';

	// Long press on grid cell to temporarily toggle pencil mode
	let cellLongPressTimer: ReturnType<typeof setTimeout> | null = null;
	let cellLongPressFired = false;
	const CELL_LONG_PRESS_MS = 500;

	function onCellTouchStart(row: number, col: number) {
		cellLongPressFired = false;
		cellLongPressTimer = setTimeout(() => {
			cellLongPressFired = true;
			gameStore.selectCell(row, col);
			gameStore.togglePencilMode();
		}, CELL_LONG_PRESS_MS);
	}

	function onCellTouchEnd(event: TouchEvent) {
		if (cellLongPressTimer !== null) {
			clearTimeout(cellLongPressTimer);
			cellLongPressTimer = null;
		}
		if (cellLongPressFired) {
			event.preventDefault();
			cellLongPressFired = false;
		}
	}

	function onCellTouchCancel() {
		if (cellLongPressTimer !== null) {
			clearTimeout(cellLongPressTimer);
			cellLongPressTimer = null;
		}
		cellLongPressFired = false;
	}

	function onCellContextMenu(event: Event) {
		event.preventDefault();
	}

	// Get difficulty from URL parameter
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		currentDifficulty = urlParams.get('difficulty') || 'medium';
		solveLogStore.clear();
		gameStore.startGame(currentDifficulty as Difficulty);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			// Record abandoned game when navigating away
			gameStore.recordAbandoned();
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

	// Trigger celebration when puzzle is completed
	$: if ($isComplete && !showCelebration) {
		showCelebration = true;
	}

	function handleCelebrationNewGame() {
		showCelebration = false;
		goto('/difficulty');
	}

	function goToStats() {
		goto('/stats');
	}
</script>

<div class="game-container">
	<div class="game-header">
		<div class="header-left">
			<button class="back-button" on:click={goToHome}>
				<span class="icon">←</span>
				<span class="text">Home</span>
			</button>
			<button class="back-button" on:click={goToStats}>
				<span class="text">Stats</span>
			</button>
		</div>
		<div class="difficulty-badge">
			{currentDifficulty}
		</div>
		<div class="header-right">
			<div class="timer">
				<span class="timer-icon">⏱️</span>
				<span class="timer-value">{$formattedTime}</span>
			</div>
			<ThemeToggle />
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
		{#if $isGenerating}
			<div class="loading-overlay">
				<div class="spinner"></div>
				<p>Generating puzzle...</p>
			</div>
		{/if}
		<div class="grid" class:generating={$isGenerating} class:complete-glow={$isComplete}>
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
							class:same-number={cell.isHighlighted && !cell.isSelected}
							class:flashing={cell.isFlashing}
							class:solve-highlight={isSolveHighlighted(rowIndex, colIndex, $highlightedCells)}
							role="button"
							tabindex="0"
							data-row={rowIndex}
							data-col={colIndex}
							on:click={() => handleCellClick(rowIndex, colIndex)}
							on:keydown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
							on:touchstart|passive={() => onCellTouchStart(rowIndex, colIndex)}
							on:touchend={onCellTouchEnd}
							on:touchcancel={onCellTouchCancel}
							on:contextmenu={onCellContextMenu}
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
	<MoveHistoryPanel />

	<ConfirmDialog
		isOpen={showRestartConfirm}
		title="Restart Game?"
		message="This will clear all your progress."
		confirmText="Restart"
		cancelText="Cancel"
		onConfirm={confirmRestart}
		onCancel={cancelRestart}
	/>

	{#if showCelebration}
		<CelebrationOverlay
			elapsedTime={$elapsedTime}
			isNewBestTime={$isNewBestTime}
			previousBestTime={$previousBestTime}
			difficulty={$difficulty}
			onNewGame={handleCelebrationNewGame}
		/>
	{/if}
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
		max-width: 100vw;
		overflow-x: hidden;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 800px;
		margin-bottom: var(--space-2);
	}

	.header-left {
		display: flex;
		gap: var(--space-2);
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

	.difficulty-badge {
		text-transform: capitalize;
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

	.control-panel-container {
		width: 400px;
	}

	/* Grid */
	.grid {
		display: flex;
		flex-direction: column;
		border: 2.5px solid var(--grid-box-border);
		border-radius: 2px;
		max-width: calc(100vw - 1.5rem);
	}

	.grid.generating {
		opacity: 0.3;
		pointer-events: none;
	}

	.grid.complete-glow :global(.cell) {
		animation: goldenGlow 0.3s ease-in-out;
	}

	@keyframes goldenGlow {
		0% { background-color: var(--surface-color); }
		50% { background-color: #fbbf24; box-shadow: inset 0 0 12px rgba(251, 191, 36, 0.6); }
		100% { background-color: var(--surface-color); }
	}

	.row {
		display: flex;
	}

	.cell {
		width: clamp(40px, calc((100vw - 2rem) / 9), 60px);
		height: clamp(40px, calc((100vw - 2rem) / 9), 60px);
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

	/* Given (pre-filled) numbers */
	.cell.initial {
		font-weight: 700;
		color: var(--grid-given-color);
	}

	/* User-entered numbers */
	.cell:not(.initial) {
		font-weight: 400;
		color: var(--grid-user-color);
	}

	/* Selected cell */
	.cell.selected {
		background-color: var(--grid-selected-bg);
		box-shadow: inset 0 0 0 2px var(--grid-selected-border);
		z-index: 1;
	}

	/* Same-number highlight */
	.cell.same-number {
		background-color: var(--grid-same-number-bg);
	}

	/* Row/col/box highlight (when cell selected) */
	.cell.highlighted:not(.selected):not(.same-number) {
		background-color: var(--grid-highlight-bg);
	}

	.cell.selected.highlighted {
		background-color: var(--grid-selected-bg);
		box-shadow: inset 0 0 0 2px var(--grid-selected-border);
	}

	/* Solve step highlight */
	.cell.solve-highlight {
		box-shadow: inset 0 0 0 2.5px #f0a030;
		background-color: #fff8e1;
	}

	.cell.selected.solve-highlight {
		background-color: var(--grid-selected-bg);
		box-shadow: inset 0 0 0 2px var(--grid-selected-border);
	}

	/* Error flash */
	.cell.flashing {
		background-color: var(--danger-light);
		animation: flash 1s ease-in-out;
	}

	@keyframes flash {
		0% { background-color: var(--danger-light); }
		50% { background-color: #fca5a5; }
		100% { background-color: var(--danger-light); }
	}

	/* 3x3 box borders */
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

	/* Notes */
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

	/* Loading */
	.loading-overlay {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		z-index: 5;
		padding-top: 8rem;
	}

	.loading-overlay p {
		font-size: 14px;
		color: var(--text-color);
		font-weight: 500;
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border-light);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Keyboard shortcuts */
	.shortcuts-toggle {
		position: fixed;
		bottom: var(--space-4);
		right: var(--space-4);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
		background: var(--surface-color);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-color);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.shortcuts-toggle:hover {
		background: var(--surface-secondary);
	}

	.shortcuts-panel {
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: var(--space-3) var(--space-4);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		width: 100%;
		max-width: 340px;
		font-size: 13px;
	}

	.shortcuts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.shortcuts-close {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: var(--text-secondary);
		padding: 0 var(--space-1);
	}

	.shortcuts-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.shortcuts-list div {
		display: flex;
		gap: var(--space-3);
	}

	.shortcuts-list dt {
		font-weight: 600;
		min-width: 120px;
		color: var(--text-color);
		font-family: var(--font-grid);
		font-size: 12px;
	}

	.shortcuts-list dd {
		margin: 0;
		color: var(--text-secondary);
	}

	/* Mobile */
	@media (max-width: 768px) {
		.game-container {
			justify-content: flex-start;
			padding: var(--space-2);
			padding-bottom: env(safe-area-inset-bottom, 2rem);
			gap: var(--space-3);
		}

		.game-content {
			flex-direction: column;
			align-items: center;
			gap: var(--space-4);
		}

		.game-header {
			max-width: 100%;
			margin-bottom: var(--space-1);
		}

		.control-panel-container {
			width: 100%;
			max-width: 400px;
		}

		.cell {
			width: calc((100vw - 1.5rem) / 9);
			height: calc((100vw - 1.5rem) / 9);
			min-width: 40px;
			min-height: 40px;
		}

		.notes {
			padding: 1px;
		}

		.note {
			font-size: 8px;
		}
	}

	@media (max-width: 375px) {
		.game-container {
			padding: var(--space-1);
		}

		.cell {
			width: calc((100vw - 1rem) / 9);
			height: calc((100vw - 1rem) / 9);
			font-size: 16px;
		}

		.back-button {
			padding: var(--space-1) var(--space-2);
			font-size: 12px;
		}

		.difficulty-badge {
			padding: var(--space-1) var(--space-3);
			font-size: 12px;
		}

		.timer {
			font-size: 0.9rem;
			width: 80px;
		}
	}
</style>
