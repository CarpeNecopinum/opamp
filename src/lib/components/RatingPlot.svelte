<script lang="ts">
	let {
		distribution
	}: {
		distribution: ReadonlyArray<{ rating: number; count: number }>;
	} = $props();

	const W = 560;
	const H = 190;
	const padX = 18;
	const baseline = 150;
	const maxBar = 110;

	const maxCount = $derived(Math.max(...distribution.map((d) => d.count), 0));

	const x = (rating: number): number => padX + ((rating - 1) / 9) * (W - 2 * padX);
	const barWidth = ((W - 2 * padX) / 9) * 0.72;
</script>

<svg viewBox="0 0 {W} {H}" class="plot" role="img" aria-label="Histogramm der Antworten">
	{#each distribution as entry (entry.rating)}
		{@const barHeight = maxCount > 0 ? (entry.count / maxCount) * maxBar : 0}
		{#if entry.count > 0}
			<rect
				x={x(entry.rating) - barWidth / 2}
				y={baseline - barHeight}
				width={barWidth}
				height={barHeight}
				rx="3"
				class="bar"
			/>
			<text x={x(entry.rating)} y={baseline - barHeight - 5} class="tick" text-anchor="middle">
				{entry.count}
			</text>
		{/if}
	{/each}
	<line x1={padX - 8} y1={baseline} x2={W - padX + 8} y2={baseline} class="axis" />
	{#each distribution as entry (entry.rating)}
		<text x={x(entry.rating)} y={H - 8} class="tick" text-anchor="middle">{entry.rating}</text>
	{/each}
</svg>

<style>
	.plot {
		width: 100%;
		max-width: 560px;
		height: auto;
		display: block;
	}

	.bar {
		fill: var(--accent);
	}

	.axis {
		stroke: var(--border);
		stroke-width: 1;
	}

	.tick {
		fill: var(--muted);
		font-size: 10px;
	}
</style>
