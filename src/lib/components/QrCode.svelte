<script lang="ts">
	import { renderSVG } from 'uqr';

	let {
		value,
		label = 'QR-Code'
	}: {
		value: string;
		/** Accessible description of what the code encodes. */
		label?: string;
	} = $props();

	const svg = $derived(renderSVG(value, { pixelSize: 4 }));
</script>

<svg
	viewBox="0 0 108 108"
	class="qr"
	role="img"
	aria-label="{label} für {value}"
>{@html svg}
</svg>

<style>
	/* uqr renders a square QR — scale it with CSS while keeping the aspect. */
	.qr {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
