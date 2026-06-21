import { App, TFile } from 'obsidian';

export interface VaultTask {
	text: string;
	done: boolean;
	path: string;
	line: number;
	due?: string;
	scheduled?: string;
	tags: string[];
	priority?: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
}

const TASK_RE = /^(\s*)- \[([ xX])\]\s+(.+)$/;
const DUE_RE = /📅\s*(\d{4}-\d{2}-\d{2})/;
const SCHEDULED_RE = /⏳\s*(\d{4}-\d{2}-\d{2})/;
const TAG_RE = /#[\p{L}\p{N}_/-]+/gu;

export async function queryVaultTasks(app: App, query: string, limit: number): Promise<VaultTask[]> {
	const files = app.vault.getMarkdownFiles().filter(file => !file.path.startsWith('.'));
	const tasks: VaultTask[] = [];

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const lines = content.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTaskLine(lines[i]!, file, i);
			if (parsed) tasks.push(parsed);
		}
	}

	const filtered = applyQuery(tasks, query);
	return filtered.slice(0, Math.max(1, limit));
}

function parseTaskLine(line: string, file: TFile, lineNumber: number): VaultTask | null {
	const match = line.match(TASK_RE);
	if (!match) return null;
	const rawText = match[3]!.trim();
	const due = rawText.match(DUE_RE)?.[1];
	const scheduled = rawText.match(SCHEDULED_RE)?.[1];
	const tags = rawText.match(TAG_RE) ?? [];
	return {
		text: rawText,
		done: match[2]!.toLowerCase() === 'x',
		path: file.path,
		line: lineNumber,
		due,
		scheduled,
		tags,
		priority: parsePriority(rawText),
	};
}

function parsePriority(text: string): VaultTask['priority'] {
	if (text.includes('🔺')) return 'highest';
	if (text.includes('🔼')) return 'high';
	if (text.includes('🔽')) return 'low';
	if (text.includes('⏬')) return 'lowest';
	return 'medium';
}

function applyQuery(tasks: VaultTask[], query: string): VaultTask[] {
	let result = [...tasks];
	const lines = normalizeQueryLines(query);

	for (const line of lines) {
		const lower = line.toLowerCase();
		if (lower === 'not done') result = result.filter(task => !task.done);
		else if (lower === 'done') result = result.filter(task => task.done);
		else if (lower === 'done today') result = result.filter(task => task.done && task.text.includes(`✅ ${today()}`));
		else if (lower === 'done this week') result = result.filter(task => task.done && isThisWeek(extractDoneDate(task.text)));
		else if (lower === 'no due date') result = result.filter(task => !task.due);
		else if (lower === 'due before tomorrow') result = result.filter(task => task.due != null && task.due < addDays(1));
		else if (lower === 'due today') result = result.filter(task => task.due === today());
		else if (lower === 'due this week') result = result.filter(task => task.due != null && isThisWeek(task.due));
		else if (lower.startsWith('due before in ')) {
			const days = parseInt(lower.replace('due before in ', '').replace(/\D+/g, ''), 10);
			if (!isNaN(days)) result = result.filter(task => task.due != null && task.due < addDays(days));
		} else if (lower === 'scheduled before tomorrow') {
			result = result.filter(task => task.scheduled != null && task.scheduled < addDays(1));
		} else if (lower.startsWith('path includes ')) {
			const needle = line.slice('path includes '.length).trim().toLowerCase();
			result = result.filter(task => task.path.toLowerCase().includes(needle));
		} else if (lower.startsWith('filename includes ')) {
			const needle = line.slice('filename includes '.length).trim().toLowerCase();
			result = result.filter(task => task.path.split('/').pop()?.toLowerCase().includes(needle));
		} else if (lower.startsWith('description includes ')) {
			const needle = line.slice('description includes '.length).trim().toLowerCase();
			result = result.filter(task => task.text.toLowerCase().includes(needle));
		} else if (lower.startsWith('tags include ')) {
			const tag = line.slice('tags include '.length).trim();
			result = result.filter(task => task.tags.includes(tag));
		} else if (lower.startsWith('priority is above medium')) {
			result = result.filter(task => task.priority === 'highest' || task.priority === 'high');
		} else if (lower.startsWith('priority is ')) {
			const priority = lower.slice('priority is '.length).trim();
			result = result.filter(task => task.priority === priority);
		} else if (lower === 'sort by due') {
			result.sort((a, b) => (a.due ?? '9999-99-99').localeCompare(b.due ?? '9999-99-99'));
		} else if (lower === 'sort by due reverse') {
			result.sort((a, b) => (b.due ?? '').localeCompare(a.due ?? ''));
		} else if (lower === 'sort by priority') {
			result.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
		} else if (lower === 'sort by done reverse') {
			result.sort((a, b) => (extractDoneDate(b.text) ?? '').localeCompare(extractDoneDate(a.text) ?? ''));
		} else if (lower.startsWith('limit ')) {
			const count = parseInt(lower.slice('limit '.length), 10);
			if (!isNaN(count)) result = result.slice(0, count);
		}
	}

	return result;
}

