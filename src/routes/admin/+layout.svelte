<script lang="ts">
	import { asset } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<header class="admin-header">
	<div class="admin-header-inner">
		<a href="/admin" class="brand">
			<img src={asset('opamp-logo.svg')} alt="" class="logo logo-light" />
			<img src={asset('opamp-logo-dark.svg')} alt="" class="logo logo-dark" />
			Verwaltung
		</a>
		<nav>
			<a href="/admin">Übersicht</a>
			{#if data.user.role === 'root'}
				<a href="/admin/benutzer">Benutzer</a>
			{/if}
			<span class="muted">{data.user.username}</span>
			<form method="POST" action="/abmelden">
				<button type="submit" class="secondary">Abmelden</button>
			</form>
		</nav>
	</div>
</header>

<main class="container">
	{@render children()}
</main>

<style>
	.admin-header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.admin-header-inner {
		max-width: 860px;
		margin: 0 auto;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.brand {
		font-weight: 700;
		color: var(--text);
		font-size: 1.05rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.brand:hover {
		text-decoration: none;
	}

	.logo {
		height: 2rem;
		width: auto;
		display: block;
		border-radius: 5px;
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

	nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	nav form {
		display: inline;
	}
</style>
