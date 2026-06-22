export type DataviewViewType = 'TABLE' | 'LIST' | 'TASK';
export type DataviewSourceType = 'vault' | 'folder' | 'tag';
export type DataviewSortDirection = 'ASC' | 'DESC';

export interface DataviewQueryBuilderState {
	viewType: DataviewViewType;
	sourceType: DataviewSourceType;
	sourceValue: string;
	fields: string;
	where: string;
	sortField: string;
	sortDirection: DataviewSortDirection;
	limit: number;
}

export const DEFAULT_DATAVIEW_QUERY_BUILDER_STATE: DataviewQueryBuilderState = {
	viewType: 'TABLE',
	sourceType: 'vault',
	sourceValue: '',
	fields: 'file.link, file.mtime',
	where: '',
	sortField: 'file.mtime',
	sortDirection: 'DESC',
	limit: 20,
};

export function buildDataviewQuery(state: DataviewQueryBuilderState): string {
	const lines: string[] = [];
	const fields = state.fields.trim();

	if (state.viewType === 'TABLE') {
		lines.push(fields ? `TABLE ${fields}` : 'TABLE file.link, file.mtime');
	} else {
		lines.push(state.viewType);
	}

	lines.push(`FROM ${formatSource(state.sourceType, state.sourceValue)}`);

	const where = state.where.trim();
	if (where) lines.push(`WHERE ${where}`);

	const sortField = state.sortField.trim();
	if (sortField) lines.push(`SORT ${sortField} ${state.sortDirection}`);

	if (state.limit > 0) lines.push(`LIMIT ${Math.floor(state.limit)}`);

	return lines.join('\n');
}

function formatSource(type: DataviewSourceType, rawValue: string): string {
	const value = rawValue.trim();
	if (type === 'tag') {
		if (!value) return '#tag';
		return value.startsWith('#') ? value : `#${value}`;
	}
	if (type === 'folder') {
		const folder = value.replace(/^\/+|\/+$/g, '');
		return `"${folder}"`;
	}
	return '""';
}
