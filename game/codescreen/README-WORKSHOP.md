# Sistema de Talleres - Guía Completa

## ✅ Sistema Implementado

Ya puedes enviar talleres completos con:
1. ✅ Tema del taller
2. ✅ Ejercicios del 1 al N
3. ✅ Documentación por ejercicio
4. ✅ Goals por ejercicio
5. ✅ Meta principal

## 📝 Estructura del JSON

Crea un archivo `.json` con esta estructura:

```json
{
  "workshop": {
    "id": "python-poo-basico",
    "title": "Python POO Básico",
    "description": "Descripción del taller",
    "language": "python",
    "npc": {
      "name": "Flexbox Fred",
      "avatar": "../assets/characters/flexbox_fred.svg",
      "role": "Maestro de POO"
    },
    "mainGoal": {
      "title": "Dominar POO en Python",
      "description": "Completar los 10 ejercicios",
      "totalPoints": 500
    },
    "exercises": [
      {
        "id": 1,
        "title": "Crear tu primera clase",
        "difficulty": "easy",
        "points": 30,
        "instructions": {
          "title": "Ejercicio 1: ...",
          "description": "...",
          "requirements": ["req1", "req2"],
          "example": "codigo ejemplo"
        },
        "documentation": {
          "title": "¿Qué es una Clase?",
          "sections": [
            {
              "heading": "Conceptos Básicos",
              "content": "Explicación..."
            }
          ],
          "references": [
            {
              "title": "Python Docs",
              "url": "https://..."
            }
          ]
        },
        "goals": [
          {
            "id": "goal1_1",
            "title": "Definir la clase",
            "points": 10,
            "bonus": false
          }
        ],
        "starterCode": "# Código inicial\n"
      }
    ]
  }
}
```

## 🚀 Cómo Usar

### 1. Crear el archivo JSON

Guarda tu taller como `workshop-structure.json` (o cualquier nombre) en la carpeta `codescreen/`

### 2. Cargar el taller

Abre la URL con el parámetro `workshop`:

```
code-exercise.html?workshop=workshop-structure
```

### 3. Navegación

- ✅ **Tabs:** Instrucciones / Documentación / Metas
- ✅ **Botones:** ← Anterior / Siguiente →
- ✅ **Contador:** "Ejercicio 1/10"
- ✅ **Progreso:** Barra de progreso por ejercicio
- ✅ **Meta Principal:** Progreso total del taller

## 📋 Ejemplo Real

Ver `workshop-structure.json` para un ejemplo completo de taller de Python POO.

## 🎯 Características

### Por Ejercicio:
- ✅ Instrucciones personalizadas
- ✅ Requisitos listados
- ✅ Ejemplo de código
- ✅ Documentación técnica con secciones
- ✅ Referencias externas
- ✅ Goals con puntos
- ✅ Goals bonus
- ✅ Código inicial (starterCode)
- ✅ Barra de progreso individual

### Global:
- ✅ Meta principal del taller
- ✅ NPC instructor personalizado
- ✅ Progreso total (X/N ejercicios)
- ✅ Validación de sintaxis en tiempo real
- ✅ Navegación entre ejercicios

## 🔄 Flujo de Uso

1. Usuario abre: `code-exercise.html?workshop=python-poo-basico`
2. Sistema carga `python-poo-basico.json`
3. Muestra ejercicio 1
4. Usuario lee instrucciones/documentación
5. Escribe código
6. Valida sintaxis en tiempo real
7. Marca goals completados
8. Click "Siguiente →"
9. Carga ejercicio 2 automáticamente
10. Repite hasta completar todos

## 📊 Progreso

### Por Ejercicio:
```
Progreso del Ejercicio
[████████░░] 25/30 pts
```

### Global:
```
🎯 Meta Principal del Taller
Completar los 10 ejercicios
[████░░░░░░] Ejercicio 4/10
```

## 🎨 Personalización

### Cambiar NPC:
```json
"npc": {
  "name": "Tu NPC",
  "avatar": "../assets/characters/tu-npc.svg",
  "role": "Rol del NPC"
}
```

### Agregar más ejercicios:
Solo añade más objetos al array `exercises`

### Cambiar lenguaje:
```json
"language": "javascript" | "python" | "java" | "go" | "kotlin" | ...
```

## 🛠️ Agregar Tests (Futuro)

```json
"tests": [
  {
    "input": "codigo_test",
    "expected": "resultado_esperado"
  }
]
```

## 📁 Estructura de Archivos

```
codescreen/
├── code-exercise.html          # Página principal
├── editor.js                   # Lógica del editor
├── styles.css                  # Estilos
├── workshop-structure.json     # Tu taller
└── README-WORKSHOP.md          # Esta guía
```

## 🎓 Ejemplos de Talleres

### JavaScript ES6:
```
code-exercise.html?workshop=javascript-es6
```

### Python POO:
```
code-exercise.html?workshop=python-poo-basico
```

### Go Concurrency:
```
code-exercise.html?workshop=go-concurrency
```

## ✨ Próximas Mejoras

- [ ] Guardar progreso en localStorage
- [ ] Sistema de tests automáticos
- [ ] Exportar progreso a JSON
- [ ] Modo oscuro/claro
- [ ] Compartir talleres vía URL
