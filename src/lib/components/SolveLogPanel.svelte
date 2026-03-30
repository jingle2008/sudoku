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
		<span class="toggle-arrow" class:expanded>{expanded ? '▼' : '▶'}</span>
		<span>Solve Log ({$stepCount} steps)</span>
	</button>

	{#if expanded}
		<div class="log-body">
			{#if $solveLogStore.steps.length === 0}
				<div class="log-empty">No steps recorded yet. Use the solver buttons above to see the log.</div>
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
						<button class="clear-selection-button" on:click={handleClearSelection}>Clear Selection</button>
					{/if}
					<button class="clear-button" on:click={clearLog}>Clear Log</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.solve-log-panel {
		width: 100%;
		max-width: 800px;
		background: #f8f9fa;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border: none;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--secondary-color);
		text-align: left;
	}

	.log-header:hover {
		background: #e9ecef;
	}

	.toggle-arrow {
		font-size: 0.75rem;
		transition: transform 0.2s ease;
	}

	.log-body {
		padding: 0 1rem 0.75rem;
	}

	.log-empty {
		color: #6c757d;
		font-size: 0.85rem;
		padding: 0.5rem 0;
	}

	.log-list {
		max-height: 300px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.log-entry {
		display: flex;
		gap: 0.5rem;
		padding: 0.4rem 0.5rem;
		background: white;
		border-radius: 4px;
		font-size: 0.85rem;
		line-height: 1.4;
		border: 1px solid #e9ecef;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 0.15s ease;
	}

	.log-entry:hover {
		background: #eef3ff;
	}

	.log-entry.step-selected {
		background: #d0e4ff;
		border-color: #90b8f8;
	}

	.step-number {
		color: #6c757d;
		font-weight: 600;
		font-family: monospace;
		flex-shrink: 0;
		min-width: 2rem;
	}

	.step-description {
		font-family: monospace;
		font-size: 0.8rem;
		color: #333;
		word-break: break-word;
	}

	.log-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.clear-button {
		padding: 0.4rem 0.8rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.clear-button:hover {
		background: #5a6268;
	}

	.clear-selection-button {
		padding: 0.4rem 0.8rem;
		background: #e9ecef;
		color: #495057;
		border: 1px solid #ced4da;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.clear-selection-button:hover {
		background: #dee2e6;
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
