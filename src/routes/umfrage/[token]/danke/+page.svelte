<script lang="ts">
	import { markSubmitted } from '#lib/submissionGuard.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// This page is only reached after a successful submission, so its render
	// marks the survey as submitted in this browser (used by the duplicate
	// guard on the questionnaire page).
	$effect(() => {
		if (data.token) markSubmitted(data.token);
	});
</script>

<svelte:head>
	<title>Vielen Dank – opamp</title>
</svelte:head>

<main class="container" style="max-width: 520px">
	<div class="card" style="text-align: center">
		<h1>Vielen Dank!</h1>
		<p>
			Deine Antworten{data.title ? ` für „${data.title}“` : ''} wurden gespeichert.
		</p>
		<a href="/"><button class="secondary">Zur Übersicht</button></a>
	</div>
</main>
