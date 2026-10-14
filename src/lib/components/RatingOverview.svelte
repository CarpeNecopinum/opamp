<script lang="ts">
	import { ratingStats } from '#lib/stats.ts';

	type RatingQuestion = {
		id: number;
		prompt: string;
		distribution: ReadonlyArray<{ rating: number; count: number }>;
	};

	let {
		questions,
		mode = 'box',
		selected = $bindable(null)
	}: {
		questions: ReadonlyArray<RatingQuestion>;
		mode?: 'box' | 'violin';
		selected?: number | null;
	} = $props();

	const W = 520;
	const padX = 12;
	const rowHeight = 44;
	const axisHeight = 26;
	const violinHalf = 16;
	const boxHeight = 18;

	const ratings = Array.from({ length: 10 }, (_, i) => i + 1);

	const rowsHeight = $derived(questions.length * rowHeight);
	const H = $derived(rowsHeight + axisHeight);
	const globalMaxCount = $derived(
		Math.max(...questions.flatMap((q) => [...q.distribution].map((d) => d.count)), 0)
	);

	let hoveredId = $state<number | null>(null);

	const x = (rating: number): number => padX + ((rating - 1) / 9) * (W - 2 * padX);

	const ariaLabel = $derived(
		mode === 'violin' ? 'Violinplot aller Skalen-Fragen' : 'Boxplot aller Skalen-Fragen'
	);

	function toggle(id: number) {
		selected = selected === id ? null : id;
	}

	/** Mirrored density silhouette for one row, scaled by the global max count. */
	function violinPath(
		distribution: ReadonlyArray<{ rating: number; count: number }>,
		cy: number
	): string {
		if (globalMaxCount === 0) return '';
		const points: string[] = [];

		for (const { rating, count } of distribution) {
			points.push(
				`${x(rating).toFixed(1)},${(cy - (count / globalMaxCount) * violinHalf).toFixed(1)}`
			);
		}
		for (let i = distribution.length - 1; i >= 0; i--) {
			const { rating, count } = distribution[i];
			points.push(
				`${x(rating).toFixed(1)},${(cy + (count / globalMaxCount) * violinHalf).toFixed(1)}`
			);
		}
		return `M ${points.join(' L ')} Z`;
	}
</script>

