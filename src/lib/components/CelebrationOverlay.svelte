<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTime } from '$lib/stores/timerStore';
	import { statsStore } from '$lib/stores/statsStore';
	import type { Difficulty } from '$lib/stores/gameStore';

	export let elapsedTime: number;
	export let isNewBestTime: boolean;
	export let previousBestTime: number | null;
	export let difficulty: Difficulty;
	export let onNewGame: () => void;

	let canvas: HTMLCanvasElement;
	let animationId: number;
	let showOverlay = false;
	let overlayVisible = false;

	type Particle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		width: number;
		height: number;
		color: string;
		rotation: number;
		rotationSpeed: number;
		opacity: number;
		shape: 'rect' | 'circle';
	};

	const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444'];
	const PARTICLE_COUNT = 120;
	const DURATION = 3000;
	const GRAVITY = 0.12;
	const WIND = 0.02;

	let particles: Particle[] = [];
	let startTime = 0;

	function createParticles(cx: number, cy: number) {
		particles = [];
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 4 + Math.random() * 8;
			particles.push({
				x: cx,
				y: cy,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 4,
				width: 4 + Math.random() * 6,
				height: 4 + Math.random() * 10,
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.3,
				opacity: 1,
				shape: Math.random() > 0.5 ? 'rect' : 'circle'
			});
		}
	}

	function animate(timestamp: number) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const elapsed = timestamp - startTime;
		const fadeStart = DURATION * 0.6;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let alive = false;
		for (const p of particles) {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += GRAVITY;
			p.vx += WIND;
			p.rotation += p.rotationSpeed;

			if (elapsed > fadeStart) {
				p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (DURATION - fadeStart));
			}

			if (p.opacity <= 0) continue;
			alive = true;

			ctx.save();
			ctx.globalAlpha = p.opacity;
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rotation);
			ctx.fillStyle = p.color;

			if (p.shape === 'rect') {
				ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
			} else {
				ctx.beginPath();
				ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.restore();
		}

		if (alive && elapsed < DURATION) {
			animationId = requestAnimationFrame(animate);
		}
	}

	function startConfetti() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		createParticles(canvas.width / 2, canvas.height / 2);
		startTime = performance.now();
		animationId = requestAnimationFrame(animate);
	}

	function getStats() {
		const stats = statsStore.getStats(difficulty);
		return {
			gamesCompleted: stats.gamesCompleted,
			currentStreak: stats.currentStreak
		};
	}

	$: stats = getStats();

	onMount(() => {
		// Start confetti immediately
		startConfetti();
		// Show overlay after a brief delay so confetti is already going
		setTimeout(() => {
			showOverlay = true;
			// Trigger CSS transition
			requestAnimationFrame(() => {
				overlayVisible = true;
			});
		}, 400);
	});

	onDestroy(() => {
		if (animationId) cancelAnimationFrame(animationId);
	});

	function handleNewGame() {
		onNewGame();
	}

	function handleViewStats() {
		goto('/stats');
	}
</script>

<div class="celebration-root">
	<canvas bind:this={canvas} class="confetti-canvas"></canvas>

	{#if showOverlay}
		<div class="overlay-backdrop" class:visible={overlayVisible}>
			<div class="victory-card" class:visible={overlayVisible}>
				<div class="checkmark-circle">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				</div>

				<h2 class="victory-title">Puzzle Complete!</h2>

				<div class="time-display">
					Your time: <strong>{formatTime(elapsedTime)}</strong>
				</div>

				{#if isNewBestTime}
					<div class="new-best">
						<span class="trophy">🏆</span> New Best Time!
					</div>
				{/if}

				{#if isNewBestTime && previousBestTime !== null}
					<div class="previous-best">
						Previous best: {formatTime(previousBestTime)}
					</div>
				{/if}

				<div class="stats-line">
					Games completed: {stats.gamesCompleted} | Win streak: {stats.currentStreak}
				</div>

				<div class="button-row">
					<button class="btn btn-primary" on:click={handleNewGame}>
						New Game
					</button>
					<button class="btn btn-secondary" on:click={handleViewStats}>
						View Stats
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.celebration-root {
		position: fixed;
		inset: 0;
		z-index: 1000;
		pointer-events: none;
	}

	.confetti-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.overlay-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: all;
		transition: background 0.4s ease;
	}

	.overlay-backdrop.visible {
		background: rgba(0, 0, 0, 0.5);
	}

	:global(html.dark) .overlay-backdrop.visible {
		background: rgba(0, 0, 0, 0.7);
	}

	.victory-card {
		background: var(--surface-color);
		border-radius: 16px;
		padding: 40px 36px 32px;
		text-align: center;
		max-width: 380px;
		width: calc(100% - 32px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		transform: scale(0.8);
		opacity: 0;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
	}

	.victory-card.visible {
		transform: scale(1);
		opacity: 1;
	}

	.checkmark-circle {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--success-color);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		animation: checkBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
	}

	.checkmark-circle svg {
		width: 32px;
		height: 32px;
	}

	@keyframes checkBounce {
		0% { transform: scale(0); }
		60% { transform: scale(1.2); }
		100% { transform: scale(1); }
	}

	.victory-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-color);
		margin: 0 0 16px;
	}

	.time-display {
		font-size: 16px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.time-display strong {
		color: var(--text-color);
		font-family: var(--font-grid);
	}

	.new-best {
		font-size: 18px;
		font-weight: 700;
		color: #f59e0b;
		margin: 12px 0 4px;
		animation: goldGlow 1.5s ease-in-out infinite alternate;
	}

	@keyframes goldGlow {
		from { text-shadow: 0 0 4px rgba(245, 158, 11, 0.3); }
		to { text-shadow: 0 0 16px rgba(245, 158, 11, 0.6), 0 0 32px rgba(245, 158, 11, 0.3); }
	}

	.trophy {
		font-size: 20px;
	}

	.previous-best {
		font-size: 14px;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}

	.stats-line {
		font-size: 13px;
		color: var(--text-secondary);
		margin: 16px 0 24px;
		padding-top: 16px;
		border-top: 1px solid var(--border-light);
	}

	.button-row {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.btn {
		padding: 10px 24px;
		border-radius: var(--radius);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.btn:active {
		transform: scale(0.97);
	}

	.btn-primary {
		background: var(--primary-color);
		color: white;
	}

	.btn-primary:hover {
		background: var(--primary-hover);
	}

	.btn-secondary {
		background: var(--surface-secondary);
		color: var(--text-color);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover {
		background: var(--border-light);
	}
</style>
