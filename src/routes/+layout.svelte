<script lang="ts">
	import "../app.css";
	import { asset } from "$app/paths";
	import ThemeToggle from "#lib/components/ThemeToggle.svelte";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset("opamp-logo.svg")} type="text/xml+svg" />
</svelte:head>

{@render children()}

<ThemeToggle />
