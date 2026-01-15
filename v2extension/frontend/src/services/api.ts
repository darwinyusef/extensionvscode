import * as vscode from 'vscode';
import axios, { AxiosRequestConfig } from 'axios';
import { Goal, GoalCreate, GoalUpdate, Task, TaskCreate, TaskUpdate } from '../types/api';
import { Logger } from './logger';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user_id: string;
}

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

    getToken(): string | null {
        return this.token;
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        const url = `${this.baseUrl}/auth/login`;

        try {
            Logger.info(`API Backend Request: ${url}`);
            const response = await axios.post<LoginResponse>(url,
                new URLSearchParams({
                    username: email,
                    password: password
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            Logger.info(`API Backend Response: login -> Status ${response.status}`);
            this.token = response.data.access_token;
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            Logger.error(`API Backend Error for login`, { status, data, message: error.message });
            throw new Error(`Login failed: ${typeof data === 'object' ? JSON.stringify(data) : data || error.message}`);
        }
    }

    private async request<T>(
        endpoint: string,
        options: AxiosRequestConfig = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            Logger.info(`API Backend Request: ${url}`);
            const response = await axios({
                url,
                ...options,
                headers
            });

            Logger.info(`API Backend Response: ${endpoint} -> Status ${response.status}`);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            Logger.error(`API Backend Error for ${endpoint}`, { status, data, message: error.message });
            throw new Error(`API Error: ${status || 'Unknown'} - ${typeof data === 'object' ? JSON.stringify(data) : data || error.message}`);
        }
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
            data
        });
    }

    async updateGoal(goalId: string, data: GoalUpdate): Promise<Goal> {
        return this.request<Goal>(`/goals/${goalId}`, {
            method: 'PUT',
            data
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
            data
        });
    }

    async updateTask(taskId: string, data: TaskUpdate): Promise<Task> {
        return this.request<Task>(`/tasks/${taskId}`, {
            method: 'PUT',
            data
        });
    }

    async deleteTask(taskId: string): Promise<void> {
        await this.request<void>(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }
}
