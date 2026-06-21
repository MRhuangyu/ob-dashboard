import type { App } from 'obsidian';

export interface DataviewResult {
	type: 'table' | 'list' | 'task' | 'raw';
	headers: string[];
	rows: unknown[][];
	values: unknown[];
	error?: string;
}

interface DataviewApi {
	query?: (query: string, file?: string) => Promise<unknown>;
}

export async function runDataviewQuery(app: App, query: string): Promise<DataviewResult> {
	const api = getDataviewApi(app);
	if (!api?.query) {
		return { type: 'raw', headers: [], rows: [], values: [], error: 'Dataview plugin API is not available' };
	}

	try {
		const result = await api.query(query);
		return normalizeDataviewResult(result);
	} catch (err) {
		return {
			type: 'raw',
			headers: [],
			rows: [],
			values: [],
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

function getDataviewApi(app: App): DataviewApi | null {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((app as any).plugins?.plugins?.dataview?.api ?? null) as DataviewApi | null;
}

function normalizeDataviewResult(raw: unknown): DataviewResult {
	const rec = raw as Record<string, unknown>;
	if (rec.success === false) {
		return { type: 'raw', headers: [], rows: [], values: [], error: String(rec.error ?? 'Dataview query failed') };
	}

	const value = (rec.value ?? raw) as Record<string, unknown>;
	const type = String(value.type ?? '').toLowerCase();

	if (type === 'table') {
		const headers = Array.isArray(value.headers) ? value.headers.map(String) : [];
		const rows = Array.isArray(value.values) ? value.values as unknown[][] : [];
		return { type: 'table', headers, rows, values: [] };
	}

	if (type === 'list' || type === 'task') {
		const values = Array.isArray(value.values) ? value.values : [];
		return { type: type as 'list' | 'task', headers: [], rows: [], values };
	}

	if (Array.isArray(value.values)) {
		return { type: 'list', headers: [], rows: [], values: value.values };
	}

	return { type: 'raw', headers: [], rows: [], values: [value] };
}

export function formatDataviewValue(value: unknown): string {
	if (value == null) return '';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'object') {
		const rec = value as Record<string, unknown>;
		if (rec.path) return String(rec.path);
		if (rec.display) return String(rec.display);
		if (rec.text) return String(rec.text);
		if (rec.value != null) return formatDataviewValue(rec.value);
	}
	return String(value);
}
