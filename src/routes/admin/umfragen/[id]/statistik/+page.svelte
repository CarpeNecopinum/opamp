<script lang="ts">
	import RatingOverview from '#lib/components/RatingOverview.svelte';
	import RatingPlot from '#lib/components/RatingPlot.svelte';
	import { formatDateTime, formatNumber } from '#lib/format.ts';
	import { ratingStats } from '#lib/stats.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const survey = $derived(data.survey);
	const results = $derived(data.results);

	const ratingQuestions = $derived(results.questions.filter((q) => q.type === 'agree_rating'));
	const textQuestions = $derived(results.questions.filter((q) => q.type === 'free_text'));

	let plotMode = $state<'box' | 'violin'>('box');
	let selectedQuestionId = $state<number | null>(null);

	const selectedQuestion = $derived(
		ratingQuestions.find((q) => q.id === selectedQuestionId) ?? null
	);

	/** Non-empty answers, longest first. */
	function sortedAnswers(answers: ReadonlyArray<{ value: string }>) {
		return answers
			.filter((a) => a.value.trim().length > 0)
			.sort((a, b) => b.value.length - a.value.length);
	}
</script>

<svelte:head>
	<title>{survey.title} – Statistik</title>
</svelte:head>

<p class="back">
	<a href="/admin/umfragen/{survey.id}">← Zurück zur Umfrage</a>
</p>

<h1>{survey.title}</h1>

<p>
	<span class="badge {survey.status}">{survey.status}</span>
	<span class="muted">
		Zeitraum: {formatDateTime(survey.startsAt)} – {formatDateTime(survey.endsAt)}
		· {results.responseCount} {results.responseCount === 1 ? 'Antwort' : 'Antworten'}
	</span>
</p>

<h2>Skalen-Fragen (1–10)</h2>

{#if ratingQuestions.length === 0}
	<p class="muted">Diese Umfrage enthält keine Skalen-Fragen.</p>
{:else}
	<div class="mode-switch" role="group" aria-label="Diagrammart">
		<button class:selected={plotMode === 'box'} onclick={() => (plotMode = 'box')}>Boxplot</button>
		<button class:selected={plotMode === 'violin'} onclick={() => (plotMode = 'violin')}>
			Violin
		</button>
	</div>

	<RatingOverview
		questions={ratingQuestions}
		mode={plotMode}
		bind:selected={selectedQuestionId}
	/>

	{#if selectedQuestion}
		{@const stats = ratingStats(selectedQuestion.distribution)}
		<div class="card">
			<h3>{selectedQuestion.position + 1}. {selectedQuestion.prompt}</h3>

			{#if stats}
				<p class="summary">
					<span><strong>⌀ {formatNumber(stats.mean)}</strong></span>
					<span>Median: {formatNumber(stats.median)}</span>
					<span>Spannweite: {formatNumber(stats.min)}–{formatNumber(stats.max)}</span>
					<span class="muted">({selectedQuestion.answerCount} Antworten)</span>
				</p>
			{/if}

			<RatingPlot distribution={selectedQuestion.distribution} />
			<p class="muted legend">Anzahl der Antworten pro Bewertung (1–10)</p>
		</div>
	{/if}
{/if}

<h2>Freitext-Fragen</h2>

{#if textQuestions.length === 0}
	<p class="muted">Diese Umfrage enthält keine Freitext-Fragen.</p>
{:else}
	{#each textQuestions as question (question.id)}
		{@const answers = sortedAnswers(question.textAnswers)}
		<div class="card">
			<h3>{question.position + 1}. {question.prompt}</h3>

			{#if answers.length === 0}
				<p class="muted">Keine Antworten.</p>
			{:else}
				<p class="muted">{answers.length} Antworten, sortiert nach Länge (längste zuerst)</p>
				<div class="text-answers">
					{#each answers as answer (answer.value)}
						<div class="text-answer">
							<p>{answer.value}</p>
							<span class="muted">{answer.value.length} Zeichen</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
{/if}

<style>
	.back {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.mode-switch {
		display: inline-flex;
		margin-bottom: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.mode-switch button {
		border: none;
		border-radius: 0;
		background: var(--surface);
		color: var(--muted);
		padding: 0.4rem 1rem;
	}

	.mode-switch button:hover {
		background: var(--bg);
	}

	.mode-switch button.selected {
		background: var(--accent);
		color: #fff;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0 0 0.75rem;
	}

	.legend {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
	}

	.text-answers {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.text-answer {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.6rem 0.85rem;
	}

	.text-answer p {
		margin: 0 0 0.35rem;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
</style>
