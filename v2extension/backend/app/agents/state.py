"""LangGraph state definition."""

from typing import TypedDict, Annotated, Sequence, Optional, List, Dict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """State shared across all agent nodes."""

    # User context
    user_id: str
    goal_id: Optional[str]
    task_id: Optional[str]

    # Messages
    messages: Annotated[Sequence[BaseMessage], "Chat messages"]

    # Execution context
    current_node: str
    next_node: Optional[str]

    # User data
    code_snapshot: Optional[str]
    validation_results: Optional[Dict]

    # Agent-specific data
    mood_score: float  # Nodo 8
    performance_metrics: Optional[Dict]  # Nodo 5
    contract_status: Optional[str]  # Nodo 9
    context_priority: Optional[List[str]]  # Nodo 7

    # Flags
    is_authenticated: bool
    needs_motivation: bool
    state_change_required: bool
