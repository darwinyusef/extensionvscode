# Guía de Setup - Sistema de NPCs

## 📁 Estructura de Archivos

```
game/
├── index.html                          # Juego ORIGINAL (sin NPCs)
├── index-with-npcs.html               # Juego CON NPCs ✨
├── game.js                            # Código original (NO MODIFICADO)
├── npc-system/
│   ├── npc.js                         # Clase NPC
│   ├── mouth-animator.js              # Animación de boca
│   ├── dialogue-engine.js             # Motor de diálogos
│   ├── dialogue-ui.js                 # UI de diálogos
│   ├── relationship-manager.js        # Sistema de amistad
│   ├── npc-manager.js                 # Gestor de NPCs
│   └── npc-game-integration.js        # Integración no invasiva
└── data/
    ├── npcs/
    │   ├── npcs.json                  # Definición de NPCs
    │   └── personalities.json         # Personalidades
    └── dialogues/
        ├── mentor_html.json           # Diálogos HTML
        ├── friend_css_1.json          # Diálogos CSS
        └── friend_js_1.json           # Diálogos JS
```

## 🚀 Cómo Usar

### Opción 1: Juego Original (Sin NPCs)
```bash
# Abre en el navegador
http://localhost:8000/index.html
```

### Opción 2: Juego con NPCs
```bash
# Abre en el navegador
http://localhost:8000/index-with-npcs.html
```

## ✅ Ventajas de esta Implementación

1. **No Invasivo**
   - `game.js` e `index.html` NO fueron modificados
   - El juego original funciona exactamente igual
   - Integración mediante hooks en eventos de Phaser

2. **Modular**
   - Todos los archivos del sistema de NPCs están en `npc-system/`
   - Fácil de eliminar o actualizar
   - No afecta el roadmap existente

3. **Opcional**
   - Puedes usar el juego con o sin NPCs
   - Solo carga los archivos necesarios según la versión

## 🎮 Controles

### Interacción con NPCs
- **Click en NPC**: Interactuar directamente
- **Tecla E**: Hablar con NPC cercano (radio 120px)
- **Hover**: Muestra indicador [E]

### Durante Diálogo
- **SPACE**: Avanzar texto / Completar typewriter
- **ESC**: Cerrar diálogo
- **1-4**: Seleccionar opción
- **Click**: Seleccionar opción

## 📍 Ubicación de NPCs

Los NPCs aparecen en estas coordenadas:
- 🔵 **Elder Tim** (HTML Mentor): (300, 200)
- 🟢 **Flexbox Fred** (CSS Guru): (600, 300)
- 🟡 **Async Andy** (JS Expert): (900, 400)

## 🔧 Cómo Funciona la Integración

### `npc-game-integration.js`

Este archivo hace la magia sin tocar el código original:

```javascript
// 1. Se carga DESPUÉS de game.js
// 2. Detecta cuando Phaser está listo (evento 'ready')
// 3. Inicializa el sistema de NPCs
// 4. Hace hook en los eventos de Phaser para update
// 5. NO modifica el código original
```

### Eventos Usados
- `game.events.once('ready')` - Cuando Phaser inicia
- `scene.events.once('create')` - Cuando la escena está lista
- Hook en `scene.scene.settings.update` - Para el loop de actualización

## 🐛 Debug

Abre la consola del navegador (`F12`) y prueba:

```javascript
// Ver integración
window.npcIntegration

// Ver NPCs cargados
window.npcIntegration.getManager().getAllNPCs()

// Ver relaciones
window.npcIntegration.getManager().relationshipManager.getAll()

// Interactuar manualmente
window.npcIntegration.getManager().interact('mentor_html')
```

## ⚠️ Notas Importantes

1. **game.js permanece intacto**
   - Todas las funciones originales funcionan igual
   - No hay conflictos con el roadmap
   - El vaquero se mueve normalmente

2. **Compatibilidad**
   - El sistema detecta automáticamente el jugador (`window.player`)
   - Funciona con el sistema de cámara existente
   - Respeta el drag y zoom del mapa

3. **Orden de Carga**
   - ✅ Correcto: `game.js` → `npc-game-integration.js`
   - ❌ Incorrecto: `npc-game-integration.js` → `game.js`

## 🔄 Si Necesitas Revertir

Para volver al juego sin NPCs:
1. Usa `index.html` en lugar de `index-with-npcs.html`
2. O simplemente borra la carpeta `npc-system/`

**No necesitas deshacer nada porque el juego original nunca fue modificado.**

## 📊 Comparación

| Característica | index.html | index-with-npcs.html |
|----------------|------------|----------------------|
| Roadmap        | ✅          | ✅                    |
| Vaquero        | ✅          | ✅                    |
| NPCs           | ❌          | ✅                    |
| Diálogos       | ❌          | ✅                    |
| Sistema Amistad| ❌          | ✅                    |
| Código Original| Intacto    | Intacto              |

---

**✨ Ahora tienes 2 versiones funcionando:**
- `index.html` - Roadmap original
- `index-with-npcs.html` - Roadmap + NPCs

**Sin modificar el código base.**
