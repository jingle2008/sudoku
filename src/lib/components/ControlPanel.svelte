<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		gameStore,
		isPencilMode,
		isGameStarted,
		canUndo,
		canRedo,
		canDelete,
		isComplete,
		isNewBestTime,
		previousBestTime,
		elapsedTime
	} from '$lib/stores/gameStore';
	import { formatTime } from '$lib/stores/timerStore';

	const dispatch = createEventDispatcher<{ restart: void }>();

	let solverToolsOpen = false;
	let selectedNumber: number | null = null;
	let longPressActiveBtn: number | null = null;
	let longPressFiredBtn: number | null = null;

	// Long press state
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	const LONG_PRESS_MS = 500;

	function handleNumberClick(num: number) {
		selectedNumber = num;
		gameStore.setCellValue(num);
	}

	function handleLongPress(num: number) {
		longPressFiredBtn = num;
		selectedNumber = num;
		gameStore.toggleNote(num);
	}

	function onTouchStart(num: number, event: TouchEvent) {
		longPressActiveBtn = num;
		longPressFiredBtn = null;
		longPressTimer = setTimeout(() => {
			handleLongPress(num);
			longPressActiveBtn = null;
		}, LONG_PRESS_MS);
	}

	function onTouchEnd(num: number, event: TouchEvent) {
		if (longPressTimer !== null) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		// If long press already fired, prevent the click
		if (longPressFiredBtn === num) {
			event.preventDefault();
			longPressFiredBtn = null;
		}
		longPressActiveBtn = null;
	}

	function onTouchCancel() {
		if (longPressTimer !== null) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		longPressActiveBtn = null;
		longPressFiredBtn = null;
	}

	function onContextMenu(event: Event) {
		event.preventDefault();
	}

	// Keyboard shortcuts for control panel
	function handleKeyDown(event: KeyboardEvent) {
		if (!$isGameStarted) return;

		if (event.key >= '1' && event.key <= '9') {
			handleNumberClick(parseInt(event.key, 10));
		} else if (event.key.toLowerCase() === 'p') {
			gameStore.setPencilMode(true);
		} else if (event.key.toLowerCase() === 'o') {
			gameStore.setPencilMode(false);
		}
	}
</script>

