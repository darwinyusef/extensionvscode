"""Individual agent node implementations."""

import logging
from typing import Any
from uuid import uuid4

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import AgentState
from app.agents.tools.rag_tools import get_similar_goals, get_similar_code, get_task_context, format_rag_context
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.services.goal_service import GoalService
from app.services.task_service import TaskService
from app.schemas.goal_schemas import GoalCreate
from app.schemas.task_schemas import TaskCreate

logger = logging.getLogger(__name__)
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ==================== Nodo 1: Authentication & Authorization ====================

async def auth_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 1: Validate user authentication and course enrollment.

    Tools:
    - validate_token
    - check_enrollment
    """
    logger.info(f"[Nodo 1] Authenticating user: {state['user_id']}")

    try:
        user_id = state.get("user_id")

        if not user_id:
            logger.warning("[Nodo 1] No user_id provided")
            return {
                "is_authenticated": False,
                "current_node": "nodo_1_auth",
                "error": "No user ID provided"
            }

        async with AsyncSessionLocal() as db:
            from app.models import User
            from sqlalchemy import select

            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if not user:
                logger.warning(f"[Nodo 1] User not found: {user_id}")
                return {
                    "is_authenticated": False,
                    "current_node": "nodo_1_auth",
                    "error": "User not found"
                }

            if not user.is_active:
                logger.warning(f"[Nodo 1] Inactive user: {user_id}")
                return {
                    "is_authenticated": False,
                    "current_node": "nodo_1_auth",
                    "error": "User is not active"
                }

        logger.info(f"[Nodo 1] User authenticated: {user_id}")
        return {
            "is_authenticated": True,
            "current_node": "nodo_1_auth",
        }

    except Exception as e:
        logger.error(f"[Nodo 1] Auth error: {e}")
        return {
            "is_authenticated": False,
            "current_node": "nodo_1_auth",
            "error": str(e)
        }


# ==================== Nodo 2: Goal Generator ====================

async def goal_generator_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 2: Create personalized coding challenges (goals).

    Tools:
    - create_goal
    - generate_tasks
    - ai_gen (OpenAI for content generation)
    """
    logger.info(f"[Nodo 2] Generating goal for user: {state['user_id']}")

    try:
        user_id = state.get("user_id")
        course_id = state.get("course_id")
        user_prompt = state.get("user_prompt", "")

        if not user_prompt:
            logger.warning("[Nodo 2] No user prompt provided")
            return {
                "current_node": "nodo_2_goal_generator",
                "error": "No user prompt for goal generation"
            }

        similar_goals = await get_similar_goals(
            query=user_prompt,
            user_id=user_id,
            limit=3,
            min_similarity=0.7,
            only_completed=True,
            scope="user"
        )

        rag_context = format_rag_context(similar_goals, max_results=3)

        prompt = f"""Generate a personalized coding goal based on the user's request.

User Request: {user_prompt}

Previous Similar Goals (for context):
{rag_context}

Generate a JSON response with:
- title: Clear, concise goal title
- description: Detailed description of what the user will learn/build
- validation_criteria: List of specific criteria to validate goal completion
- suggested_tasks: List of 3-5 sequential tasks to accomplish the goal

Format as valid JSON."""

        response = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert coding instructor creating personalized learning goals."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        import json
        goal_data = json.loads(response.choices[0].message.content)

        async with AsyncSessionLocal() as db:
            goal_service = GoalService(db)

            goal_create = GoalCreate(
                user_id=user_id,
                course_id=course_id,
                title=goal_data["title"],
                description=goal_data["description"],
                validation_criteria=goal_data["validation_criteria"],
                ai_generated=True,
                priority="medium"
            )

            new_goal = await goal_service.create_goal(goal_create)

            task_service = TaskService(db)
            created_tasks = []

            for idx, task_info in enumerate(goal_data.get("suggested_tasks", []), 1):
                task_create = TaskCreate(
                    goal_id=new_goal.id,
                    user_id=user_id,
                    title=task_info.get("title", f"Task {idx}"),
                    description=task_info.get("description", ""),
                    task_type="code",
                    priority=idx
                )
                task = await task_service.create_task(task_create)
                created_tasks.append(task.id)

            await db.commit()

        logger.info(f"[Nodo 2] Created goal: {new_goal.id} with {len(created_tasks)} tasks")
        return {
            "goal_id": new_goal.id,
            "task_ids": created_tasks,
            "current_node": "nodo_2_goal_generator",
        }

    except Exception as e:
        logger.error(f"[Nodo 2] Goal generation error: {e}")
        return {
            "current_node": "nodo_2_goal_generator",
            "error": str(e)
        }


