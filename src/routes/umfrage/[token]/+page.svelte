<script lang="ts">
	import { page } from '$app/state';
	import { hasSubmitted } from '#lib/submissionGuard.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const survey = $derived(data.survey);

	// Soft duplicate-submission guard: the survey token is stored hashed in
	// localStorage after a submission and checked when the questionnaire is
	// opened. Nothing is rendered until the check resolved to avoid flashing
	// the form before the warning.
	let checked = $state(false);
	let alreadySubmitted = $state(false);
	let proceedAnyway = $state(false);

	$effect(() => {
		const token = data.survey.token;
		checked = false;
		alreadySubmitted = false;
		proceedAnyway = false;
		hasSubmitted(token).then((submitted) => {
			alreadySubmitted = submitted;
			checked = true;
		});
	});
</script>

<svelte:head>
	<title>{survey.title} – opamp</title>
</svelte:head>

<main class="container" style="max-width: 640px">
	<h1>{survey.title}</h1>

	{#if survey.description}
		<p>{survey.description}</p>
	{/if}

	{#if data.closed}
		<div class="card">
			<p><span class="badge {survey.status}">{survey.status}</span></p>
			<p>Diese Umfrage nimmt derzeit keine Antworten entgegen.</p>
		</div>
	{:else if !checked}
		<!-- waiting for the duplicate check -->
	{:else if alreadySubmitted && !proceedAnyway}
		<div class="card">
			<p><strong>Mögliche doppelte Teilnahme</strong></p>
			<p>In diesem Browser wurde für diese Umfrage bereits eine Antwort abgegeben.</p>
			<p class="muted">
				Falls du nur versehentlich hier gelandet bist, schließe die Seite einfach wieder. Jede
				weitere Antwort wird als zusätzliche Teilnahme gezählt.
			</p>
			<button type="button" class="secondary" onclick={() => (proceedAnyway = true)}>
				Trotzdem teilnehmen
			</button>
		</div>
	{:else}
		<form method="POST">
			{#each data.questions as question (question.id)}
				<fieldset class="question">
					<legend>
						{question.position + 1}. {question.prompt}
						{#if !question.required}<span class="muted">(optional)</span>{/if}
					</legend>

					{#if question.type === 'agree_rating'}
						<div class="rating">
							{#each Array.from({ length: 10 }, (_, i) => i + 1) as value (value)}
								<label class="rating-option">
									<input type="radio" name="answer_{question.id}" value={value} />
									<span>{value}</span>
								</label>
							{/each}
						</div>
						<div class="rating-hints">
							<span>1 = stimme überhaupt nicht zu</span>
							<span>10 = stimme vollständig zu</span>
						</div>
					{:else}
						<textarea name="answer_{question.id}" rows="4"></textarea>
					{/if}
				</fieldset>
			{/each}

			{#if page.form?.error}
				<p class="error-message">{page.form.error}</p>
			{/if}

			<button type="submit">Antworten absenden</button>
		</form>
	{/if}
</main>

<style>
	.question {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
	}

	.question legend {
		font-weight: 600;
		padding: 0 0.4rem;
	}

	.rating {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.rating-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		font-weight: 400;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.4rem 0.55rem;
		cursor: pointer;
	}

	.rating-option:has(input:checked) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.rating-option input {
		width: auto;
		margin: 0;
	}

	.rating-hints {
		display: flex;
		justify-content: space-between;
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
