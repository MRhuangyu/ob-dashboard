import type { CardSize, CardType } from './types';

export interface DashboardGridSize {
	cols: number;
	rows: number;
}

export const DASHBOARD_GRID_LIMITS = {
	minCols: 1,
	maxCols: 5,
	minRows: 1,
	maxRows: 6,
} as const;

const SIZE_TO_GRID: Record<CardSize, DashboardGridSize> = {
	S: { cols: 1, rows: 1 },
	M: { cols: 1, rows: 1 },
	L: { cols: 2, rows: 1 },
};

const INTEGRATION_TYPES = new Set<CardType>(['tasks-query', 'dataview', 'excalidraw']);

export function isDashboardIntegrationCard(type: CardType): boolean {
	return INTEGRATION_TYPES.has(type);
}

export function clampDashboardGrid(cols: number, rows: number): DashboardGridSize {
	return {
		cols: Math.max(DASHBOARD_GRID_LIMITS.minCols, Math.min(DASHBOARD_GRID_LIMITS.maxCols, Math.round(cols))),
		rows: Math.max(DASHBOARD_GRID_LIMITS.minRows, Math.min(DASHBOARD_GRID_LIMITS.maxRows, Math.round(rows))),
	};
}

export function getDefaultDashboardGrid(type: CardType, size: CardSize = 'M'): DashboardGridSize {
	if (isDashboardIntegrationCard(type)) {
		return { cols: 2, rows: 3 };
	}
	return SIZE_TO_GRID[size] ?? SIZE_TO_GRID.M;
}

export function getEffectiveDashboardGrid(
	type: CardType,
	size: CardSize = 'M',
	gridCols = 0,
	gridRows = 0,
): DashboardGridSize {
	const fallback = getDefaultDashboardGrid(type, size);
	const hasLegacyIntegrationGrid = isDashboardIntegrationCard(type) && gridCols === 2 && gridRows === 1;
	const cols = !hasLegacyIntegrationGrid && gridCols > 0 ? gridCols : fallback.cols;
	const rows = !hasLegacyIntegrationGrid && gridRows > 0 ? gridRows : fallback.rows;
	return clampDashboardGrid(cols, rows);
}
