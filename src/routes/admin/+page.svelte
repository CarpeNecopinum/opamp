<script lang="ts">
	import { formatDateTime } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const surveys = $derived(data.surveys);

	let duplicateDialog = $state<HTMLDialogElement | null>(null);
	let duplicateNameInput = $state<HTMLInputElement | null>(null);
	let duplicateSurveyId = $state<number | null>(null);
	let duplicateSurveyTitle = $state('');
	let duplicateName = $state('');

	function openDuplicateDialog(id: number, title: string) {
		duplicateSurveyId = id;
		duplicateSurveyTitle = title;
		duplicateName = `${title} (Kopie)`.slice(0, 200);
		duplicateDialog?.showModal();
		duplicateNameInput?.focus();
	}
</script>

<svelte:head>
	<title>Übersicht – Verwaltung</title>
</svelte:head>

<h1>Umfragen</h1>

<p>
	<a href="/admin/umfragen/neu"><button>Neue Umfrage</button></a>
</p>

{#if surveys.length === 0}
	<div class="card">
		<p class="muted">Noch keine Umfragen angelegt.</p>
	</div>
{:else}
	<table>
		<thead>
			<tr>
				<th>Titel</th>
				{#if data.isRoot}<th>Erstellt von</th>{/if}
				<th>Status</th>
				<th>Zeitraum</th>
				<th>Antworten</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each surveys as survey (survey.id)}
				<tr>
					<td><a href="/admin/umfragen/{survey.id}">{survey.title}</a></td>
					{#if data.isRoot}<td>{survey.createdByUsername}</td>{/if}
					<td><span class="badge {survey.status}">{survey.status}</span></td>
					<td class="muted">
						{formatDateTime(survey.startsAt)} – {formatDateTime(survey.endsAt)}
					</td>
					<td>{survey.responseCount}</td>
					<td>
					<a href="/admin/umfragen/{survey.id}">Verwalten</a>
					·
					<a href="/admin/umfragen/{survey.id}/statistik">Statistik</a>
					·
					<a
						href="/admin/umfragen/{survey.id}/duplizieren"
						data-sveltekit-preload-data="off"
						onclick={(event) => {
							// Ask for a name before creating the copy; the plain
							// href stays as a fallback rendering the form page.
							event.preventDefault();
							openDuplicateDialog(survey.id, survey.title);
						}}>Duplizieren</a
					>
				</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<dialog bind:this={duplicateDialog} class="name-dialog">
	{#if duplicateSurveyId !== null}
		<form method="POST" action="/admin/umfragen/{duplicateSurveyId}/duplizieren">
			<h3>Umfrage duplizieren</h3>
			<p class="muted">
				„{duplicateSurveyTitle}“ wird mit neuem Zeitraum (7 Tage ab jetzt) und ohne Antworten
				kopiert.
			</p>
			<label for="duplicate-name">Name der Kopie</label>
			<input
				id="duplicate-name"
				type="text"
				name="title"
				bind:value={duplicateName}
				bind:this={duplicateNameInput}
				maxlength="200"
				required
			/>
			<div class="dialog-actions">
				<button type="button" class="secondary" onclick={() => duplicateDialog?.close()}>
					Abbrechen
				</button>
				<button type="submit">Kopie erstellen</button>
			</div>
		</form>
	{/if}
</dialog>

<style>
	.name-dialog {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		padding: 1.1rem 1.25rem;
		width: min(420px, 90vw);
	}

	.name-dialog::backdrop {
		background: rgb(0 0 0 / 0.4);
	}

	.name-dialog h3 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
