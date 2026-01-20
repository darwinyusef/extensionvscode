"""Memory checkpointer for LangGraph state persistence."""

import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)


class AgentCheckpointer:
    """Manages checkpoint persistence for LangGraph agents."""

    _checkpointer: Optional[Any] = None

    @classmethod
    async def get_checkpointer(cls) -> Any:
        """Get or create memory checkpointer for LangGraph."""
        if cls._checkpointer is None:
            try:
                from langgraph.checkpoint.memory import MemorySaver
                cls._checkpointer = MemorySaver()
                logger.info("LangGraph MemorySaver checkpointer initialized")
            except ImportError:
                logger.warning("MemorySaver not available, using None checkpointer")
                cls._checkpointer = None
        return cls._checkpointer

    @classmethod
    async def close(cls):
        """Close checkpointer (no-op for MemorySaver)."""
        cls._checkpointer = None
        logger.info("Checkpointer closed")
