<script lang="ts">
	import { page } from '$app/state';

	let title = $state('');
	let body = $state('');

	const notes = $derived(page.data.notes);
	const dbUnavailable = $derived(page.data.dbUnavailable);
</script>

<svelte:head>
	<title>opamp</title>
</svelte:head>

<main>
	<h1>opamp</h1>

	{#if dbUnavailable}
		<p class="warning">
			Database unavailable — check <code>DATABASE_URL</code> and run <code>npm run migrate:up</code>.
		</p>
	{/if}

	<form method="POST" action="?/create">
		<input name="title" placeholder="Title" bind:value={title} required />
		<textarea name="body" placeholder="Body (optional)" bind:value={body}></textarea>
		<button type="submit">Add note</button>
	</form>

	{#if page.form?.error}
		<p class="error">{page.form.error}</p>
	{/if}

	<ul>
		{#each notes as note (note.id)}
			<li>
				<strong>{note.title}</strong>
				{#if note.body}<span>{note.body}</span>{/if}
				<time>{new Date(note.createdAt).toLocaleString()}</time>
			</li>
		{:else}
			<li>No notes yet.</li>
		{/each}
	</ul>
</main>
