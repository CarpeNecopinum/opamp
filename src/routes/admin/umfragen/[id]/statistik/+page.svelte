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

<div class="title-row">
	<h1>{survey.title}</h1>
	<button type="button" onclick={() => window.print()}>Statistik drucken</button>
</div>

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
	<div class="overview-area">
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
	</div>

	<!--
		Counts per rating for every question — print only. On screen the
		histograms (click a question above) carry this information.
	-->
	<table class="rating-counts">
		<thead>
			<tr>
				<th>Frage</th>
				{#each Array.from({ length: 10 }, (_, i) => i + 1) as rating (rating)}
					<th>{rating}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each ratingQuestions as question (question.id)}
				{@const counts = new Map(question.distribution.map((d) => [d.rating, d.count]))}
				<tr>
					<td>{question.position + 1}. {question.prompt}</td>
					{#each Array.from({ length: 10 }, (_, i) => i + 1) as rating (rating)}
						<td>{counts.get(rating) ?? 0}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	{#if selectedQuestion}
		{@const stats = ratingStats(selectedQuestion.distribution)}
		<section class="card">
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
		</section>
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

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.title-row h1 {
		margin: 0;
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

	.rating-counts {
		display: none;
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

	/*
	 * Print: strip interactive elements, thick backgrounds and superfluous
	 * borders; show the counts table instead of the on-screen histograms.
	 */
	@media print {
		/* Light colors regardless of the active theme (dark text on white). */
		:global(:root),
		:global([data-theme='dark']) {
			--bg: #fff !important;
			--surface: #fff !important;
			--text: #000 !important;
			--muted: #555 !important;
			--border: #bbb !important;
			--accent-soft: #eef2fb !important;
		}

		/* Interactive elements off the page. */
		:global(.admin-header),
		:global(button),
		.back {
			display: none;
		}

		/*
		 * The counts table replaces the on-screen histograms in the report.
		 */
		.rating-counts {
			display: table;
			break-inside: avoid;
		}

		.rating-counts th:not(:first-child),
		.rating-counts td:not(:first-child) {
			text-align: center;
			width: 2.2rem;
		}

		/* Thick backgrounds and superfluous borders away, keep the plots. */
		:global(body) {
			background: none;
		}

		.card {
			background: none;
			border: none;
			padding: 0;
		}

		/* Rating sections (plot + histogram) stay on one page … */
		section.card {
			break-inside: avoid;
		}

		/* … free-text cards may span pages: answers keep their outlines and
		   are not split, but breaks between answers are allowed. */
		.text-answer {
			background: none;
			break-inside: avoid;
		}

		.rating-counts,
		.rating-counts th,
		.rating-counts td {
			border: none;
		}

		/* Badges keep their info, lose their colored backgrounds. */
		:global(.badge) {
			background: none;
			border: 1px solid var(--border);
			color: var(--text);
		}

		.overview-area {
			break-inside: avoid;
		}
	}
</style>