# ==================== Nodo 3: Course Manager ====================

async def course_manager_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 3: Document goals in courses.

    Tools:
    - create_course
    - add_lesson
    - vector_db (for semantic search)
    """
    logger.info(f"[Nodo 3] Managing course for goal: {state.get('goal_id')}")

    try:
        goal_id = state.get("goal_id")
        user_id = state.get("user_id")
        course_id = state.get("course_id")

        if not goal_id:
            return {"current_node": "nodo_3_course_manager", "error": "No goal_id"}

        async with AsyncSessionLocal() as db:
            from app.models import Goal, Course
            from sqlalchemy import select

            goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
            goal = goal_result.scalar_one_or_none()

            if not goal:
                return {"current_node": "nodo_3_course_manager", "error": "Goal not found"}

            if course_id:
                course_result = await db.execute(select(Course).where(Course.id == course_id))
                course = course_result.scalar_one_or_none()
            else:
                course = None

            if not course:
                from app.services.course_service import CourseService
                from app.schemas.course_schemas import CourseCreate

                course_service = CourseService(db)
                course_create = CourseCreate(
                    user_id=user_id,
                    title=f"Learning Path: {goal.title}",
                    description=f"Auto-generated course for goal: {goal.description}",
                    status="active"
                )
                course = await course_service.create_course(course_create)

                goal.course_id = course.id
                await db.commit()

        logger.info(f"[Nodo 3] Course managed: {course.id}")
        return {
            "course_id": course.id,
            "current_node": "nodo_3_course_manager",
        }

    except Exception as e:
        logger.error(f"[Nodo 3] Course management error: {e}")
        return {"current_node": "nodo_3_course_manager", "error": str(e)}


# ==================== Nodo 4: Feedback Agent (Continuous) ====================

async def feedback_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 4: Provide real-time feedback during coding.

    Tools:
    - analyze_code
    - give_hint
    - validate
    """
    logger.info(f"[Nodo 4] Providing feedback for task: {state.get('task_id')}")

    try:
        task_id = state.get("task_id")
        user_id = state.get("user_id")
        code = state.get("code_snapshot", "")

        if not code or not task_id:
            return {
                "current_node": "nodo_4_feedback",
                "error": "No code or task_id provided"
            }

        task_context = await get_task_context(
            goal_id=state.get("goal_id"),
            user_id=user_id,
            include_completed=True
        )

        similar_code = await get_similar_code(
            code=code,
            user_id=user_id,
            language="python",
            limit=3,
            min_similarity=0.75,
            only_validated=True,
            scope="user"
        )

        code_context = format_rag_context(similar_code, max_results=2)

        task_info = next((t for t in task_context.get("tasks", []) if t["id"] == task_id), None)

        prompt = f"""Analyze this code submission and provide constructive feedback.

Task: {task_info.get('title') if task_info else 'Unknown'}
Description: {task_info.get('description') if task_info else ''}

User's Code:
```
{code}
```

Similar Validated Code (for reference):
{code_context}

Provide JSON response with:
- passed: boolean (true if code meets basic requirements)
- score: float 0-1 (quality score)
- feedback: string (constructive feedback)
- hints: list of strings (specific improvement suggestions)
- issues_found: list of strings (any bugs or problems)"""

        response = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert code reviewer providing constructive feedback."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )

        import json
        validation = json.loads(response.choices[0].message.content)

        async with AsyncSessionLocal() as db:
            from app.services.code_snapshot_service import CodeSnapshotService
            from app.schemas.code_snapshot_schemas import CodeSnapshotCreate

            snapshot_service = CodeSnapshotService(db)

            snapshot_create = CodeSnapshotCreate(
                task_id=task_id,
                user_id=user_id,
                code_content=code,
                language="python",
                validation_passed=validation["passed"],
                validation_score=validation["score"],
                validation_feedback=validation["feedback"],
                issues_found=validation.get("issues_found", [])
            )

            snapshot = await snapshot_service.create_snapshot(snapshot_create)
            await db.commit()

        logger.info(f"[Nodo 4] Code validated: {snapshot.id}, passed={validation['passed']}")
        return {
            "validation_results": validation,
            "snapshot_id": snapshot.id,
            "current_node": "nodo_4_feedback",
        }

    except Exception as e:
        logger.error(f"[Nodo 4] Feedback error: {e}")
        return {
            "current_node": "nodo_4_feedback",
            "error": str(e)
        }


