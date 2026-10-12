<script lang="ts">
	import SurveyForm from '#lib/components/SurveyForm.svelte';
	import { toDateTimeLocalValue } from '#lib/format.ts';
	import { page } from '$app/state';

	const defaultQuestion = {
		type: 'agree_rating' as const,
		prompt: 'Wie sehr stimmst du dieser Meinung zu?',
		required: true
	};

	const initial = {
		title: '',
		description: '',
		startsAt: toDateTimeLocalValue(new Date()),
		endsAt: toDateTimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
		questions: [defaultQuestion]
	};
</script>

<svelte:head>
	<title>Neue Umfrage – Verwaltung</title>
</svelte:head>

<h1>Neue Umfrage</h1>

{#if page.form?.error}
	<p class="error-message">{page.form.error}</p>
{/if}

<SurveyForm {initial} submitLabel="Umfrage anlegen" />