<div class="overview">
	<div class="labels">
		{#each questions as question (question.id)}
			<button
				type="button"
				class="row-label"
				class:selected={selected === question.id}
				onclick={() => toggle(question.id)}
				onmouseenter={() => (hoveredId = question.id)}
				onmouseleave={() => (hoveredId = null)}
				title={question.prompt}
			>
				<span>{question.prompt}</span>
			</button>
		{/each}
		<div class="axis-spacer" style="height: {axisHeight}px"></div>
	</div>

	<svg
		viewBox="0 0 {W} {H}"
		class="plot"
		preserveAspectRatio="none"
		style="height: {H}px"
		role="img"
		aria-label={ariaLabel}
	>
		{#each questions as question, index (question.id)}
			<rect
				x="0"
				y={index * rowHeight}
				width={W}
				height={rowHeight}
				class="row-hit"
				class:selected={selected === question.id}
				class:hovered={hoveredId === question.id}
			/>
		{/each}

		{#each ratings as rating (rating)}
			<line x1={x(rating)} y1="0" x2={x(rating)} y2={rowsHeight} class="grid" />
			<text x={x(rating)} y={H - 8} class="tick" text-anchor="middle">{rating}</text>
		{/each}
		<line x1={padX - 8} y1={rowsHeight + 2} x2={W - padX + 8} y2={rowsHeight + 2} class="axis" />

		{#each questions as question, index (question.id)}
			{@const stats = ratingStats(question.distribution)}
			{@const cy = index * rowHeight + rowHeight / 2}
			{#if stats}
				{#if mode === 'box'}
					<line x1={x(stats.min)} y1={cy} x2={x(stats.q1)} y2={cy} class="whisker" />
					<line x1={x(stats.q3)} y1={cy} x2={x(stats.max)} y2={cy} class="whisker" />
					<line x1={x(stats.min)} y1={cy - 5} x2={x(stats.min)} y2={cy + 5} class="whisker" />
					<line x1={x(stats.max)} y1={cy - 5} x2={x(stats.max)} y2={cy + 5} class="whisker" />
					<rect
						x={x(stats.q1)}
						y={cy - boxHeight / 2}
						width={Math.max(x(stats.q3) - x(stats.q1), 1)}
						height={boxHeight}
						rx="3"
						class="box"
					/>
					<line
						x1={x(stats.median)}
						y1={cy - boxHeight / 2}
						x2={x(stats.median)}
						y2={cy + boxHeight / 2}
						class="median"
					/>
					<circle cx={x(stats.mean)} cy={cy} r="3.5" class="mean" />
				{:else}
					<path d={violinPath(question.distribution, cy)} class="violin" />
					<line
						x1={x(stats.median)}
						y1={cy - violinHalf}
						x2={x(stats.median)}
						y2={cy + violinHalf}
						class="median"
					/>
					<circle cx={x(stats.mean)} cy={cy} r="3.5" class="mean" />
				{/if}
			{/if}
		{/each}
	</svg>
</div>

<p class="muted legend">
	<span>
		Linie = Median, roter Punkt = Mittelwert,
		{mode === 'box' ? 'Box = mittlere 50 % der Antworten' : 'Fläche = Verteilung der Antworten'}.
	</span>
	<span class="hint">Frage anklicken für Histogramm und Details.</span>
</p>

<style>
	.overview {
		display: grid;
		grid-template-columns: minmax(160px, 240px) 1fr;
		gap: 0 0.5rem;
		align-items: start;
	}

	.labels {
		display: flex;
		flex-direction: column;
	}

	.row-label {
		height: 44px;
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 0.8rem;
		text-align: left;
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: background 0.12s ease;
	}

	.row-label:hover {
		background: var(--bg);
	}

	.row-label.selected {
		background: var(--accent-soft);
		font-weight: 600;
	}

	.row-label span {
		flex: 1;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
	}

	/* Arrow hinting at the detail view, shown on hover and while selected. */
	.row-label::after {
		content: '→';
		margin-left: 0.35rem;
		color: var(--accent);
		font-size: 0.85rem;
		opacity: 0;
		transition: opacity 0.12s ease;
	}

	.row-label:hover::after,
	.row-label.selected::after {
		opacity: 1;
	}

	.plot {
		width: 100%;
		display: block;
	}

	.box,
	.violin,
	.whisker,
	.median,
	.grid,
	.axis {
		/* Keep stroke widths uniform when the plot stretches horizontally. */
		vector-effect: non-scaling-stroke;
	}

	.row-hit {
		fill: transparent;
		pointer-events: all;
		cursor: pointer;
		transition: fill 0.12s ease;
	}

	/* Hover on the plot row itself; :hover must come before .selected so a
	   selected row keeps its highlight when hovered. */
	.row-hit:hover,
	.row-hit.hovered {
		fill: var(--bg);
	}

	.row-hit.selected {
		fill: var(--accent-soft);
		opacity: 0.45;
	}

	.grid {
		stroke: var(--border);
		stroke-width: 1;
		stroke-dasharray: 2 3;
		opacity: 0.7;
	}

	.axis {
		stroke: var(--border);
		stroke-width: 1;
	}

	.tick {
		fill: var(--muted);
		font-size: 10px;
	}

	.box,
	.violin {
		fill: var(--accent-soft);
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.violin {
		stroke-linejoin: round;
	}

	.whisker {
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.median {
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.mean {
		fill: var(--danger);
	}

	.legend {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
	}

	/*
	 * Print: the combined plot stays; labels print as plain text with the
	 * full prompt, without highlights, arrow or the click hint.
	 */
	@media print {
		.overview {
			break-inside: avoid;
		}

		.row-label {
			height: auto;
			padding: 0.25rem 0.5rem;
			background: none;
			color: inherit;
		}

		.row-label span {
			-webkit-line-clamp: unset;
			line-clamp: unset;
			overflow: visible;
		}

		.row-label::after {
			display: none;
		}

		.row-label.selected {
			background: none;
			font-weight: 400;
		}

		.row-hit.selected {
			fill: transparent;
		}

		.hint {
			display: none;
		}
	}
</style>
