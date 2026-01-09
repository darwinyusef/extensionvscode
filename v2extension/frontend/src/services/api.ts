import * as vscode from 'vscode';
import { Goal, GoalCreate, GoalUpdate, Task, TaskCreate, TaskUpdate } from '../types/api';

export class ApiService {
    private baseUrl: string;
    private token: string | null = null;

    constructor() {
        const config = vscode.workspace.getConfiguration('aiGoalsV2');
        this.baseUrl = config.get<string>('apiUrl', 'http://localhost:8000/api/v1');
    }

    setToken(token: string) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    async listGoals(params?: {
        status?: string;
        course_id?: string;
        skip?: number;
        limit?: number;
    }): Promise<Goal[]> {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status_filter', params.status);
        if (params?.course_id) queryParams.append('course_id', params.course_id);
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return this.request<Goal[]>(`/goals${query ? '?' + query : ''}`);
    }

    async getGoal(goalId: string): Promise<Goal> {
        return this.request<Goal>(`/goals/${goalId}`);
    }

    async createGoal(data: GoalCreate): Promise<Goal> {
        return this.request<Goal>('/goals', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateGoal(goalId: string, data: GoalUpdate): Promise<Goal> {
        return this.request<Goal>(`/goals/${goalId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteGoal(goalId: string): Promise<void> {
        await this.request<void>(`/goals/${goalId}`, {
            method: 'DELETE'
        });
    }

    async updateGoalProgress(goalId: string, progress: number): Promise<Goal> {
        return this.request<Goal>(`/goals/${goalId}/progress?progress_percentage=${progress}`, {
            method: 'PATCH'
        });
    }

    async listTasks(params?: {
        goal_id?: string;
        status?: string;
        task_type?: string;
        skip?: number;
        limit?: number;
    }): Promise<Task[]> {
        const queryParams = new URLSearchParams();
        if (params?.goal_id) queryParams.append('goal_id', params.goal_id);
        if (params?.status) queryParams.append('status_filter', params.status);
        if (params?.task_type) queryParams.append('task_type', params.task_type);
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return this.request<Task[]>(`/tasks${query ? '?' + query : ''}`);
    }

    async getTask(taskId: string): Promise<Task> {
        return this.request<Task>(`/tasks/${taskId}`);
    }

    async createTask(data: TaskCreate): Promise<Task> {
        return this.request<Task>('/tasks', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTask(taskId: string, data: TaskUpdate): Promise<Task> {
        return this.request<Task>(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteTask(taskId: string): Promise<void> {
        await this.request<void>(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }
}
