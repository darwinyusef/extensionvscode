/**
 * Register all VS Code commands
 */

import * as vscode from 'vscode';
import { WebSocketClient } from '../services/websocket';
import { GoalsTreeProvider } from '../providers/goalsTreeProvider';
import { ApiService } from '../services/api';

export function registerCommands(
    context: vscode.ExtensionContext,
    wsClient: WebSocketClient,
    goalsTreeProvider: GoalsTreeProvider,
    apiService: ApiService
): void {

    // Connect to server
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.connect', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2QzYmZhMi1iZGZjLTQ1NjktYmVmMy1hNTdjMjgxM2FjMTAiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk5NjkyOTc2fQ.sZ6kJsCPiUlHBHiaOkuh34aWJKknPSAualCvelBZgOY';
            apiService.setToken(token);
            wsClient.connect(token);
            await goalsTreeProvider.loadGoals();
        })
    );

    // Disconnect from server
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.disconnect', () => {
            wsClient.disconnect();
        })
    );

    // Create new goal
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.createGoal', async () => {
            const title = await vscode.window.showInputBox({
                prompt: 'Enter goal title',
                placeHolder: 'Learn React Hooks'
            });

            if (!title) return;

            const description = await vscode.window.showInputBox({
                prompt: 'Enter goal description',
                placeHolder: 'Master React Hooks including useState, useEffect, and custom hooks'
            });

            if (!description) return;

            const priorityOptions = ['Low', 'Medium', 'High'];
            const priority = await vscode.window.showQuickPick(priorityOptions, {
                placeHolder: 'Select priority'
            });

            if (!priority) return;

            try {
                const goal = await apiService.createGoal({
                    title,
                    description,
                    priority: priority.toLowerCase() as 'low' | 'medium' | 'high'
                });

                vscode.window.showInformationMessage(`Goal created: ${goal.title}`);
                await goalsTreeProvider.loadGoals();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create goal: ${error}`);
            }
        })
    );

    // Update goal
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.updateGoal', async (item: any) => {
            const goal = goalsTreeProvider.getGoal(item.id);
            if (!goal) return;

            const options = ['Update Title', 'Update Description', 'Update Status', 'Update Priority', 'Delete'];
            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: 'What do you want to update?'
            });

            if (!choice) return;

            try {
                switch (choice) {
                    case 'Update Title': {
                        const title = await vscode.window.showInputBox({
                            prompt: 'Enter new title',
                            value: goal.title
                        });
                        if (title) {
                            await apiService.updateGoal(goal.id, { title });
                            vscode.window.showInformationMessage('Goal updated');
                        }
                        break;
                    }
                    case 'Update Description': {
                        const description = await vscode.window.showInputBox({
                            prompt: 'Enter new description',
                            value: goal.description
                        });
                        if (description) {
                            await apiService.updateGoal(goal.id, { description });
                            vscode.window.showInformationMessage('Goal updated');
                        }
                        break;
                    }
                    case 'Update Status': {
                        const statusOptions = ['Pending', 'In Progress', 'Completed', 'Failed'];
                        const status = await vscode.window.showQuickPick(statusOptions, {
                            placeHolder: 'Select new status'
                        });
                        if (status) {
                            const statusValue = status.toLowerCase().replace(' ', '_') as any;
                            await apiService.updateGoal(goal.id, { status: statusValue });
                            vscode.window.showInformationMessage('Goal status updated');
                        }
                        break;
                    }
                    case 'Update Priority': {
                        const priorityOptions = ['Low', 'Medium', 'High'];
                        const priority = await vscode.window.showQuickPick(priorityOptions, {
                            placeHolder: 'Select new priority'
                        });
                        if (priority) {
                            await apiService.updateGoal(goal.id, {
                                priority: priority.toLowerCase() as 'low' | 'medium' | 'high'
                            });
                            vscode.window.showInformationMessage('Goal priority updated');
                        }
                        break;
                    }
                    case 'Delete': {
                        const confirm = await vscode.window.showWarningMessage(
                            `Are you sure you want to delete "${goal.title}"?`,
                            'Yes', 'No'
                        );
                        if (confirm === 'Yes') {
                            await apiService.deleteGoal(goal.id);
                            vscode.window.showInformationMessage('Goal deleted');
                        }
                        break;
                    }
                }
                await goalsTreeProvider.loadGoals();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to update goal: ${error}`);
            }
        })
    );

    // Start goal
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.startGoal', (item: any) => {
            const goalId = item.id;
            wsClient.send('goal.start', { goal_id: goalId });
        })
    );

    // Validate task
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.validateTask', async (item: any) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const code = editor.document.getText();
            const taskId = item.id;

            wsClient.send('task.validate', {
                task_id: taskId,
                code
            });

            vscode.window.showInformationMessage('Validating task...');
        })
    );

    // Refresh goals
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.refreshGoals', async () => {
            await goalsTreeProvider.loadGoals();
        })
    );

    // Create task
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.createTask', async (item?: any) => {
            let goalId: string | undefined;

            if (item && item.contextValue === 'goal') {
                goalId = item.id;
            } else {
                const goals = goalsTreeProvider.getGoals();
                if (goals.length === 0) {
                    vscode.window.showWarningMessage('No goals available. Create a goal first.');
                    return;
                }

                const goalChoice = await vscode.window.showQuickPick(
                    goals.map(g => ({ label: g.title, id: g.id })),
                    { placeHolder: 'Select a goal for this task' }
                );

                if (!goalChoice) return;
                goalId = goalChoice.id;
            }

            const title = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'Implement useState hook'
            });

            if (!title) return;

            const description = await vscode.window.showInputBox({
                prompt: 'Enter task description',
                placeHolder: 'Create a component using useState for state management'
            });

            if (!description) return;

            const taskTypeOptions = ['Code', 'Research', 'Documentation', 'Testing', 'Review'];
            const taskType = await vscode.window.showQuickPick(taskTypeOptions, {
                placeHolder: 'Select task type'
            });

            if (!taskType) return;

            try {
                const task = await apiService.createTask({
                    goal_id: goalId!,
                    title,
                    description,
                    task_type: taskType.toLowerCase() as any
                });

                vscode.window.showInformationMessage(`Task created: ${task.title}`);
                await goalsTreeProvider.loadGoals();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create task: ${error}`);
            }
        })
    );

    // Update task
    context.subscriptions.push(
        vscode.commands.registerCommand('aiGoalsV2.updateTask', async (item: any) => {
            if (!item.goalId) return;

            const task = goalsTreeProvider.getTask(item.goalId, item.id);
            if (!task) return;

            const options = ['Update Title', 'Update Description', 'Update Status', 'Delete'];
            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: 'What do you want to update?'
            });

            if (!choice) return;

            try {
                switch (choice) {
                    case 'Update Title': {
                        const title = await vscode.window.showInputBox({
                            prompt: 'Enter new title',
                            value: task.title
                        });
                        if (title) {
                            await apiService.updateTask(task.id, { title });
                            vscode.window.showInformationMessage('Task updated');
                        }
                        break;
                    }
                    case 'Update Description': {
                        const description = await vscode.window.showInputBox({
                            prompt: 'Enter new description',
                            value: task.description
                        });
                        if (description) {
                            await apiService.updateTask(task.id, { description });
                            vscode.window.showInformationMessage('Task updated');
                        }
                        break;
                    }
                    case 'Update Status': {
                        const statusOptions = ['To Do', 'In Progress', 'Completed', 'Blocked'];
                        const status = await vscode.window.showQuickPick(statusOptions, {
                            placeHolder: 'Select new status'
                        });
                        if (status) {
                            const statusValue = status.toLowerCase().replace(' ', '_') as any;
                            await apiService.updateTask(task.id, { status: statusValue });
                            vscode.window.showInformationMessage('Task status updated');
                        }
                        break;
                    }
                    case 'Delete': {
                        const confirm = await vscode.window.showWarningMessage(
                            `Are you sure you want to delete "${task.title}"?`,
                            'Yes', 'No'
                        );
                        if (confirm === 'Yes') {
                            await apiService.deleteTask(task.id);
                            vscode.window.showInformationMessage('Task deleted');
                        }
                        break;
                    }
                }
                await goalsTreeProvider.loadGoals();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to update task: ${error}`);
            }
        })
    );
}
