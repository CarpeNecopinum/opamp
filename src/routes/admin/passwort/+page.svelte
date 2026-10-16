<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
</script>

<svelte:head>
	<title>Passwort ändern – Verwaltung</title>
</svelte:head>

<h1>Passwort ändern</h1>

<p class="muted">Angemeldet als {data.user.username}.</p>

{#if page.form?.success}
	<p class="success-message">Passwort wurde geändert.</p>
{/if}

<form method="POST">
	<p>
		<label for="current">Aktuelles Passwort</label>
		<input id="current" name="current" type="password" bind:value={current} required />
	</p>
	<p>
		<label for="next">Neues Passwort (mindestens 8 Zeichen)</label>
		<input id="next" name="next" type="password" bind:value={next} required minlength={8} />
	</p>
	<p>
		<label for="confirm">Neues Passwort wiederholen</label>
		<input id="confirm" name="confirm" type="password" bind:value={confirm} required />
	</p>

	{#if page.form?.error}
		<p class="error-message">{page.form.error}</p>
	{/if}

	<button type="submit">Passwort ändern</button>
</form>
