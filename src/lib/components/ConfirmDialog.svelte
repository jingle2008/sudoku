<script lang="ts">
	export let title: string;
	export let message: string;
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let onConfirm: () => void;
	export let onCancel: () => void;
	export let isOpen = false;

	// Manage focus trapping inside modal for accessibility
	let dialogElement: HTMLDialogElement;

	// Focus the dialog when opened
	$: if (isOpen && dialogElement) {
		dialogElement.showModal();
		dialogElement.focus();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
		// Stop propagation of all keyboard events
		event.stopPropagation();
	}
</script>

{#if isOpen}
	<dialog
		bind:this={dialogElement}
		class="modal-overlay"
		on:click={onCancel}
		on:keydown|stopPropagation={handleKeyDown}
		aria-modal="true"
		aria-labelledby="dialog-title"
		aria-describedby="dialog-message"
	>
		<div
			class="modal"
			role="document"
		>
			<h2 id="dialog-title">{title}</h2>
			<p id="dialog-message">{message}</p>
			<div class="modal-buttons">
				<button class="cancel" on:click={onCancel} aria-label="Cancel">{cancelText}</button>
				<button class="confirm" on:click={onConfirm} aria-label="Confirm">{confirmText}</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		border: none;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}

	.modal {
		background: var(--surface-color);
		padding: var(--space-8);
		border-radius: var(--radius);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
		max-width: 400px;
		width: 90%;
		position: relative;
		margin: auto;
	}

	.modal h2 {
		margin: 0 0 var(--space-3) 0;
		color: var(--text-color);
		font-size: 18px;
	}

	.modal p {
		margin: 0 0 var(--space-6) 0;
		color: var(--text-secondary);
		font-size: 14px;
		line-height: 1.5;
	}

	.modal-buttons {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	.modal-buttons button {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
		min-height: 40px;
		transition: all 0.12s ease;
	}

	.modal-buttons .cancel {
		background: var(--surface-secondary);
		color: var(--text-color);
		border: 1px solid var(--border-color);
	}

	.modal-buttons .cancel:hover {
		background: var(--border-light);
	}

	.modal-buttons .confirm {
		background: var(--danger-color);
		color: white;
		border: none;
	}

	.modal-buttons .confirm:hover {
		background: #dc2626;
	}
</style>
