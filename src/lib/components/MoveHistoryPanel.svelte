<script lang="ts">
	import { gameStore, moveLog, moveLogCount } from '$lib/stores/gameStore';
	import { formatTime } from '$lib/stores/timerStore';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let expanded = false;
	let confirmStepIndex: number | null = null;
	let listEl: HTMLDivElement;

	$: currentStep = $moveLogCount - 1;
	$: showConfirm = confirmStepIndex !== null;
	$: confirmMessage = confirmStepIndex !== null
		? `Undo to step #${confirmStepIndex + 1}? This will undo ${$moveLogCount - 1 - confirmStepIndex} move${$moveLogCount - 1 - confirmStepIndex === 1 ? '' : 's'}.`
		: '';

	// Auto-scroll to bottom when new moves are added
	$: if ($moveLogCount && listEl) {
		requestAnimationFrame(() => {
			if (listEl) listEl.scrollTop = listEl.scrollHeight;
		});
	}

	function toggle() {
		expanded = !expanded;
	}

	function handleStepClick(index: number) {
		if (index >= currentStep) return;
		confirmStepIndex = index;
	}

	function confirmUndo() {
		if (confirmStepIndex !== null) {
			gameStore.undoToStep(confirmStepIndex);
			confirmStepIndex = null;
		}
	}

	function cancelUndo() {
		confirmStepIndex = null;
	}
</script>

<div class="history-panel">
	<button class="history-header" on:click={toggle} aria-expanded={expanded}>
		<span class="toggle-arrow">{expanded ? '▾' : '▸'}</span>
		<span>History ({$moveLogCount} moves)</span>
	</button>

	{#if expanded}
		<div class="history-body">
			{#if $moveLog.length === 0}
				<div class="history-empty">No moves yet. Start playing to see your move history.</div>
			{:else}
				<div class="history-list" bind:this={listEl}>
					{#each $moveLog as entry, i (i)}
						<button
							class="history-entry"
							class:current={i === currentStep}
							class:clickable={i < currentStep}
							on:click={() => handleStepClick(i)}
							disabled={i >= currentStep}
						>
							<span class="step-number">#{i + 1}</span>
							<span class="step-description">{entry.description}</span>
							<span class="step-time">{formatTime(entry.timestamp)}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmDialog
	isOpen={showConfirm}
	title="Undo to Step #{confirmStepIndex !== null ? confirmStepIndex + 1 : ''}"
	message={confirmMessage}
	confirmText="Undo"
	cancelText="Cancel"
	onConfirm={confirmUndo}
	onCancel={cancelUndo}
/>

<style>
	.history-panel {
		width: 100%;
		max-width: 800px;
		background: var(--surface-color);
		border-radius: var(--radius);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.history-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: var(--surface-color);
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-color);
		text-align: left;
		transition: background 0.12s ease;
	}

	.history-header:hover {
		background: var(--surface-secondary);
	}

	.toggle-arrow {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.history-body {
		padding: 0 var(--space-4) var(--space-3);
	}

	.history-empty {
		color: var(--text-secondary);
		font-size: 13px;
		padding: var(--space-2) 0;
	}

	.history-list {
		max-height: 200px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.history-entry {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--surface-secondary);
		border-radius: var(--radius);
		font-size: 13px;
		line-height: 1.4;
		border: 1px solid transparent;
		text-align: left;
		width: 100%;
		transition: all 0.12s ease;
	}

	.history-entry.clickable {
		cursor: pointer;
	}

	.history-entry.clickable:hover {
		background: var(--primary-lighter);
		border-color: var(--primary-light);
	}

	.history-entry.current {
		background: var(--primary-light);
		border-color: var(--primary-color);
	}

	.history-entry:disabled:not(.current) {
		cursor: default;
	}

	.step-number {
		color: var(--text-secondary);
		font-weight: 600;
		font-family: var(--font-grid);
		flex-shrink: 0;
		min-width: 2.5rem;
		font-size: 12px;
	}

	.step-description {
		font-family: var(--font-grid);
		font-size: 12px;
		color: var(--text-color);
		flex: 1;
	}

	.step-time {
		color: var(--text-secondary);
		font-family: var(--font-grid);
		font-size: 11px;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.history-panel {
			max-width: 100%;
		}
	}
</style>
