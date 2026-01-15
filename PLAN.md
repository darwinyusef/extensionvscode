# Plan de Desarrollo - AI Goals Tracker

**Fecha**: 2026-01-13
**Última actualización**: Configuración BD + Alembic + Checkpointer

## Progreso Reciente (2026-01-13)

**Infraestructura BD**:
- ✅ PostgreSQL con pgvector en Docker (imagen: pgvector/pgvector:pg16)
- ✅ Servidor remoto configurado (credenciales en .env)
- ✅ Extensión vector activa en contenedor postgres_vector
- ✅ Scripts de validación: create_db.py, install_pgvector.py, verify_db.py
- ✅ Actualización Alembic: env.py, alembic.ini
- ✅ Migración embeddings: 007_create_embeddings_table.py

**Agents**:
- ✅ Checkpointer implementado (checkpointer.py)
- ✅ Nodos actualizados (nodes.py)
- ✅ Message router actualizado

**Configuración**:
- ✅ .env.example actualizado
- ✅ requirements.txt actualizado

## Estado Actual

### Backend (v2extension/backend)

**Servicios Implementados**:
- ✅ GoalService (CRUD + RAG embeddings)
- ✅ TaskService (CRUD + RAG embeddings)
- ✅ RAGTools para generación de embeddings

**Schemas Activos**:
- ✅ TaskCreate, TaskUpdate, TaskResponse
- ✅ GoalCreate, GoalUpdate, GoalResponse

**Características**:
- Sistema de dependencies en tasks (almacenado en metadata)
- Generación automática de embeddings para RAG
- Actualización de embeddings al cambiar descripciones
- Transiciones de estado con timestamps
- Validación de campos con Pydantic

### Frontend (v2extension/frontend)

**Tipos TypeScript**:
- ✅ Goal, Task interfaces
- ✅ GoalCreate, GoalUpdate
- ✅ TaskCreate, TaskUpdate
- ✅ Sincronizado con backend schemas

**Estados**:
- Goals: pending | in_progress | completed | blocked | cancelled
- Tasks: todo | in_progress | in_review | completed | failed | skipped

### Archivos Modificados (sin commit)

**Modificados**:
```
M backend/.env.example
M backend/alembic.ini
M backend/alembic/env.py
M backend/alembic/versions/007_create_embeddings_table.py
M backend/app/agents/nodes.py
M backend/app/main.py
M backend/app/schemas/task_schemas.py
M backend/app/services/goal_service.py
M backend/app/services/message_router.py
M backend/app/services/task_service.py
M backend/scripts/test_redis.py
M frontend/src/types/api.ts
```

**Nuevos archivos**:
```
?? backend/app/agents/checkpointer.py
?? backend/create_db.py
?? backend/install_pgvector.py
?? backend/requirements.txt
?? backend/verify_db.py
```

## Arquitectura Técnica

### Modelo de Datos

```
User
  └── Goal
       ├── tasks: Task[]
       ├── course_id (opcional)
       ├── priority: low | medium | high | urgent
       └── progress_percentage

Task
  ├── goal_id (FK)
  ├── task_type: code | documentation | testing | research | review | deployment | other
  ├── priority (número)
  ├── dependencies (lista de task IDs en metadata)
  ├── estimated_hours / actual_hours
  └── validation_result / ai_feedback
```

### Sistema RAG

**Embeddings generados para**:
- Goals (título + descripción)
- Tasks (título + descripción + tipo)

**Modelo**: text-embedding-3-small (OpenAI)

**Metadata incluida**:
- Goal: status, priority
- Task: task_type, status

**Actualización automática**:
- Se regenera embedding al cambiar description
- Se elimina embedding viejo antes de crear nuevo

### Agents & Checkpointer

**Checkpointer** (nuevo):
- Persistencia de estado para LangGraph agents
- Almacenamiento de conversaciones
- Recuperación de contexto entre sesiones

**Integración**:
- nodes.py actualizado con nuevo sistema
- message_router.py conectado al checkpointer

### Transiciones de Estado

**Goals**:
- pending → in_progress: set started_at
- * → completed: set completed_at, progress_percentage = 100

**Tasks**:
- todo → in_progress: set started_at
- * → completed: set completed_at

## Próximos Pasos

### Inmediato (Prioridad Alta)

1. **Base de Datos**
   - ✅ Docker pgvector configurado (postgres_vector container)
   - ✅ Extensión vector activa
   - ⏳ Validar conexión: python verify_db.py
   - ⏳ Aplicar migración 007: alembic upgrade head

