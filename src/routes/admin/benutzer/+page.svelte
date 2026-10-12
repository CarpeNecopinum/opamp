<script lang="ts">
	import { formatDateTime } from '#lib/format.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const roleLabels: Record<string, string> = {
		root: 'Root-Administrator',
		survey: 'Umfrage-Ersteller'
	};

	let username = $state('');
	let password = $state('');
	let role = $state<'root' | 'survey'>('survey');
</script>

<svelte:head>
	<title>Benutzer – Verwaltung</title>
</svelte:head>

<h1>Benutzer</h1>

{#if page.form?.success}
	<p class="success-message">Benutzer wurde angelegt.</p>
{/if}

<table>
	<thead>
		<tr>
			<th>Benutzername</th>
			<th>Rolle</th>
			<th>Erstellt am</th>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user (user.id)}
			<tr>
				<td>{user.username}</td>
				<td>{roleLabels[user.role] ?? user.role}</td>
				<td class="muted">{formatDateTime(user.createdAt)}</td>
			</tr>
		{/each}
	</tbody>
</table>

<h2>Konto anlegen</h2>

<form method="POST" action="?/create">
	<p>
		<label for="username">Benutzername</label>
		<input id="username" name="username" bind:value={username} required />
	</p>
	<p>
		<label for="password">Passwort (mindestens 8 Zeichen)</label>
		<input id="password" name="password" type="password" bind:value={password} required />
	</p>
	<p>
		<label for="role">Rolle</label>
		<select id="role" name="role" bind:value={role}>
			<option value="survey">Umfrage-Ersteller</option>
			<option value="root">Root-Administrator</option>
		</select>
	</p>

	{#if page.form?.error}
		<p class="error-message">{page.form.error}</p>
	{/if}

	<button type="submit">Konto anlegen</button>
</form>
