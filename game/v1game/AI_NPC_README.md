# 🤖 Sistema de NPCs con IA - Agentes Educativos

## 🎯 Concepto

Cada NPC es un **agente educativo** que:
- Tiene una personalidad única
- Enseña conceptos específicos
- Evalúa el conocimiento del jugador usando IA
- Otorga recompensas al completar tareas

## 📋 Componentes Creados

### 1. `ai-evaluator.js`
Motor de IA que:
- Se conecta con Claude API (Anthropic)
- Evalúa respuestas del jugador
- Genera feedback constructivo
- Emite comandos especiales (SHOW_GOAL, SHOW_HINT, etc.)

### 2. `evaluation-ui.js`
Interfaz de evaluación:
- Modal grande con textarea para respuestas
- Muestra pregunta del NPC
- Feedback en tiempo real
- Pantalla de "GOAL ALCANZADO" con animación

### 3. `task-manager.js`
Gestor de tareas:
- Carga tareas desde JSON
- Administra progreso del jugador
- Aplica recompensas (XP, amistad, unlocks)
- Guarda progreso en LocalStorage

### 4. `npc-tasks.json`
Configuración JSON para cada NPC con:
- Lista de tareas/conceptos
- Preguntas iniciales
- Contexto para la IA
- Criterios de evaluación
- Recompensas

## 🎮 Flujo de Interacción

```
1. Jugador se acerca al NPC → Presiona E
2. Se abre modal con pregunta del NPC
3. Jugador escribe su explicación (texto libre)
4. IA evalúa la respuesta
5a. Si APRUEBA → Pantalla "GOAL ALCANZADO" + Recompensas
5b. Si NO APRUEBA → Feedback + Permitir reintentar
```

## 📊 Formato de Evaluación de la IA

La IA responde en formato estructurado:

```
[EVALUATION: PASS/FAIL]
[SCORE: 0-100]
[FEEDBACK: Tu explicación está bien pero podrías mencionar...]
[COMMAND: SHOW_GOAL]
```

### Comandos Disponibles:
- `SHOW_GOAL` - Muestra pantalla de objetivo alcanzado
- `SHOW_HINT` - Muestra una pista
- `RETRY` - Permite otro intento
- `INCREASE_FRIENDSHIP` - Aumenta amistad +5
- `NEXT_TOPIC` - Avanza al siguiente tema

## 🔧 Configuración

### Paso 1: API Key de Claude

```javascript
// En tu juego, configura la API key
taskManager.setApiKey('tu-api-key-aquí');
```

**Obtener API Key:**
1. Regístrate en https://console.anthropic.com
2. Ve a API Keys
3. Crea una nueva key
4. Cópiala y guárdala de forma segura

### Paso 2: Agregar Nuevo NPC con Tareas

Edita `data/npcs/npc-tasks.json`:

```json
{
  "nuevo_npc_id": {
    "tasks": [
      {
        "id": "task_concepto_1",
        "title": "Título de la Tarea",
        "concept": "Concepto a Evaluar",
        "question": "¿Pregunta que hace el NPC?",
        "difficulty": "beginner|intermediate|advanced",
        "min_score": 70,
        "keywords": ["palabra1", "palabra2"],
        "evaluation_context": {
          "topic": "Tema",
          "key_points": [
            "Punto clave 1",
            "Punto clave 2"
          ],
          "common_mistakes": [
            "Error común 1"
          ]
        },
        "reward": {
          "xp": 50,
          "friendship": 15,
          "unlock_next": "task_siguiente"
        }
      }
    ]
  }
}
```

### Paso 3: Integrar en tu Juego

```javascript
// En tu función create()
taskManager = new TaskManager(this);
taskManager.setApiKey('sk-ant-...');

// Cuando el jugador interactúa con un NPC
const nextTask = taskManager.getNextTask(npcId);
if (nextTask) {
    taskManager.startTask(npcData, nextTask);
} else {
    // Todas las tareas completadas
    showCompletionMessage();
}
```

## 📝 Ejemplo de Tarea Completa

**Concepto:** Regresión Lineal

**NPC:** "Data Science Mentor"

**Pregunta:** "Explícame con tus palabras: ¿Qué es una regresión lineal y para qué sirve?"

**Respuesta del Jugador (ejemplo bueno):**
> "La regresión lineal es un método para predecir valores. Por ejemplo, si tengo datos de ventas de los últimos meses, puedo usarla para predecir ventas futuras. Básicamente encuentra una línea recta que mejor se ajusta a los puntos de datos."

**Evaluación de la IA:**
```
[EVALUATION: PASS]
[SCORE: 85]
[FEEDBACK: ¡Excelente! Capturaste la esencia: predicción y ajuste de línea. Para mejorar, podrías mencionar que busca minimizar el error entre la línea y los puntos reales.]
[COMMAND: SHOW_GOAL]
```

**Resultado:**
- ✅ Pantalla "GOAL ALCANZADO"
- +85 XP
- +20 Amistad con el NPC
- Desbloquea siguiente tarea: "Regresión Logística"

## 🎨 Personalidades de NPCs

Cada NPC tiene una forma única de hablar:

### Sabio (Elder Tim)
```
"Ah, joven aprendiz. Tu comprensión del concepto demuestra sabiduría.
Como el código bien estructurado, tu explicación tiene fundamentos sólidos."
```

### Relajado (Flexbox Fred)
```
"Ey, tranqui. Tu respuesta está bien, bro. Captas la onda de flexbox.
Chill y sigue así."
```

### Impaciente (Async Andy)
```
"¡Vamos, vamos! Tu respuesta es correcta pero demasiado lenta al explicar.
¡Al grano! Las promesas son para resolver operaciones asíncronas, punto."
```

## 💰 Costos de API (Claude)

**Modelo:** Claude 3.5 Sonnet

**Precios aproximados:**
- $3 por 1M tokens de entrada
- $15 por 1M tokens de salida

**Costo por evaluación:**
- ~500 tokens promedio
- ~$0.01 por evaluación
- 100 evaluaciones = ~$1

**Recomendaciones:**
- Usa el modelo Haiku para costos menores ($0.25/$1.25 por 1M tokens)
- Implementa caché de respuestas comunes
- Limita intentos por jugador (3-5 máximo)

## 🔒 Modo Sin IA (Fallback)

Si no configuras API key, el sistema usa evaluación básica:
- Keywords matching
- Longitud mínima de respuesta
- Feedback genérico
- Funciona offline

```javascript
// Sin API key, usa modo fallback
taskManager = new TaskManager(scene);
// No llamar setApiKey()
```

## 📊 Tracking de Progreso

Ver progreso del jugador:

```javascript
const progress = taskManager.getProgress();
console.log(`Completado: ${progress.completed}/${progress.total}`);
console.log(`Porcentaje: ${progress.percentage}%`);
```

Ver tareas completadas:

```javascript
const completed = taskManager.completedTasks;
completed.forEach(task => {
    console.log(`${task.taskId}: Score ${task.score}, Intentos: ${task.attempts}`);
});
```

## 🎯 Roadmap Futuro

- [ ] Modo conversación libre (chat abierto con NPC)
- [ ] Generar código en vivo y evaluarlo
- [ ] Proyectos prácticos (crear HTML/CSS real)
- [ ] Multiplayer (NPCs compartidos)
- [ ] Leaderboard global
- [ ] Certificados al completar todos los NPCs

---

**Sistema completo de agentes educativos con IA integrada y evaluación automática.**
