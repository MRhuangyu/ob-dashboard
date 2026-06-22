import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	clampDashboardGrid,
	getDefaultDashboardGrid,
	getEffectiveDashboardGrid,
} from '../test-dist/dashboard-grid.js';

test('uses compact defaults for lightweight dashboard widgets', () => {
	assert.deepEqual(getDefaultDashboardGrid('weather', 'M'), { cols: 1, rows: 1 });
	assert.deepEqual(getDefaultDashboardGrid('tracker', 'L'), { cols: 2, rows: 1 });
});

test('uses taller defaults for native integration widgets', () => {
	assert.deepEqual(getDefaultDashboardGrid('tasks-query', 'M'), { cols: 2, rows: 3 });
	assert.deepEqual(getDefaultDashboardGrid('dataview', 'S'), { cols: 2, rows: 3 });
	assert.deepEqual(getDefaultDashboardGrid('excalidraw', 'L'), { cols: 2, rows: 3 });
});

test('preserves user grid values and migrates old integration defaults', () => {
	assert.deepEqual(getEffectiveDashboardGrid('weather', 'M', 3, 2), { cols: 3, rows: 2 });
	assert.deepEqual(getEffectiveDashboardGrid('tasks-query', 'M', 2, 1), { cols: 2, rows: 3 });
});

test('clamps dashboard grid dimensions to supported bounds', () => {
	assert.deepEqual(clampDashboardGrid(-1, 20), { cols: 1, rows: 6 });
	assert.deepEqual(clampDashboardGrid(4, 0), { cols: 4, rows: 1 });
});
