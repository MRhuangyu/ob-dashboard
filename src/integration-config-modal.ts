import { App, Modal, setIcon, TFile } from 'obsidian';
import type { DashboardCard, DataviewConfig, TasksQueryConfig } from './types';
import { t } from './i18n';
import {
	buildTasksQuery,
	DEFAULT_TASKS_QUERY_BUILDER_STATE,
	type TasksQueryBuilderState,
	type TasksQueryDue,
	type TasksQueryPriority,
	type TasksQuerySort,
	type TasksQueryStatus,
} from './tasks-query-builder';

export interface IntegrationUpdates {
	title?: string;
	tasksQueryConfig?: TasksQueryConfig;
	dataviewConfig?: DataviewConfig;
	excalidrawPath?: string;
}

export class IntegrationConfigModal extends Modal {
	private card: DashboardCard;
	private onSave: (updates: IntegrationUpdates) => void;
	private theme: string;

	constructor(app: App, card: DashboardCard, onSave: (updates: IntegrationUpdates) => void, theme?: string) {
		super(app);
		this.card = card;
		this.onSave = onSave;
		this.theme = theme ?? 'earth';
	}

	onOpen(): void {
		const { contentEl, containerEl } = this;
		containerEl.dataset.theme = this.theme;
		contentEl.addClass('dashboard-modal');
		containerEl.addClass('modal--dashboard');
		containerEl.parentElement?.addClass('modal-bg--dashboard');
		contentEl.createEl('h2', { text: t('integration.configTitle') });

		const form = contentEl.createDiv({ cls: 'dashboard-modal-form' });
		const titleInput = this.addInput(form, t('cardEdit.titleLabel'), this.card.title);

		if (this.card.type === 'tasks-query') {
			this.renderTasksConfig(form, titleInput);
		} else if (this.card.type === 'dataview') {
			this.renderDataviewConfig(form, titleInput);
		} else if (this.card.type === 'excalidraw') {
			this.renderExcalidrawConfig(form, titleInput);
		}
	}

	private renderTasksConfig(form: HTMLElement, titleInput: HTMLInputElement): void {
		const config = this.card.tasksQueryConfig ?? { query: 'not done\ndue before tomorrow\nsort by due', limit: 30 };
		const builder = form.createDiv({ cls: 'dashboard-query-builder' });
		builder.createEl('h3', { cls: 'dashboard-query-builder-title', text: t('tasksQuery.builderTitle') });

		const fields = builder.createDiv({ cls: 'dashboard-query-builder-grid' });
		const status = this.addSelect<TasksQueryStatus>(fields, t('tasksQuery.statusLabel'), [
			['not-done', t('tasksQuery.statusNotDone')],
			['done', t('tasksQuery.statusDone')],
			['any', t('tasksQuery.statusAny')],
		], DEFAULT_TASKS_QUERY_BUILDER_STATE.status);
		const due = this.addSelect<TasksQueryDue>(fields, t('tasksQuery.dueLabel'), [
			['before-tomorrow', t('tasksQuery.dueBeforeTomorrow')],
			['today', t('tasksQuery.dueToday')],
			['this-week', t('tasksQuery.dueThisWeek')],
			['overdue', t('tasksQuery.dueOverdue')],
			['none', t('tasksQuery.dueNone')],
		], DEFAULT_TASKS_QUERY_BUILDER_STATE.due);
		const folder = this.addInput(fields, t('tasksQuery.folderLabel'), DEFAULT_TASKS_QUERY_BUILDER_STATE.folder);
		const tag = this.addInput(fields, t('tasksQuery.tagLabel'), DEFAULT_TASKS_QUERY_BUILDER_STATE.tag);
		const priority = this.addSelect<TasksQueryPriority>(fields, t('tasksQuery.priorityLabel'), [
			['any', t('tasksQuery.priorityAny')],
			['high', t('tasksQuery.priorityHigh')],
			['medium', t('tasksQuery.priorityMedium')],
			['low', t('tasksQuery.priorityLow')],
		], DEFAULT_TASKS_QUERY_BUILDER_STATE.priority);
		const sort = this.addSelect<TasksQuerySort>(fields, t('tasksQuery.sortLabel'), [
			['due', t('tasksQuery.sortDue')],
			['priority', t('tasksQuery.sortPriority')],
			['path', t('tasksQuery.sortPath')],
			['none', t('tasksQuery.sortNone')],
		], DEFAULT_TASKS_QUERY_BUILDER_STATE.sort);

		const generateBtn = builder.createEl('button', {
			cls: 'dashboard-query-builder-generate mod-cta',
			text: t('tasksQuery.generateQuery'),
			attr: { type: 'button' },
		});

		const query = this.addTextarea(form, t('tasksQuery.queryLabel'), config.query);
		const limit = this.addInput(form, t('tasksQuery.limitLabel'), String(config.limit), 'number');
		generateBtn.addEventListener('click', () => {
			const state: TasksQueryBuilderState = {
				status: status.value as TasksQueryStatus,
				due: due.value as TasksQueryDue,
				folder: folder.value,
				tag: tag.value,
				priority: priority.value as TasksQueryPriority,
				sort: sort.value as TasksQuerySort,
			};
			query.value = buildTasksQuery(state);
			query.focus();
		});
		this.addActions(form, () => {
			this.onSave({
				title: titleInput.value.trim() || this.card.title,
				tasksQueryConfig: {
					query: query.value.trim() || config.query,
					limit: parseInt(limit.value, 10) || 30,
				},
			});
		});
	}

