"""
Pydantic schemas for Task entities.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.models import TaskStatus, TaskType


class TaskCreate(BaseModel):
    """Schema for creating a task."""

    goal_id: str
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    task_type: Optional[TaskType] = TaskType.code
    priority: Optional[int] = 100
    estimated_hours: Optional[float] = Field(None, ge=0.0)
    dependencies: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[TaskStatus] = None
    task_type: Optional[TaskType] = None
    priority: Optional[int] = None
    estimated_hours: Optional[float] = Field(None, ge=0.0)
    actual_hours: Optional[float] = Field(None, ge=0.0)
    dependencies: Optional[List[str]] = None
    validation_result: Optional[Dict[str, Any]] = None
    ai_feedback: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskResponse(BaseModel):
    """Schema for task responses."""

    id: str
    goal_id: str
    user_id: str
    title: str
    description: str
    task_type: TaskType
    status: TaskStatus
    priority: int
    estimated_hours: Optional[float]
    actual_hours: Optional[float]
    dependencies: List[str] = []
    validation_result: Optional[Dict[str, Any]]
    ai_feedback: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="task_metadata")
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def extract_dependencies(cls, data):
        if hasattr(data, "__dict__"):
            task_meta = getattr(data, "task_metadata", None) or {}
            deps = task_meta.get("dependencies", []) if isinstance(task_meta, dict) else []
            return {
                **{k: getattr(data, k) for k in data.__class__.__table__.columns.keys()},
                "dependencies": deps,
            }
        return data
