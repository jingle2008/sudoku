<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initTheme } from '$lib/stores/themeStore';

	let { children } = $props();

	onMount(() => {
		initTheme();
	});
</script>

{@render children()}
