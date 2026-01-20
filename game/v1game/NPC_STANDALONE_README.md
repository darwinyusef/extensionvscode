# Sistema de NPCs - Versión Standalone

## ⚠️ IMPORTANTE

El sistema de NPCs es **completamente independiente** del roadmap. No necesita ni debe modificar el juego original.

## 📁 Estructura

```
game/
├── npc-demo.html                  # ← DEMO STANDALONE (SIN ROADMAP)
├── index.html                     # ← Roadmap original (intacto)
├── game.js                        # ← Roadmap original (intacto)
├── npc-system/                    # ← Sistema de NPCs (independiente)
│   ├── npc.js
│   ├── mouth-animator.js
│   ├── dialogue-engine.js
│   ├── dialogue-ui.js
│   ├── relationship-manager.js
│   └── npc-manager.js
└── data/
    ├── npcs/
    │   └── npcs.json
    └── dialogues/
        ├── mentor_html.json
        ├── friend_css_1.json
        └── friend_js_1.json
```

## 🚀 Cómo Usar

### Versión Standalone (Recomendada)

```bash
# Abre el demo sin roadmap
http://localhost:8000/npc-demo.html
```

**Características:**
- ✅ Sistema de NPCs completo
- ✅ Jugador controlable (WASD)
- ✅ 3 NPCs con diálogos
- ✅ Sistema de amistad
- ✅ Animación de boca
- ❌ NO incluye roadmap
- ❌ NO modifica archivos originales

### Controles

- **WASD** o **Flechas** - Mover jugador
- **E** - Hablar con NPC cercano
- **Click** - Interactuar directamente con NPC
- **ESC** - Cerrar diálogo
- **SPACE** - Avanzar texto
- **1-4** - Elegir respuesta

## 🎯 NPCs Disponibles

1. **Elder Tim** (250, 150)
   - Mentor HTML
   - Personalidad: Sabio
   - Sprite: Azul

2. **Flexbox Fred** (800, 250)
   - Guru CSS
   - Personalidad: Relajado
   - Sprite: Verde

3. **Async Andy** (1100, 350)
   - Expert JavaScript
   - Personalidad: Impaciente
   - Sprite: Amarillo

## 🔧 Integrar con Otro Proyecto

Si quieres usar el sistema de NPCs en tu propio proyecto:

### 1. Copia los archivos necesarios:
```
npc-system/          → Tu proyecto
data/npcs/          → Tu proyecto
data/dialogues/     → Tu proyecto
assets/characters/  → Tu proyecto
```

### 2. Incluye los scripts en tu HTML:
```html
<script src="npc-system/npc.js"></script>
<script src="npc-system/mouth-animator.js"></script>
<script src="npc-system/dialogue-engine.js"></script>
<script src="npc-system/dialogue-ui.js"></script>
<script src="npc-system/relationship-manager.js"></script>
<script src="npc-system/npc-manager.js"></script>
```

### 3. Inicializa en tu juego:
```javascript
// En tu función create()
npcManager = new NPCManager(this);
dialogueUI = new DialogueUI(this);
npcManager.setDialogueUI(dialogueUI);
await npcManager.loadNPCs('data/npcs/npcs.json');

// En tu función update()
npcManager.update();
npcManager.checkProximity(player.x, player.y, 120);
```

## ❌ NO Incluido

Este sistema **NO incluye**:
- Roadmap
- Nodos de aprendizaje
- Sistema de progreso
- Integración con tecnologías

Es **SOLO** el sistema de NPCs con diálogos.

## 📊 Características del Sistema

- ✅ NPCs con personalidades únicas
- ✅ Diálogos ramificados con elecciones
- ✅ Sistema de amistad (0-100)
- ✅ Animación de boca sincronizada
- ✅ UI estilo RPG con typewriter
- ✅ Persistencia en LocalStorage
- ✅ Sistema de quests
- ✅ Indicadores de proximidad
- ✅ Hover effects

## 🐛 Debug

En la consola del navegador:
```javascript
// Ver NPCs cargados
npcManager.getAllNPCs()

// Ver relaciones
npcManager.relationshipManager.getAll()

// Interactuar manualmente
npcManager.interact('mentor_html')

// Ver mejor amigo
npcManager.getBestFriends(1)
```

## 🎨 Personalizar

### Cambiar posiciones de NPCs
Edita `data/npcs/npcs.json`:
```json
{
  "x": 400,
  "y": 300
}
```

### Agregar nuevo NPC
Ver `assets/characters/README.md`

### Modificar diálogos
Ver archivos en `data/dialogues/`

---

**Este sistema es 100% independiente y no interfiere con ningún otro código.**
