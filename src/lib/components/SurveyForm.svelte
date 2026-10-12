<script lang="ts">
	import { enhance } from '$app/forms';
	import { toDateTimeLocalValue } from '#lib/format.ts';
	import type { QuestionType } from '#lib/schemas.ts';

	type InitialQuestion = {
		type: QuestionType;
		prompt: string;
		required: boolean;
	};

	type InitialSurvey = {
		title: string;
		description: string;
		startsAt: string; // datetime-local value
		endsAt: string; // datetime-local value
		questions: InitialQuestion[];
	};

	let {
		initial,
		submitLabel = 'Speichern',
		locked = false,
		action = ''
	}: {
		initial: InitialSurvey;
		submitLabel?: string;
		locked?: boolean;
		/**
		 * Named form action the form posts to (e.g. `?/update`). Empty means the
		 * page's default action — note that `?/default` is a reserved name and
		 * cannot be used explicitly.
		 */
		action?: string;
	} = $props();

	// The form is uncontrolled after init — deliberately capture the initial values once.
	// svelte-ignore state_referenced_locally
	let title = $state(initial.title);
	// svelte-ignore state_referenced_locally
	let description = $state(initial.description);
	// svelte-ignore state_referenced_locally
	let startsAt = $state(initial.startsAt);
	// svelte-ignore state_referenced_locally
	let endsAt = $state(initial.endsAt);
	// svelte-ignore state_referenced_locally
	let questions = $state<InitialQuestion[]>(initial.questions.map((q) => ({ ...q })));

	const questionTypes: Array<{ value: QuestionType; label: string }> = [
		{ value: 'agree_rating', label: 'Zustimmung (Bewertung 1–10)' },
		{ value: 'free_text', label: 'Freitext (Textfeld)' }
	];

	function addQuestion() {
		questions.push({ type: 'agree_rating', prompt: '', required: true });
	}

	function removeQuestion(index: number) {
		questions.splice(index, 1);
	}

	function moveQuestion(index: number, delta: number) {
		const target = index + delta;
		if (target < 0 || target >= questions.length) return;
		const [question] = questions.splice(index, 1);
		questions.splice(target, 0, question);
	}

	function buildPayload(): string {
		return JSON.stringify({
			title,
			description,
			startsAt: new Date(startsAt).toISOString(),
			endsAt: new Date(endsAt).toISOString(),
			questions
		});
	}
</script>

<form
	method="POST"
	action={action || undefined}
	use:enhance={({ formData }) => {
		// FormData is snapshotted before the callback runs, but the body is built
		// after it — mutating it here is what reaches the server.
		formData.set('payload', buildPayload());
		return async ({ update }) => update();
	}}
>
	<p>
		<label for="title">Titel</label>
		<input id="title" bind:value={title} required maxlength="200" />
	</p>
	<p>
		<label for="description">Beschreibung (optional)</label>
		<textarea id="description" bind:value={description} maxlength="2000"></textarea>
	</p>

	<div class="window">
		<p>
			<label for="startsAt">Start des Zeitraums</label>
			<input id="startsAt" type="datetime-local" bind:value={startsAt} required />
		</p>
		<p>
			<label for="endsAt">Ende des Zeitraums</label>
			<input id="endsAt" type="datetime-local" bind:value={endsAt} required />
		</p>
	</div>

	<h2>Fragen</h2>

	{#if locked}
		<p class="success-message">
			Diese Umfrage hat bereits Antworten – die Fragen können nicht mehr geändert werden.
		</p>
	{:else}
		{#each questions as question, index (index)}
			<fieldset class="question">
				<legend>Frage {index + 1}</legend>
				<p>
					<label for="prompt-{index}">Fragetext</label>
					<input id="prompt-{index}" bind:value={question.prompt} required maxlength="500" />
				</p>
				<div class="question-options">
					<p>
						<label for="type-{index}">Antwortmodus</label>
						<select id="type-{index}" bind:value={question.type}>
							{#each questionTypes as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</p>
					<p class="required-toggle">
						<label>
							<input type="checkbox" bind:checked={question.required} />
							Erforderlich
						</label>
					</p>
					<div class="question-actions">
						<button
							type="button"
							class="secondary"
							onclick={() => moveQuestion(index, -1)}
							disabled={index === 0}
							aria-label="Nach oben verschieben">↑</button
						>
						<button
							type="button"
							class="secondary"
							onclick={() => moveQuestion(index, 1)}
							disabled={index === questions.length - 1}
							aria-label="Nach unten verschieben">↓</button
						>
						<button
							type="button"
							class="danger"
							onclick={() => removeQuestion(index)}
							disabled={questions.length === 1}>Entfernen</button
						>
					</div>
				</div>
			</fieldset>
		{/each}

		<p><button type="button" class="secondary" onclick={addQuestion}>Frage hinzufügen</button></p>
	{/if}

	<p><button type="submit">{submitLabel}</button></p>
</form>

<style>
	.window {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

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

	.question-options {
		display: flex;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.question-options p {
		margin: 0 0 0.5rem;
	}

	.required-toggle label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 400;
	}

	.required-toggle input {
		width: auto;
	}

	.question-actions {
		display: flex;
		gap: 0.4rem;
		margin-left: auto;
	}

	.question-actions button {
		padding: 0.35rem 0.7rem;
	}
</style>
