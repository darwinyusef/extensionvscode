# 🔐 Guía de Autenticación JWT con Swagger

## 📋 Resumen

Ahora **todas las rutas están protegidas con JWT**. Para usar Swagger, primero debes obtener un token de autenticación.

---

## 🚀 Cómo usar JWT en Swagger

### Paso 1: Iniciar el servidor

```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```

### Paso 2: Abrir Swagger UI

Abre tu navegador en:
```
http://localhost:8000/docs
```

### Paso 3: Obtener un Token JWT

1. **Expandir** el endpoint **POST /api/v1/auth/login**
2. Click en **"Try it out"**
3. Editar el JSON con cualquier usuario (por ahora acepta cualquier credencial):

```json
{
  "username": "alice",
  "password": "cualquier_cosa"
}
```

4. Click en **"Execute"**
5. **Copiar** el `access_token` de la respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FsaWNlIiwiZXhwIjoxNzM1NDk4ODAwLCJ0eXBlIjoiYWNjZXNzIn0.abc123...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer",
  "user_id": "user_alice"
}
```

### Paso 4: Autorizar en Swagger

1. **Buscar el botón "Authorize" 🔒** en la parte superior derecha de Swagger UI
2. **Click en "Authorize"**
3. **Pegar el token** en el campo "Value" (sin el prefijo "Bearer")
4. Click en **"Authorize"**
5. Click en **"Close"**

¡Listo! Ahora **todos los endpoints protegidos** usarán automáticamente este token.

---

## ✅ Probar que funciona

### Crear un Goal (Requiere autenticación)

1. Expandir **POST /api/v1/goals**
2. Click en **"Try it out"**
3. Usa este JSON de ejemplo:

```json
{
  "course_id": "course-123",
  "title": "Mi primer goal con JWT",
  "description": "Probando autenticación JWT en Swagger",
  "priority": "high",
  "validation_criteria": ["Criterio 1", "Criterio 2"],
  "due_date": "2025-02-01T00:00:00Z",
  "metadata": {
    "estimated_hours": 10
  }
}
```

4. Click **"Execute"**
5. **Verificar respuesta 201 Created**

Si ves un error **401 Unauthorized**, significa que:
- No has autorizado en Swagger (paso 4)
- El token expiró (dura 60 minutos por defecto)
- El token es inválido

---

## 🔍 Ver el Token en las Peticiones

En Swagger, después de autorizar, verás un **candado cerrado 🔒** junto a cada endpoint protegido.

Cuando ejecutas un endpoint, Swagger automáticamente agrega el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Ejemplo con cURL

Si prefieres usar cURL en lugar de Swagger:

```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"test"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Usar token en peticiones
curl -X GET "http://localhost:8000/api/v1/goals" \
  -H "Authorization: Bearer $TOKEN"

# 3. Crear un goal con autenticación
curl -X POST "http://localhost:8000/api/v1/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "course-123",
    "title": "Test Goal",
    "description": "Testing JWT auth",
    "priority": "high"
  }'
```

---

## ⚙️ Configuración del Token

En `backend/app/core/config.py`:

```python
# JWT Settings
SECRET_KEY: str = "your-secret-key-here"  # Cambiar en producción
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Token expira en 60 minutos
REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Refresh token expira en 7 días
```

Para generar un nuevo `SECRET_KEY`:
```bash
openssl rand -hex 32
```

---

## 🔒 Endpoints Protegidos

### 🔑 Autenticación Regular (JWT)

Todos estos endpoints **requieren JWT token**:

### Goals
- `POST /api/v1/goals` - Crear goal
- `GET /api/v1/goals` - Listar goals
- `GET /api/v1/goals/{goal_id}` - Obtener goal
- `PUT /api/v1/goals/{goal_id}` - Actualizar goal
- `PATCH /api/v1/goals/{goal_id}/progress` - Actualizar progreso
- `DELETE /api/v1/goals/{goal_id}` - Eliminar goal

### Tasks
- `POST /api/v1/tasks` - Crear task
- `GET /api/v1/tasks` - Listar tasks
- `GET /api/v1/tasks/{task_id}` - Obtener task
- `PUT /api/v1/tasks/{task_id}` - Actualizar task
- `DELETE /api/v1/tasks/{task_id}` - Eliminar task

### Courses
- `POST /api/v1/courses` - Crear curso
- `GET /api/v1/courses` - Listar cursos
- `PUT /api/v1/courses/{course_id}` - Actualizar curso
- Y más...

### Code Snapshots
- `POST /api/v1/code-snapshots` - Crear snapshot
- `GET /api/v1/code-snapshots` - Listar snapshots
- Y más...

### Events
- `POST /api/v1/events` - Crear evento
- `GET /api/v1/events` - Listar eventos
- Y más...

### 👑 Autenticación Admin (JWT + Rol Admin)

Los endpoints de administración **requieren JWT token Y rol de admin**:

#### Admin - Rate Limits
- `GET /api/v1/admin/rate-limits/users/{user_id}/status` - Estado de rate limits de usuario
- `GET /api/v1/admin/rate-limits/audits` - Logs de auditoría
- `GET /api/v1/admin/rate-limits/statistics` - Estadísticas de uso
- `POST /api/v1/admin/rate-limits/users/{user_id}/reset` - Resetear límites
- `GET /api/v1/admin/rate-limits/top-consumers` - Top consumidores
- `GET /api/v1/admin/rate-limits/suspicious` - Actividades sospechosas
- `GET /api/v1/admin/rate-limits/config` - Configuración actual

**Cómo acceder a rutas de admin:**

1. **Hacer login con usuario admin:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "cualquier_cosa"
  }'
```

