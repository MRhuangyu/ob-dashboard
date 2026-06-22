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
	}), '');
});
