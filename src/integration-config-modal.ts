import { App, Modal, setIcon, TFile } from 'obsidian';
import type { DashboardCard, DataviewConfig, TasksQueryConfig } from './types';
import { t } from './i18n';

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
		const query = this.addTextarea(form, t('tasksQuery.queryLabel'), config.query);
		const limit = this.addInput(form, t('tasksQuery.limitLabel'), String(config.limit), 'number');
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
