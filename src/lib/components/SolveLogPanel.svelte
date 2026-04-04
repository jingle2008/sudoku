<script lang="ts">
	import { solveLogStore, stepCount, selectedStepIndex } from '$lib/stores/solveLogStore';

	let expanded = false;

	function toggle() {
		expanded = !expanded;
	}

	function clearLog() {
		solveLogStore.clear();
	}

	function handleStepClick(index: number) {
		solveLogStore.selectStep(index);
	}

	function handleClearSelection() {
		solveLogStore.clearSelection();
	}
</script>

<div class="solve-log-panel">
	<button class="log-header" on:click={toggle} aria-expanded={expanded}>
		<span class="toggle-arrow">{expanded ? '▾' : '▸'}</span>
		<span>Solve Log ({$stepCount} steps)</span>
	</button>

	{#if expanded}
		<div class="log-body">
			{#if $solveLogStore.steps.length === 0}
				<div class="log-empty">No steps recorded yet. Use the solver tools above to see the log.</div>
			{:else}
				<div class="log-list">
					{#each $solveLogStore.steps as step, i (i)}
						<button
							class="log-entry"
							class:step-selected={$selectedStepIndex === i}
							on:click={() => handleStepClick(i)}
						>
							<span class="step-number">{i + 1}.</span>
							<span class="step-description">{step.description}</span>
						</button>
					{/each}
				</div>
				<div class="log-actions">
					{#if $selectedStepIndex !== null}
						<button class="clear-selection-btn" on:click={handleClearSelection}>Clear Selection</button>
					{/if}
					<button class="clear-btn" on:click={clearLog}>Clear Log</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.solve-log-panel {
		width: 100%;
		max-width: 800px;
		background: var(--surface-color);
		border-radius: var(--radius);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.log-header {
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

	.log-header:hover {
		background: var(--surface-secondary);
	}

	.toggle-arrow {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.log-body {
		padding: 0 var(--space-4) var(--space-3);
	}

	.log-empty {
		color: var(--text-secondary);
		font-size: 13px;
		padding: var(--space-2) 0;
	}

	.log-list {
		max-height: 300px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.log-entry {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--surface-secondary);
		border-radius: var(--radius);
		font-size: 13px;
		line-height: 1.4;
		border: 1px solid transparent;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: all 0.12s ease;
	}

	.log-entry:hover {
		background: var(--primary-lighter);
		border-color: var(--primary-light);
	}

	.log-entry.step-selected {
		background: var(--primary-light);
		border-color: var(--primary-color);
	}

	.step-number {
		color: var(--text-secondary);
		font-weight: 600;
		font-family: var(--font-grid);
		flex-shrink: 0;
		min-width: 2rem;
		font-size: 12px;
	}

	.step-description {
		font-family: var(--font-grid);
		font-size: 12px;
		color: var(--text-color);
		word-break: break-word;
	}

	.log-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.clear-btn {
		padding: var(--space-2) var(--space-3);
		background: var(--surface-secondary);
		color: var(--text-color);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.12s ease;
	}

	.clear-btn:hover {
		background: var(--border-light);
	}

	.clear-selection-btn {
		padding: var(--space-2) var(--space-3);
		background: var(--surface-color);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.12s ease;
	}

	.clear-selection-btn:hover {
		background: var(--surface-secondary);
	}

	@media (max-width: 768px) {
		.solve-log-panel {
			max-width: 100%;
		}

		.log-list {
			max-height: 200px;
		}
	}
</style>
