"""
Pydantic schemas for Course entities.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.models import CourseStatus


class CourseCreate(BaseModel):
    """Schema for creating a course."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None


class CourseUpdate(BaseModel):
    """Schema for updating a course."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[CourseStatus] = None
    progress_percentage: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class CourseResponse(BaseModel):
    """Schema for course responses."""

    id: str
    user_id: str
    title: str
    description: str
    status: CourseStatus
    progress_percentage: float
    metadata: Dict[str, Any] = Field(..., validation_alias="course_metadata")
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
