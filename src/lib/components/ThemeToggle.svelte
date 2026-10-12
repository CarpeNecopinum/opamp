<script lang="ts">
	import { onMount } from 'svelte';

	let theme = $state<'light' | 'dark'>('light');
	let button: HTMLButtonElement;

	onMount(() => {
		// The inline script in app.html already applied the theme before first paint.
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		// Marker for tests: hydration of the page has completed.
		button.dataset.hydrated = 'true';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';

		try {
			localStorage.setItem('opamp-theme', theme);
		} catch {
			// localStorage unavailable — theme still applies for this session
		}

		document.documentElement.dataset.theme = theme;
	}
</script>

<button
	bind:this={button}
	class="theme-toggle"
	type="button"
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
	title={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
>
	{theme === 'dark' ? '☀️' : '🌙'}
</button>

<style>
	.theme-toggle {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		z-index: 1000;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		font-size: 1.15rem;
		line-height: 1;
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
	}

	.theme-toggle:hover {
		background: var(--bg);
	}
</style>
