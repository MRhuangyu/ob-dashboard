export type TasksQueryStatus = 'any' | 'not-done' | 'done';
export type TasksQueryDue = 'none' | 'today' | 'before-tomorrow' | 'this-week' | 'overdue';
export type TasksQueryPriority = 'any' | 'high' | 'medium' | 'low';
export type TasksQuerySort = 'none' | 'due' | 'priority' | 'path';
export type TasksQueryGroupBy = 'none' | 'heading' | 'filename' | 'folder' | 'due' | 'priority';

export interface TasksQueryBuilderState {
	status: TasksQueryStatus;
	due: TasksQueryDue;
	folder: string;
	tag: string;
	priority: TasksQueryPriority;
	sort: TasksQuerySort;
	groupBy: TasksQueryGroupBy;
	hideSource: boolean;
	hideEditButton: boolean;
	hideTaskId: boolean;
	hideDoneDate: boolean;
	limit: number;
}

export const DEFAULT_TASKS_QUERY_BUILDER_STATE: TasksQueryBuilderState = {
	status: 'not-done',
	due: 'before-tomorrow',
	folder: '',
	tag: '',
	priority: 'any',
	sort: 'due',
	groupBy: 'none',
	hideSource: true,
	hideEditButton: true,
	hideTaskId: true,
	hideDoneDate: false,
	limit: 30,
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
	if (state.groupBy !== 'none') lines.push(`group by ${state.groupBy}`);
	if (state.hideSource) lines.push('hide backlink');
	if (state.hideEditButton) lines.push('hide edit button');
	if (state.hideTaskId) lines.push('hide task id');
	if (state.hideDoneDate) lines.push('hide done date');
	if (state.limit > 0) lines.push(`limit ${Math.floor(state.limit)}`);

	return lines.join('\n');
}

function normalizeTag(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return '';
	return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
