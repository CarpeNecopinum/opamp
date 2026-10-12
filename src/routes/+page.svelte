<script lang="ts">
	import { asset } from '$app/paths';
</script>

<svelte:head>
	<title>opamp – Feedback-Plattform</title>
</svelte:head>

<header class="site-header">
	<div class="container site-header-inner">
		<a href="/" class="brand" aria-label="opamp – Startseite">
			<img src={asset('opamp-logo.svg')} alt="" class="logo logo-light" />
			<img src={asset('opamp-logo-dark.svg')} alt="" class="logo logo-dark" />
		</a>
		<a href="/anmeldung">Verwaltung</a>
	</div>
</header>

<main class="container" style="max-width: 560px">
	<h1>Feedback-Plattform</h1>

	<div class="card">
		<p>
			Diese Plattform dient der Durchführung von Umfragen. An Umfragen kann ohne Anmeldung
			teilgenommen werden – du benötigst dafür den persönlichen Link zu einer Umfrage.
		</p>
		<p class="muted">
			Umfragen verwalten? <a href="/anmeldung">Zur Verwaltung</a>
		</p>
	</div>
</main>

<style>
	.site-header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.site-header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		padding-bottom: 0.75rem;
	}

	.brand {
		font-weight: 700;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
	}

	.brand:hover {
		text-decoration: none;
	}

	.logo {
		height: 2.4rem;
		width: auto;
		display: block;
		border-radius: 6px;
	}

	.logo-dark {
		display: none;
	}

	:global([data-theme='dark']) .logo-light {
		display: none;
	}

	:global([data-theme='dark']) .logo-dark {
		display: block;
	}
</style>
