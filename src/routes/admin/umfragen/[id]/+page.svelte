<script lang="ts">
	import QrCode from '#lib/components/QrCode.svelte';
	import SurveyForm from '#lib/components/SurveyForm.svelte';
	import { formatDateTime } from '#lib/format.ts';
	import { toDateTimeLocalValue } from '#lib/format.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const survey = $derived(data.survey);
	const editable = $derived(data.editable);
	const participantLink = $derived(`${page.url.origin}/umfrage/${survey.token}`);

	const initial = $derived({
		title: survey.title,
		description: survey.description ?? '',
		startsAt: toDateTimeLocalValue(new Date(survey.startsAt)),
		endsAt: toDateTimeLocalValue(new Date(survey.endsAt)),
		questions: data.questions.map((q) => ({
			type: q.type,
			prompt: q.prompt,
			required: q.required
		}))
	});
</script>

<svelte:head>
	<title>{survey.title} – Verwaltung</title>
</svelte:head>

<h1>{survey.title}</h1>

<p>
	<span class="badge {survey.status}">{survey.status}</span>
	<span class="muted">
		Zeitraum: {formatDateTime(survey.startsAt)} – {formatDateTime(survey.endsAt)}
		· {survey.responseCount} {survey.responseCount === 1 ? 'Antwort' : 'Antworten'}
	</span>
</p>

<div class="card">
	<h2>Teilnehmer-Link</h2>
	<p class="muted">
		Diesen Link an Teilnehmende verteilen – er ist praktisch nicht erratbar und enthält keine
		Anmeldedaten.
	</p>
	<div class="link-and-qr">
		<div class="link-col">
			<code class="survey-link">{participantLink}</code>
			<p class="link-actions">
				<a href="/umfrage/{survey.token}" target="_blank"><button type="button" class="secondary">Vorschau öffnen</button></a>
				<a href="/admin/umfragen/{survey.id}/qr"><button type="button" class="secondary">QR-Vollbild öffnen</button></a>
			</p>
		</div>
		<div class="qr-box">
			<QrCode value={participantLink} label="Teilnehmer-Link" />
		</div>
	</div>
</div>

{#if page.form?.error}
	<p class="error-message">{page.form.error}</p>
{/if}
{#if page.form?.success}
	<p class="success-message">Änderungen gespeichert.</p>
{/if}

<h2>Bearbeiten</h2>

<SurveyForm {initial} locked={!editable} submitLabel="Änderungen speichern" action="?/update" />

<h2>Löschen</h2>

<form
	method="POST"
	action="?/delete"
	onsubmit={(event) => {
		if (!confirm('Diese Umfrage wirklich löschen?')) event.preventDefault();
	}}
>
	<p>
		<button type="submit" class="danger">Umfrage löschen</button>
		<span class="muted">Löscht die Umfrage mitsamt allen Fragen und Antworten.</span>
	</p>
</form>

<style>
	.link-and-qr {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.link-col {
		flex: 1;
		min-width: 260px;
	}

	.qr-box {
		width: 150px;
		flex-shrink: 0;
	}

	.link-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.survey-link {
		display: block;
		padding: 0.5rem 0.65rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		word-break: break-all;
	}
</style>