2. **El username DEBE contener "admin"** para tener permisos de administrador.
   - ✅ `admin`, `superadmin`, `admin_user` → **Funcionan**
   - ❌ `alice`, `bob`, `user123` → **Error 403 Forbidden**

3. **Copiar el token y autorizar en Swagger** (igual que antes)

4. **Probar endpoint de admin:**
```bash
# Con el token de admin
curl -X GET "http://localhost:8000/api/v1/admin/rate-limits/config" \
  -H "Authorization: Bearer <token-de-admin>"
```

**Errores comunes:**

- **401 Unauthorized**: Token inválido o no proporcionado
- **403 Forbidden**: Token válido pero el usuario no es admin

**Ejemplo en Swagger:**

1. Login con username `admin`
2. Copiar el `access_token`
3. Click "Authorize" 🔒 y pegar el token
4. Ir a la sección "admin" en Swagger
5. Verás candados cerrados 🔒 en todos los endpoints
6. Puedes ejecutarlos sin error 403

---

## 🚨 Errores Comunes

### Error 401: Unauthorized

**Causa**: No has autorizado en Swagger o el token es inválido.

**Solución**:
1. Hacer login en `/api/v1/auth/login`
2. Copiar el `access_token`
3. Click en "Authorize" 🔒 en Swagger
4. Pegar el token
5. Intentar de nuevo

### Error 422: Validation Error

**Causa**: El JSON que enviaste no cumple con el esquema esperado.

**Solución**: Revisar el schema en Swagger (abajo del botón "Try it out").

### Token expirado

**Causa**: El token tiene una duración de 60 minutos por defecto.

**Solución**: Hacer login nuevamente para obtener un token nuevo.

---

## 🛡️ Seguridad en Producción

⚠️ **IMPORTANTE**: Esta implementación actual es para desarrollo/testing.

Para producción, debes:

1. **Implementar validación real de credenciales** en `/auth/login`
2. **Usar HTTPS** (no HTTP)
3. **Cambiar `SECRET_KEY`** por una generada aleatoriamente
4. **Agregar rate limiting** en el endpoint de login
5. **Implementar refresh token** en `/auth/refresh`
6. **Blacklist de tokens** revocados (usar Redis)
7. **Validar usuarios contra la base de datos**

---

## 📚 Recursos Adicionales

- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **JWT.io**: https://jwt.io/ (para decodificar tokens y ver su contenido)
- **Swagger Authorization**: https://swagger.io/docs/specification/authentication/

---

## 🎯 Checklist Rápido

- [ ] Servidor corriendo en `http://localhost:8000`
- [ ] Swagger abierto en `http://localhost:8000/docs`
- [ ] Hice login en `/api/v1/auth/login`
- [ ] Copié el `access_token`
- [ ] Click en "Authorize" 🔒
- [ ] Pegué el token
- [ ] Click en "Authorize" y "Close"
- [ ] Veo candados cerrados 🔒 junto a los endpoints
- [ ] Puedo ejecutar endpoints protegidos sin error 401

---

**Última actualización**: 2026-01-03
**Versión**: 1.0.0
**Estado**: ✅ Funcional
