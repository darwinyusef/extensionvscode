export interface Goal {
    id: string;
    user_id: string;
    course_id?: string;
    title: string;
    description: string;

    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress_percentage: number;
    ai_generated: boolean;
    validation_criteria?: any;
    metadata: any;
    due_date?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    tasks?: Task[];
}

export interface Task {
    id: string;
    goal_id: string;
    user_id: string;
    title: string;
    description: string;
    task_type: 'code' | 'documentation' | 'testing' | 'research' | 'review' | 'deployment' | 'other';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'failed' | 'skipped';
    priority: number;
    estimated_hours?: number;
    actual_hours?: number;
    dependencies: string[];
    validation_result?: any;
    ai_feedback?: string;
    metadata: any;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface GoalCreate {
    course_id?: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    validation_criteria?: string[];
    ai_generated?: boolean;
    due_date?: string;
    metadata?: any;
}

export interface GoalUpdate {
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    progress_percentage?: number;
    validation_criteria?: string[];
    due_date?: string;
    metadata?: any;
}

export interface TaskCreate {
    goal_id: string;
    title: string;
    description: string;
    task_type?: 'code' | 'documentation' | 'testing' | 'research' | 'review' | 'deployment' | 'other';
    priority?: number;
    estimated_hours?: number;
    dependencies?: string[];
    metadata?: any;
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'failed' | 'skipped';
    task_type?: 'code' | 'documentation' | 'testing' | 'research' | 'review' | 'deployment' | 'other';
    priority?: number;
    estimated_hours?: number;
    actual_hours?: number;
    dependencies?: string[];
    validation_result?: any;
    ai_feedback?: string;
    metadata?: any;
}
