/**
 * TreeView Provider for Goals and Tasks
 */

import * as vscode from 'vscode';
import { WebSocketClient } from '../services/websocket';
import { ApiService } from '../services/api';
import { Goal, Task } from '../types/api';

export class GoalsTreeProvider implements vscode.TreeDataProvider<GoalTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GoalTreeItem | undefined | null | void> =
        new vscode.EventEmitter<GoalTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GoalTreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private goals: Goal[] = [];
    private tasksCache: Map<string, Task[]> = new Map();

    constructor(
        private wsClient: WebSocketClient,
        private apiService: ApiService
    ) {
        this.wsClient.on('goals.list', (data) => {
            this.goals = data.goals || [];
            this.refresh();
        });

        this.wsClient.on('goal.created', () => {
            this.loadGoals();
        });

        this.wsClient.on('goal.updated', () => {
            this.loadGoals();
        });

        this.wsClient.on('task.created', () => {
            this.loadGoals();
        });

        this.wsClient.on('task.updated', () => {
            this.loadGoals();
        });
    }

    async loadGoals(): Promise<void> {
        try {
            this.goals = await this.apiService.listGoals();

            for (const goal of this.goals) {
                const tasks = await this.apiService.listTasks({ goal_id: goal.id });
                this.tasksCache.set(goal.id, tasks);
            }

            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load goals: ${error}`);
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GoalTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GoalTreeItem): Promise<GoalTreeItem[]> {
        if (!element) {
            return this.goals.map(goal => new GoalTreeItem(goal, 'goal'));
        } else if (element.contextValue === 'goal') {
            const tasks = this.tasksCache.get(element.id);
            if (tasks) {
                return tasks.map(task => new TaskTreeItem(task, element.id)) as any;
            }
        }
        return [];
    }

    // ==================== Helper Methods ====================

    public getGoals(): Goal[] {
        return this.goals;
    }

    public getGoal(goalId: string): Goal | undefined {
        return this.goals.find(g => g.id === goalId);
    }

    public getTask(goalId: string, taskId: string): Task | undefined {
        const tasks = this.tasksCache.get(goalId);
        return tasks?.find(t => t.id === taskId);
    }
}

class GoalTreeItem extends vscode.TreeItem {
    constructor(
        public readonly goal: Goal,
        public readonly contextValue: string
    ) {
        super(goal.title, vscode.TreeItemCollapsibleState.Collapsed);

        this.id = goal.id;
        this.description = goal.status;
        this.tooltip = goal.description;

        // Icon based on status
        this.iconPath = new vscode.ThemeIcon(
            goal.status === 'completed' ? 'check' :
            goal.status === 'in_progress' ? 'loading~spin' :
            goal.status === 'failed' ? 'error' :
            'circle-outline'
        );

        this.contextValue = 'goal';
    }
}

class TaskTreeItem extends vscode.TreeItem {
    constructor(
        public readonly task: Task,
        public readonly goalId: string
    ) {
        super(task.title, vscode.TreeItemCollapsibleState.None);

        this.id = task.id;
        this.contextValue = 'task';
        this.description = task.status;
        this.tooltip = task.description;

        // Icon based on status
        this.iconPath = new vscode.ThemeIcon(
            task.status === 'completed' ? 'pass' :
            task.status === 'in_progress' ? 'sync~spin' :
            task.status === 'blocked' ? 'error' :
            'circle-outline'
        );

        this.contextValue = 'task';
    }
}

// ==================== Types ====================

