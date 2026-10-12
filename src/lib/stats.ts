/**
 * Descriptive statistics for a 1–10 rating distribution (count per rating
 * value). Quartiles use linear interpolation, so values may be fractional.
 */
export type RatingStat = {
	/** Total number of ratings. */
	n: number;
	mean: number;
	min: number;
	max: number;
	q1: number;
	median: number;
	q3: number;
};

export function ratingStats(
	distribution: ReadonlyArray<{ rating: number; count: number }>
): RatingStat | null {
	const counts = new Map(distribution.map((d) => [d.rating, d.count]));

	let n = 0;
	let sum = 0;
	for (const [rating, count] of counts) {
		n += count;
		sum += rating * count;
	}
	if (n === 0) return null;

	/** Value at the given index (0-based) of the expanded, sorted ratings. */
	const valueAt = (index: number): number => {
		let acc = 0;
		for (let rating = 1; rating <= 10; rating++) {
			acc += counts.get(rating) ?? 0;
			if (index < acc) return rating;
		}
		return 10;
	};

	const quantile = (p: number): number => {
		const pos = p * (n - 1);
		const lo = Math.floor(pos);
		const hi = Math.ceil(pos);
		return valueAt(lo) + (valueAt(hi) - valueAt(lo)) * (pos - lo);
	};

	return {
		n,
		mean: sum / n,
		min: valueAt(0),
		max: valueAt(n - 1),
		q1: quantile(0.25),
		median: quantile(0.5),
		q3: quantile(0.75)
	};
}
