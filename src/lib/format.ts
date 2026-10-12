const dateTimeFormat = new Intl.DateTimeFormat('de-DE', {
	dateStyle: 'medium',
	timeStyle: 'short'
});

const numberFormat = new Intl.NumberFormat('de-DE', {
	maximumFractionDigits: 1
});

/** Formats a timestamp (ms) as German date + time, e.g. "06.10.2026, 12:00". */
export function formatDateTime(timestamp: number): string {
	return dateTimeFormat.format(new Date(timestamp));
}

/** Formats a number with German decimal comma, e.g. 7.25 -> "7,3". */
export function formatNumber(value: number): string {
	return numberFormat.format(value);
}

/** Formats a Date for a `<input type="datetime-local">` value. */
export function toDateTimeLocalValue(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
		`T${pad(date.getHours())}:${pad(date.getMinutes())}`
	);
}
