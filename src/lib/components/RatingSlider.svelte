<script lang="ts">
	let {name,	label}: {
		name: string;
		label: string;
	} = $props();

	let value = $state<number | undefined>(undefined);
	const fillPercent = $derived(value === undefined ? 0 : ((value - 1) / 9) * 100);
</script>

<div class="rating">
	<input
		type="range"
		name={value === undefined ? undefined : name}
		min="1"
		max="10"
		step="1"
		value={value ?? 5}
		style="--fill: {fillPercent}%"
		aria-label={label}
		oninput={(event) => (value = event.currentTarget.valueAsNumber)}
	/>
	<output class="rating-value">{value ?? '–'}</output>
</div>

<div class="rating-hints">
	<span>1 = stimme überhaupt nicht zu</span>
	<span>10 = stimme vollständig zu</span>
</div>

<style>
	.rating {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.rating input[type='range'] {
		flex: 1;
		min-width: 0;
		appearance: none;
		-webkit-appearance: none;
		height: 10px;
		border-radius: 999px;
		outline-offset: 4px;
		background: linear-gradient(
			to right,
			var(--accent) 0 var(--fill, 44.4%),
			var(--border) var(--fill, 44.4%) 100%
		);
		cursor: pointer;
	}

	.rating input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--accent);
		border: 3px solid var(--bg);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
	}

	.rating input[type='range']::-moz-range-thumb {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--accent);
		border: 3px solid var(--bg);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
	}

	.rating-value {
		min-width: 2.6rem;
		padding: 0.35rem 0.4rem;
		text-align: center;
		font-weight: 600;
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: var(--radius);
	}

	.rating-hints {
		display: flex;
		justify-content: space-between;
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
