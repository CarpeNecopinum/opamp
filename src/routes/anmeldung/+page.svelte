<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Anmelden – opamp</title>
</svelte:head>

<main class="container" style="max-width: 420px">
	<h1>Anmelden</h1>

	<form method="POST">
		<p>
			<label for="username">Benutzername</label>
			<input id="username" name="username" autocomplete="username" required />
		</p>
		<p>
			<label for="password">Passwort</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
		</p>

		{#if page.form?.error}
			<p class="error-message">{page.form.error}</p>
		{/if}

		<button type="submit">Anmelden</button>
	</form>
</main>