2. **Git**
   - Commit de archivos modificados (12) y nuevos (5)
   - Validar que todo funcione antes de commit
   - ⚠️ .env debe estar en .gitignore (credenciales sensibles)

### Backend

1. **Endpoints API**
   - GET /goals/{goal_id}/tasks
   - POST /tasks/{task_id}/validate
   - GET /tasks/dependencies/{task_id}

2. **Validación de Dependencies**
   - Verificar que task IDs en dependencies existen
   - Detectar dependencias circulares
   - Ordenamiento topológico para ejecución

3. **Progreso Automático de Goals**
   - Calcular progress_percentage basado en tasks completadas
   - Actualizar goal.status según tareas

### Frontend

1. **Componentes UI**
   - GoalList component
   - TaskList component
   - TaskDependencyGraph
   - ProgressBar para goals

2. **Estado Global**
   - Store para goals/tasks (Redux/Zustand)
   - Sincronización con WebSocket
   - Optimistic updates

3. **Features**
   - Drag & drop para prioridades
   - Filtros por status/type
   - Vista Kanban
   - Gantt chart para dependencies

### Integración

1. **WebSocket Events**
   - goal.updated
   - task.created
   - task.status_changed
   - progress.updated

2. **Caché**
   - Redis para goals/tasks recientes
   - Invalidación al actualizar

3. **Tests**
   - Unit tests para services
   - Integration tests para endpoints
   - E2E tests para flujo completo

## Comandos Útiles

### Backend
```bash
cd v2extension/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend
```bash
cd v2extension/frontend
npm run dev
```

### Database (Docker Server)

**Docker Compose Setup**:
```yaml
version: '3.8'
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: postgres_vector
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: [DB_NAME]
      POSTGRES_USER: [DB_USER]
      POSTGRES_PASSWORD: "[DB_PASSWORD]"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

**Setup pgvector**:
```bash
# Conectar al contenedor
docker exec -it postgres_vector psql -U [DB_USER] -d [DB_NAME]

# Activar extensión
CREATE EXTENSION IF NOT EXISTS vector;

# Verificar instalación
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Conexión desde app**:
```bash
# Formato: postgresql://[USER]:[PASSWORD]@[SERVER_IP]:5432/[DB_NAME]
# Configurar en .env (credenciales no incluidas en repo)

# Validación local
cd backend
python verify_db.py

# Migraciones
alembic upgrade head
alembic revision --autogenerate -m "mensaje"
```

### Tests
```bash
cd v2extension/backend
pytest

# Test Redis
python scripts/test_redis.py
```

## Notas de Implementación

### Seguridad y Credenciales
- ⚠️ **NUNCA** subir .env al repositorio
- Todas las credenciales de BD están en .env local
- Docker compose usa variables de entorno
- Connection string: postgresql://[USER]:[PASS]@[SERVER_IP]:5432/[DB_NAME]

### Dependencies en Tasks
- Almacenadas en `task_metadata["dependencies"]`
- Lista de task IDs (strings)
- Se preservan en create/update

### RAG Embeddings
- Se generan async en background
- No bloquean la respuesta del API
- Se pueden desactivar con `generate_embedding=False`

### Metadata Handling
- Goals: `goal_metadata` (JSONB)
- Tasks: `task_metadata` (JSONB)
- Frontend: campo `metadata` en ambos tipos

## Problemas Conocidos

1. ~~**Embeddings table**~~: ✅ Resuelto - pgvector en Docker
2. ~~**Alembic**~~: ✅ Configuración actualizada
3. **Commits pendientes**: 12 archivos modificados + 5 nuevos sin commit
4. **Migración 007**: Pendiente aplicar (alembic upgrade head)

## Stack Tecnológico

**Backend**:
- FastAPI + SQLAlchemy (async)
- PostgreSQL 17 + pgvector (Docker server)
- Alembic (migrations)
- LangGraph (agents + checkpointer)
- OpenAI (embeddings)

**Frontend**:
- React + TypeScript
- Vite
- Axios (HTTP)
- ws (WebSocket)

**Infraestructura**:
- Docker Compose (pgvector/pgvector:pg16)
- PostgreSQL 16 + pgvector (servidor remoto)
  - Container: postgres_vector
  - Puerto: 5432
  - Conexión: postgresql://[USER]:[PASS]@[SERVER_IP]:5432/[DB_NAME]
- Redis (cache)
- RabbitMQ (tasks)
- MinIO (storage)
