import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildTasksQuery } from '../test-dist/tasks-query-builder.js';

test('builds a common unfinished due-soon query', () => {
	assert.equal(buildTasksQuery({
		status: 'not-done',
		due: 'before-tomorrow',
		folder: '',
		tag: '',
		priority: 'any',
		sort: 'due',
		groupBy: 'none',
		hideSource: false,
		hideEditButton: false,
		hideTaskId: false,
		hideDoneDate: false,
	}), [
		'not done',
		'due before tomorrow',
		'sort by due',
	].join('\n'));
});

test('builds folder tag priority and path sort filters', () => {
	assert.equal(buildTasksQuery({
		status: 'done',
		due: 'overdue',
		folder: 'Projects/Work',
		tag: '#work',
		priority: 'high',
		sort: 'path',
		groupBy: 'none',
		hideSource: false,
		hideEditButton: false,
		hideTaskId: false,
		hideDoneDate: false,
	}), [
		'done',
		'due before today',
		'path includes Projects/Work',
		'tag includes #work',
		'priority is high',
		'sort by path',
	].join('\n'));
});

test('omits filters set to any or none', () => {
	assert.equal(buildTasksQuery({
		status: 'any',
		due: 'none',
		folder: '',
		tag: '',
		priority: 'any',
		sort: 'none',
		groupBy: 'none',
		hideSource: false,
		hideEditButton: false,
		hideTaskId: false,
		hideDoneDate: false,
	}), '');
});

test('builds display options for compact dashboard task cards', () => {
	assert.equal(buildTasksQuery({
		status: 'not-done',
		due: 'none',
		folder: '',
		tag: '',
		priority: 'any',
		sort: 'priority',
		groupBy: 'heading',
		hideSource: true,
		hideEditButton: true,
		hideTaskId: true,
		hideDoneDate: true,
	}), [
		'not done',
		'sort by priority',
		'group by heading',
		'hide backlink',
		'hide edit button',
		'hide task id',
		'hide done date',
	].join('\n'));
});
