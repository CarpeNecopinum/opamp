<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Umfrage duplizieren – Verwaltung</title>
</svelte:head>

<h1>Umfrage duplizieren</h1>

<p class="muted">
	„{data.title}“ wird mit neuem Zeitraum (7 Tage ab jetzt) und ohne Antworten kopiert.
</p>

{#if page.form?.error}
	<p class="error-message">{page.form.error}</p>
{/if}

<form method="POST">
	<label for="duplicate-name">Name der Kopie</label>
	<input
		id="duplicate-name"
		type="text"
		name="title"
		value={data.defaultName}
		maxlength="200"
		required
	/>
	<p>
		<button type="submit">Kopie erstellen</button>
	</p>
</form>
