<script lang="ts">
	import QrCode from '#lib/components/QrCode.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const survey = $derived(data.survey);
	const link = $derived(`${data.origin}/umfrage/${survey.token}`);

	let slide = $state<HTMLDivElement | null>(null);
	let fullscreen = $state(false);

	async function toggleFullscreen() {
		if (document.fullscreenElement) {
			await document.exitFullscreen();
		} else {
			await slide?.requestFullscreen();
		}
	}
</script>

<svelte:document onfullscreenchange={() => (fullscreen = Boolean(document.fullscreenElement))} />

<svelte:head>
	<title>{survey.title} – QR-Code</title>
</svelte:head>

<div class="slide" bind:this={slide}>
	<p class="callout">Dein Feedback ist gefragt!</p>
	<h1>{survey.title}</h1>
	{#if survey.status !== 'aktiv'}
		<p class="warning">
			Hinweis: Diese Umfrage nimmt derzeit keine Antworten entgegen
			(<span class="badge {survey.status}">{survey.status}</span>).
		</p>
	{/if}
	<div class="qr">
		<QrCode value={link} label="Teilnehmer-Link" />
	</div>
	<p class="muted">Scanne den QR-Code mit deinem Smartphone.</p>
	<code class="link">{link}</code>
	{#if !fullscreen}
		<div class="actions">
			<button type="button" onclick={toggleFullscreen}>Vollbild</button>
			<a href="/admin/umfragen/{survey.id}" class="back">← Zurück zur Umfrage</a>
		</div>
	{/if}
</div>

<style>
	/*
	 * The slide is a presentation view: break out of the container width.
	 * Scoped via :has so the rule — which hover preloading injects on every
	 * page — only matches while this slide is actually rendered.
	 */
	:global(main.container:has(.slide)) {
		max-width: none;
	}

	.slide {
		min-height: calc(100dvh - 6rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
		background: var(--bg);
		border-radius: var(--radius);
	}

	.slide:fullscreen {
		border-radius: 0;
	}

	.callout {
		font-size: 1.4rem;
		font-weight: 700;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.6rem, 4vw, 2.6rem);
		margin: 0 0 0.5rem;
	}

	.warning {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		justify-content: center;
		margin: 0 0 0.5rem;
	}

	.qr {
		width: min(70vmin, 540px);
		padding: 1.25rem;
		background: #fff;
		border-radius: var(--radius);
		box-shadow: 0 2px 12px rgb(0 0 0 / 0.12);
	}

	.link {
		font-size: 0.95rem;
		word-break: break-all;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.back {
		font-size: 0.9rem;
	}
</style>
