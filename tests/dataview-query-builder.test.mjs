import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDataviewQuery } from '../test-dist/dataview-query-builder.js';

test('builds a table query with folder source sorting and limit', () => {
	assert.equal(buildDataviewQuery({
		viewType: 'TABLE',
		sourceType: 'folder',
		sourceValue: 'Projects',
		fields: 'file.link, file.mtime',
		where: '',
		sortField: 'file.mtime',
		sortDirection: 'DESC',
		limit: 20,
	}), [
		'TABLE file.link, file.mtime',
		'FROM "Projects"',
		'SORT file.mtime DESC',
		'LIMIT 20',
	].join('\n'));
});

test('builds a list query with tag source and where filter', () => {
	assert.equal(buildDataviewQuery({
		viewType: 'LIST',
		sourceType: 'tag',
		sourceValue: '#book',
		fields: '',
		where: 'status = "reading"',
		sortField: '',
		sortDirection: 'ASC',
		limit: 0,
	}), [
		'LIST',
		'FROM #book',
		'WHERE status = "reading"',
	].join('\n'));
});

test('builds a task query for the whole vault', () => {
	assert.equal(buildDataviewQuery({
		viewType: 'TASK',
		sourceType: 'vault',
		sourceValue: '',
		fields: '',
		where: '!completed',
		sortField: 'file.name',
		sortDirection: 'ASC',
		limit: 10,
	}), [
		'TASK',
		'FROM ""',
		'WHERE !completed',
		'SORT file.name ASC',
		'LIMIT 10',
	].join('\n'));
});