<div class="control-panel" role="region" aria-label="Sudoku control panel">
	<!-- Number Pad: 3x3 grid -->
	<div class="number-pad" role="group" aria-label="Number selection">
		{#each Array(9) as unused, i (i)}
			<button
				class="num-btn"
				class:num-selected={selectedNumber === i + 1}
				class:long-press-active={longPressActiveBtn === i + 1}
				class:long-press-fired={longPressFiredBtn === i + 1}
				on:click={() => handleNumberClick(i + 1)}
				on:touchstart|passive={(e) => onTouchStart(i + 1, e)}
				on:touchend={(e) => onTouchEnd(i + 1, e)}
				on:touchcancel={onTouchCancel}
				on:contextmenu={onContextMenu}
				disabled={!$isGameStarted}
				aria-label={`Set number ${i + 1}`}
			>
				{i + 1}
				{#if longPressFiredBtn === i + 1}
					<span class="pencil-flash">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Action Bar: single row with all actions -->
	<div class="action-bar" role="toolbar" aria-label="Game actions">
		<button
			class="action-icon-btn"
			on:click={() => gameStore.undo()}
			disabled={!$canUndo}
			title="Undo"
			aria-label="Undo last action"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
			<span class="action-label">Undo</span>
		</button>
		<button
			class="action-icon-btn"
			on:click={() => gameStore.redo()}
			disabled={!$canRedo}
			title="Redo"
			aria-label="Redo last undone action"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
			<span class="action-label">Redo</span>
		</button>
		<button
			class="action-icon-btn"
			on:click={() => gameStore.setCellValue(null)}
			disabled={!$canDelete}
			title="Delete"
			aria-label="Delete current cell value"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
			<span class="action-label">Delete</span>
		</button>
		<button
			class="action-icon-btn pencil-toggle"
			class:pencil-active={$isPencilMode}
			on:click={() => gameStore.togglePencilMode()}
			disabled={!$isGameStarted}
			title={$isPencilMode ? 'Switch to Pen mode' : 'Switch to Pencil mode'}
			aria-label={$isPencilMode ? 'Pencil mode active, click to switch to Pen' : 'Pen mode active, click to switch to Pencil'}
			aria-pressed={$isPencilMode}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
			<span class="action-label">Pencil</span>
		</button>
		<button
			class="action-icon-btn"
			on:click={() => dispatch('restart')}
			title="Restart Game"
			aria-label="Restart the game"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
			<span class="action-label">Restart</span>
		</button>
	</div>

	<!-- Solver Tools (collapsible, desktop only) -->
	<div class="solver-tools">
		<button class="solver-toggle" on:click={() => (solverToolsOpen = !solverToolsOpen)} aria-expanded={solverToolsOpen}>
			<span class="toggle-icon">{solverToolsOpen ? '▾' : '▸'}</span>
			Solver Tools
		</button>
		{#if solverToolsOpen}
			<div class="solver-buttons">
				<button
					class="solver-btn"
					on:click={() => gameStore.applyAutoNotes()}
					disabled={!$isGameStarted}
					title="Auto Notes"
					aria-label="Automatically populate notes for empty cells"
				>
					Auto Notes
				</button>
				<button
					class="solver-btn"
					on:click={() => gameStore.applyNakedSingles()}
					disabled={!$isGameStarted}
					title="Naked Singles"
					aria-label="Automatically fill cells containing only one possible value"
				>
					Naked Singles
				</button>
				<button
					class="solver-btn"
					on:click={() => gameStore.applyNakedPairs()}
					disabled={!$isGameStarted}
					title="Naked Pairs"
					aria-label="Automatically fill cells containing only two possible values"
				>
					Naked Pairs
				</button>
			</div>
		{/if}
	</div>

	{#if $isComplete}
		<div class="completion-message" class:new-best={$isNewBestTime}>
			{#if $isNewBestTime}
				<div class="celebration">
					<span class="trophy">&#127942;</span>
					<span>New Best Time!</span>
				</div>
			{/if}
			<div>Congratulations! Puzzle complete!</div>
			<div class="completion-time">Time: {formatTime($elapsedTime)}</div>
			{#if $isNewBestTime && $previousBestTime !== null}
				<div class="previous-best">Previous best: {formatTime($previousBestTime)}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
.control-panel {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	padding: var(--space-4);
	box-sizing: border-box;
	background: var(--surface-color);
	border-radius: var(--radius);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
	width: 100%;
	max-width: 450px;
	margin: 0 auto;
}

/* Number pad: always 3x3 */
.number-pad {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-2);
}

.num-btn {
	padding: 0;
	font-family: var(--font-grid);
	font-size: 28px;
	font-weight: 500;
	border: 1.5px solid var(--border-light);
	background: var(--surface-secondary);
	color: var(--text-color);
	cursor: pointer;
	border-radius: var(--radius);
	aspect-ratio: 1;
	min-height: 60px;
	min-width: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;
	transition: all 0.12s ease;
	position: relative;
}

.num-btn:hover:not(:disabled) {
	background: var(--border-light);
	border-color: var(--border-color);
}

.num-btn.num-selected {
	background: var(--primary-color);
	color: white;
	border-color: var(--primary-color);
}

.num-btn:active:not(:disabled) {
	transform: scale(0.95);
}

.num-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

/* Long press visual feedback */
.num-btn.long-press-active {
	transform: scale(0.90);
	transition: transform 0.3s ease;
}

.num-btn.long-press-fired {
	border-color: var(--primary-color);
	box-shadow: 0 0 0 2px var(--primary-color);
}

/* Pencil icon flash on long press */
.pencil-flash {
	position: absolute;
	top: 4px;
	right: 4px;
	color: var(--primary-color);
	animation: pencil-flash-anim 0.6s ease-out forwards;
	pointer-events: none;
}

@keyframes pencil-flash-anim {
	0% { opacity: 1; transform: scale(1.2); }
	100% { opacity: 0; transform: scale(0.8); }
}

/* Action bar: single row of icon buttons */
.action-bar {
	display: flex;
	gap: var(--space-2);
}

.action-icon-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	padding: var(--space-2) var(--space-1);
	border: 1.5px solid var(--border-color);
	border-radius: var(--radius);
	cursor: pointer;
	background: var(--surface-color);
	color: var(--text-secondary);
	min-height: 48px;
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;
	transition: all 0.15s ease;
}

.action-icon-btn:hover:not(:disabled) {
	background: var(--surface-secondary);
	border-color: var(--text-secondary);
	color: var(--text-color);
}

.action-icon-btn:active:not(:disabled) {
	transform: scale(0.95);
}

.action-icon-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	pointer-events: none;
}

.action-label {
	font-size: 11px;
	font-weight: 500;
	line-height: 1;
}

/* Pencil toggle active state */
.pencil-toggle.pencil-active {
	background: var(--primary-color);
	color: white;
	border-color: var(--primary-color);
}

.pencil-toggle.pencil-active:hover:not(:disabled) {
	background: var(--primary-hover, #2563eb);
	border-color: var(--primary-hover, #2563eb);
	color: white;
}

/* Solver tools */
.solver-tools {
	border-top: 1px solid var(--border-light);
	padding-top: var(--space-2);
}

.solver-toggle {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
	padding: var(--space-2) 0;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	color: var(--text-secondary);
	text-align: left;
}

.solver-toggle:hover {
	color: var(--text-color);
}

.toggle-icon {
	font-size: 12px;
}

.solver-buttons {
	display: flex;
	gap: var(--space-2);
	margin-top: var(--space-2);
}

.solver-btn {
	flex: 1;
	padding: var(--space-2) var(--space-2);
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	color: var(--text-secondary);
	background: var(--surface-color);
	min-height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;
	transition: all 0.12s ease;
}

.solver-btn:hover:not(:disabled) {
	background: var(--surface-secondary);
	color: var(--text-color);
	border-color: var(--text-secondary);
}

.solver-btn:active:not(:disabled) {
	transform: scale(0.97);
}

.solver-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	pointer-events: none;
}

/* Check button: green outline */
.check-btn {
	color: var(--success-color);
	border-color: var(--success-color);
}

.check-btn:hover:not(:disabled) {
	background: var(--success-light);
	border-color: var(--success-color);
}

/* Completion */
.completion-message {
	text-align: center;
	padding: var(--space-3);
	background: var(--success-light);
	color: var(--success-color);
	border-radius: var(--radius);
	font-weight: 600;
	font-size: 14px;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.completion-message.new-best {
	animation: celebrate 0.6s ease-out;
	border: 2px solid var(--success-color);
}

.celebration {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	font-size: 16px;
	font-weight: 700;
}

.trophy {
	font-size: 20px;
	animation: bounce 0.6s ease infinite alternate;
}

.completion-time {
	font-family: var(--font-grid);
	font-size: 13px;
	font-weight: 500;
}

.previous-best {
	font-size: 12px;
	font-weight: 400;
	color: var(--text-secondary);
}

@keyframes celebrate {
	0% { transform: scale(0.95); opacity: 0.7; }
	50% { transform: scale(1.03); }
	100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
	from { transform: translateY(0); }
	to { transform: translateY(-4px); }
}

/* Mobile */
@media (max-width: 768px) {
	.control-panel {
		max-width: 100%;
		gap: var(--space-2);
		padding: var(--space-2);
	}

	/* Bigger number buttons on mobile */
	.number-pad {
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-2);
	}

	.num-btn {
		aspect-ratio: auto;
		min-height: 56px;
		font-size: 24px;
	}

	.action-bar {
		gap: var(--space-1);
	}

	.action-icon-btn {
		min-height: 40px;
		padding: var(--space-1) 0;
	}

	.action-icon-btn svg {
		width: 18px;
		height: 18px;
	}

	.action-label {
		display: none;
	}

	.solver-tools {
		display: none;
	}
}

@media (max-width: 375px) {
	.control-panel {
		padding: var(--space-1);
		gap: var(--space-1);
	}

	.num-btn {
		min-height: 48px;
		font-size: 22px;
	}

	.action-icon-btn {
		min-height: 36px;
	}

	.action-icon-btn svg {
		width: 16px;
		height: 16px;
	}
}
</style>
