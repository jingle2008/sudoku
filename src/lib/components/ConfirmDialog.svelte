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
		open
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
		background: rgba(0, 0, 0, 0.5);
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
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 90%;
		position: relative;
		margin: auto;
	}

	.modal h2 {
		margin: 0 0 1rem 0;
		color: var(--secondary-color);
	}

	.modal p {
		margin: 0 0 1.5rem 0;
		color: #666;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.modal-buttons button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.modal-buttons .cancel {
		background: #e9ecef;
		color: #495057;
	}

	.modal-buttons .confirm {
		background: var(--danger-color);
		color: white;
	}
</style>