function normalizeQueryLines(query: string): string[] {
	let cleaned = query.trim();
	cleaned = cleaned.replace(/^```tasks\s*/i, '');
	cleaned = cleaned.replace(/\s*```$/i, '');
	const directLines = cleaned.split('\n').map(line => line.trim()).filter(Boolean);
	if (directLines.length > 1) return directLines;

	const oneLine = directLines[0] ?? '';
	const patterns = [
		/not done/g,
		/done this week/g,
		/done today/g,
		/done/g,
		/no due date/g,
		/due before tomorrow/g,
		/due today/g,
		/due this week/g,
		/due before in \d+ days?/g,
		/scheduled before tomorrow/g,
		/path includes [^]+?(?=\s(?:not done|done|no due date|due |scheduled |filename |tags |priority |sort |limit )|$)/g,
		/filename includes [^]+?(?=\s(?:not done|done|no due date|due |scheduled |path |tags |priority |sort |limit )|$)/g,
		/description includes [^]+?(?=\s(?:not done|done|no due date|due |scheduled |path |filename |tags |priority |sort |limit )|$)/g,
		/tags include #[\p{L}\p{N}_/-]+/gu,
		/priority is above medium/g,
		/priority is (?:highest|high|medium|low|lowest)/g,
		/sort by due reverse/g,
		/sort by due/g,
		/sort by priority/g,
		/sort by done reverse/g,
		/limit \d+/g,
	];
	const matches: Array<{ index: number; text: string }> = [];
	for (const pattern of patterns) {
		for (const match of oneLine.matchAll(pattern)) {
			if (match.index != null) matches.push({ index: match.index, text: match[0].trim() });
		}
	}
	if (matches.length === 0) return directLines;
	return matches
		.sort((a, b) => a.index - b.index)
		.filter((item, idx, arr) => idx === 0 || item.index !== arr[idx - 1]!.index)
		.map(item => item.text);
}

function priorityRank(priority: VaultTask['priority']): number {
	switch (priority) {
		case 'highest': return 5;
		case 'high': return 4;
		case 'medium': return 3;
		case 'low': return 2;
		case 'lowest': return 1;
		default: return 0;
	}
}

function extractDoneDate(text: string): string | undefined {
	return text.match(/✅\s*(\d{4}-\d{2}-\d{2})/)?.[1];
}

function today(): string {
	return formatDate(new Date());
}

function addDays(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return formatDate(date);
}

function isThisWeek(dateStr: string | undefined): boolean {
	if (!dateStr) return false;
	const date = new Date(`${dateStr}T00:00:00`);
	const now = new Date();
	const start = new Date(now);
	const day = start.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	start.setDate(start.getDate() + diff);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(start.getDate() + 7);
	return date >= start && date < end;
}

function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