# ==================== Nodo 5: Performance Evaluator ====================

async def performance_evaluator_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 5: Evaluate user performance and emit events to data lake.

    Tools:
    - evaluate_perf
    - emit_event
    - to_parquet (convert to Parquet format)
    """
    logger.info(f"[Nodo 5] Evaluating performance for user: {state['user_id']}")

    try:
        user_id = state.get("user_id")
        goal_id = state.get("goal_id")

        async with AsyncSessionLocal() as db:
            from app.models import Goal, Task, CodeSnapshot
            from sqlalchemy import select, func

            if goal_id:
                goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
                goal = goal_result.scalar_one_or_none()

                task_result = await db.execute(
                    select(Task).where(Task.goal_id == goal_id)
                )
                tasks = task_result.scalars().all()

                total_tasks = len(tasks)
                completed_tasks = len([t for t in tasks if t.status.value == "completed"])
                completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

                snapshot_result = await db.execute(
                    select(func.avg(CodeSnapshot.validation_score)).where(
                        CodeSnapshot.task_id.in_([t.id for t in tasks]),
                        CodeSnapshot.validation_passed == True
                    )
                )
                avg_score = snapshot_result.scalar() or 0

                metrics = {
                    "goal_id": goal_id,
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "completion_rate": completion_rate,
                    "avg_validation_score": float(avg_score),
                    "goal_progress": goal.progress_percentage if goal else 0
                }

                from app.services.event_service import EventService
                from app.schemas.event_schemas import EventCreate

                event_service = EventService(db)
                event_create = EventCreate(
                    user_id=user_id,
                    event_type="PERFORMANCE_EVALUATED",
                    entity_type="goal",
                    entity_id=goal_id,
                    event_data=metrics
                )
                await event_service.create_event(event_create)
                await db.commit()

                logger.info(f"[Nodo 5] Performance evaluated: completion={completion_rate:.2f}, score={avg_score:.2f}")
                return {
                    "performance_metrics": metrics,
                    "current_node": "nodo_5_performance",
                }
            else:
                return {
                    "performance_metrics": {},
                    "current_node": "nodo_5_performance",
                    "error": "No goal_id provided"
                }

    except Exception as e:
        logger.error(f"[Nodo 5] Performance evaluation error: {e}")
        return {
            "performance_metrics": {},
            "current_node": "nodo_5_performance",
            "error": str(e)
        }


# ==================== Nodo 6: State Monitor ====================

async def state_monitor_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 6: Monitor and adjust workflow states.

    Tools:
    - check_state
    - update_flow
    - redis_ops
    """
    logger.info(f"[Nodo 6] Monitoring state for goal: {state.get('goal_id')}")

    try:
        goal_id = state.get("goal_id")
        user_id = state.get("user_id")

        state_change_required = False

        if goal_id:
            async with AsyncSessionLocal() as db:
                from app.models import Goal
                from sqlalchemy import select

                goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
                goal = goal_result.scalar_one_or_none()

                if goal and goal.progress_percentage >= 100:
                    state_change_required = True
                    logger.info(f"[Nodo 6] Goal completed, state change required")

        logger.info(f"[Nodo 6] State change required: {state_change_required}")
        return {
            "state_change_required": state_change_required,
            "current_node": "nodo_6_state_monitor",
        }

    except Exception as e:
        logger.error(f"[Nodo 6] State monitor error: {e}")
        return {
            "state_change_required": False,
            "current_node": "nodo_6_state_monitor",
            "error": str(e)
        }