	private renderDataviewConfig(form: HTMLElement, titleInput: HTMLInputElement): void {
		const config = this.card.dataviewConfig ?? { query: 'TABLE file.mtime AS 修改时间\nFROM ""\nSORT file.mtime DESC\nLIMIT 20', limit: 50 };
		const query = this.addTextarea(form, t('dataview.queryLabel'), config.query);
		const limit = this.addInput(form, t('dataview.limitLabel'), String(config.limit), 'number');
		this.addActions(form, () => {
			this.onSave({
				title: titleInput.value.trim() || this.card.title,
				dataviewConfig: {
					query: query.value.trim() || config.query,
					limit: parseInt(limit.value, 10) || 50,
				},
			});
		});
	}

	private renderExcalidrawConfig(form: HTMLElement, titleInput: HTMLInputElement): void {
		let selectedPath = this.card.excalidrawPath ?? '';
		const selected = form.createDiv({ cls: 'dashboard-modal-docs-list' });
		const renderSelected = () => {
			selected.empty();
			selected.createDiv({ cls: 'dashboard-modal-doc-item', text: selectedPath || t('excalidraw.noDrawing') });
		};
		renderSelected();

		const search = this.addInput(form, t('excalidraw.searchDrawing'), '');
		const results = form.createDiv({ cls: 'dashboard-modal-search-results' });
		const renderResults = () => {
			results.empty();
			const q = search.value.toLowerCase().trim();
			if (!q) return;
			const files = this.getExcalidrawFiles()
				.filter(file => file.path.toLowerCase().includes(q) || file.basename.toLowerCase().includes(q))
				.slice(0, 30);
			for (const file of files) {
				const item = results.createDiv({ cls: 'dashboard-modal-search-item' });
				const icon = item.createDiv({ cls: 'dashboard-modal-search-check' });
				setIcon(icon, 'pen-tool');
				const info = item.createDiv({ cls: 'dashboard-modal-search-info' });
				info.createSpan({ cls: 'dashboard-modal-search-name', text: file.basename });
				info.createSpan({ cls: 'dashboard-modal-search-path', text: file.path });
				item.addEventListener('click', () => {
					selectedPath = file.path;
					search.value = '';
					results.empty();
					renderSelected();
				});
			}
		};
		search.addEventListener('input', renderResults);

		this.addActions(form, () => {
			this.onSave({
				title: titleInput.value.trim() || this.card.title,
				excalidrawPath: selectedPath,
			});
		});
	}

	private addInput(form: HTMLElement, labelText: string, value: string, type = 'text'): HTMLInputElement {
		const field = form.createDiv();
		field.createEl('label', { text: labelText });
		const input = field.createEl('input', {
			cls: 'dashboard-modal-input',
			attr: { type, value },
		});
		return input;
	}

	private addSelect<T extends string>(form: HTMLElement, labelText: string, options: Array<[T, string]>, value: T): HTMLSelectElement {
		const field = form.createDiv();
		field.createEl('label', { text: labelText });
		const select = field.createEl('select', {
			cls: 'dashboard-modal-input',
		});
		for (const [optionValue, label] of options) {
			const option = select.createEl('option', {
				text: label,
				attr: { value: optionValue },
			});
			if (optionValue === value) option.selected = true;
		}
		return select;
	}

	private addTextarea(form: HTMLElement, labelText: string, value: string): HTMLTextAreaElement {
		const field = form.createDiv();
		field.createEl('label', { text: labelText });
		const textarea = field.createEl('textarea', {
			cls: 'dashboard-modal-input dashboard-integration-textarea',
			text: value,
		});
		textarea.rows = 8;
		return textarea;
	}

	private addActions(form: HTMLElement, onSave: () => void): void {
		const actions = form.createDiv({ cls: 'dashboard-modal-actions' });
		const saveBtn = actions.createEl('button', { cls: 'mod-cta', text: t('common.save') });
		saveBtn.addEventListener('click', () => {
			onSave();
			this.close();
		});
		const cancelBtn = actions.createEl('button', { text: t('common.cancel') });
		cancelBtn.addEventListener('click', () => this.close());
	}

	private getExcalidrawFiles(): TFile[] {
		return this.app.vault.getFiles().filter(file =>
			file.path.endsWith('.excalidraw') ||
			file.path.endsWith('.excalidraw.md') ||
			file.path.toLowerCase().includes('excalidraw')
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
