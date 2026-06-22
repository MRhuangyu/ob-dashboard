export type TasksQueryStatus = 'any' | 'not-done' | 'done';
export type TasksQueryDue = 'none' | 'today' | 'before-tomorrow' | 'this-week' | 'overdue';
export type TasksQueryPriority = 'any' | 'high' | 'medium' | 'low';
export type TasksQuerySort = 'none' | 'due' | 'priority' | 'path';

export interface TasksQueryBuilderState {
	status: TasksQueryStatus;
	due: TasksQueryDue;
	folder: string;
	tag: string;
	priority: TasksQueryPriority;
	sort: TasksQuerySort;
}

export const DEFAULT_TASKS_QUERY_BUILDER_STATE: TasksQueryBuilderState = {
	status: 'not-done',
	due: 'before-tomorrow',
	folder: '',
	tag: '',
	priority: 'any',
	sort: 'due',
};

export function buildTasksQuery(state: TasksQueryBuilderState): string {
	const lines: string[] = [];

	if (state.status === 'not-done') lines.push('not done');
	if (state.status === 'done') lines.push('done');

	if (state.due === 'today') lines.push('due today');
	if (state.due === 'before-tomorrow') lines.push('due before tomorrow');
	if (state.due === 'this-week') lines.push('due this week');
	if (state.due === 'overdue') lines.push('due before today');

	const folder = state.folder.trim().replace(/^\/+|\/+$/g, '');
	if (folder) lines.push(`path includes ${folder}`);

	const tag = normalizeTag(state.tag);
	if (tag) lines.push(`tag includes ${tag}`);

	if (state.priority !== 'any') lines.push(`priority is ${state.priority}`);

	if (state.sort !== 'none') lines.push(`sort by ${state.sort}`);

	return lines.join('\n');
}

function normalizeTag(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return '';
	return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