# ==================== Nodo 7: Context Organizer ====================

async def context_organizer_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 7: Understand user's global needs and prioritize tasks.

    Tools:
    - analyze_context
    - prioritize
    - search (semantic search)
    """
    logger.info(f"[Nodo 7] Organizing context for user: {state['user_id']}")

    try:
        user_id = state.get("user_id")

        async with AsyncSessionLocal() as db:
            from app.models import Goal, Task
            from sqlalchemy import select

            goal_result = await db.execute(
                select(Goal).where(
                    Goal.user_id == user_id,
                    Goal.status.in_(["pending", "in_progress"])
                ).order_by(Goal.priority.desc(), Goal.created_at)
            )
            active_goals = goal_result.scalars().all()

            task_result = await db.execute(
                select(Task).where(
                    Task.user_id == user_id,
                    Task.status.in_(["pending", "in_progress"])
                ).order_by(Task.priority)
            )
            active_tasks = task_result.scalars().all()

        priorities = []
        for goal in active_goals[:5]:
            priorities.append({
                "type": "goal",
                "id": goal.id,
                "title": goal.title,
                "priority": goal.priority.value,
                "progress": goal.progress_percentage
            })

        next_task = active_tasks[0] if active_tasks else None

        logger.info(f"[Nodo 7] Organized {len(priorities)} priorities")
        return {
            "context_priority": priorities,
            "next_task": next_task.id if next_task else None,
            "current_node": "nodo_7_context_organizer",
        }

    except Exception as e:
        logger.error(f"[Nodo 7] Context error: {e}")
        return {
            "context_priority": [],
            "current_node": "nodo_7_context_organizer",
            "error": str(e)
        }


# ==================== Nodo 8: Emotional Support ====================

async def emotional_support_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 8: Detect mood and provide motivation.

    Tools:
    - detect_mood
    - motivate
    - send_modal (trigger VS Code modal)
    """
    logger.info(f"[Nodo 8] Checking emotional state for user: {state['user_id']}")

    try:
        validation_results = state.get("validation_results", {})
        performance_metrics = state.get("performance_metrics", {})

        mood_score = 0.7

        if validation_results:
            if validation_results.get("passed"):
                mood_score = 0.9
            else:
                mood_score = 0.4

        if performance_metrics:
            completion_rate = performance_metrics.get("completion_rate", 0)
            if completion_rate > 0.8:
                mood_score = 0.95
            elif completion_rate < 0.3:
                mood_score = 0.5

        needs_motivation = mood_score < 0.6

        motivation_message = ""
        if needs_motivation:
            motivation_message = "Keep going! Every challenge makes you stronger."
        else:
            motivation_message = "Great work! You're making excellent progress."

        logger.info(f"[Nodo 8] Mood score: {mood_score}, needs motivation: {needs_motivation}")
        return {
            "mood_score": mood_score,
            "needs_motivation": needs_motivation,
            "motivation_message": motivation_message,
            "current_node": "nodo_8_emotional_support",
            "next_node": None,
        }

    except Exception as e:
        logger.error(f"[Nodo 8] Emotional support error: {e}")
        return {
            "mood_score": 0.7,
            "needs_motivation": False,
            "current_node": "nodo_8_emotional_support",
            "error": str(e)
        }


# ==================== Nodo 9: Contract Validator ====================

async def contract_validator_node(state: AgentState) -> dict[str, Any]:
    """
    Nodo 9: Validate contract terms and conditions.

    Tools:
    - check_contract
    - validate_terms
    """
    logger.info(f"[Nodo 9] Validating contract for user: {state['user_id']}")

    # TODO: Implement contract validation
    # - Check if user's contract/subscription is valid
    # - Verify access permissions
    # - Detect changes in terms

    return {
        "contract_status": "valid",
        "current_node": "nodo_9_contract_validator",
    }
