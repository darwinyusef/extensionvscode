MUNDO MEIJI - SISTEMA DE PORTALES Y MUNDOS INFINITOS CON CONFIGURACIÓN JSON
===============================================================================

RESOLUCIÓN: 1920x1080 Full HD
MUNDO: 60x33 tiles (pantalla completa)
JUGADOR: 32x32 pixels (cuadrado rojo)
MOTOR: Phaser 3.70

========================================
ESTADO ACTUAL - VERSIÓN 1.0
========================================

✅ COMPLETADO:
- Sistema de portales bidireccional (entrada/salida)
- Generación procedimental con semillas únicas
- Bordes del mundo con colisiones (excepto portales)
- Jugador visible 32x32px con físicas
- Sistema de configuración JSON centralizado
- 4 capas de tiles (ground, paths, nature, buildings)
- Cooldown en portales (500ms)
- UI overlay con información del mundo
- Debug logs completos en consola
- Sistema RNG determinista por semilla

🔧 EN DESARROLLO:
- Edificios multi-bloque grandes (6x8, 8x10, 10x12)
- Sistema de NPCs interactivos
- Sistema de enemigos con IA
- Elementos interactivos (cofres, señales, puertas)

========================================
SISTEMA DE PORTALES
========================================

🚪 PORTAL ENTRADA (Izquierda - Verde)
- Posición: x=20, y=centro (540px)
- Tamaño: 96 pixels altura
- Color: Verde semitransparente (0x00FF00, 30%)
- Función: Retroceder al mundo anterior
- Límite: No permite ir antes del Mundo 1

🚪 PORTAL SALIDA (Derecha - Rojo)
- Posición: x=1900, y=centro (540px)
- Tamaño: 96 pixels altura
- Color: Rojo semitransparente (0xFF0000, 30%)
- Función: Avanzar al siguiente mundo
- Límite: Mundos infinitos

BORDES DEL MUNDO:
- Grosor: 10 pixels invisible
- Cobertura: 100% perímetro (superior, inferior, laterales)
- Excepciones: 2 portales de 96px
- Físicas: Colisión estática con jugador

COOLDOWN PORTALES:
- Tiempo: 500ms después de cargar mundo
- Variable: canChangeWorld
- Previene: Loop infinito de cambio de mundo
- Log: "✓ Portales activados - Puedes cambiar de mundo"

========================================
SISTEMA DE SEMILLAS Y CONFIGURACIÓN JSON
========================================

ARCHIVO: data/world-config.json

SEMILLAS ÚNICAS:
- Mundo 1: 12345
- Mundo 2: 67890
- Mundo 3: 24680
- Mundo 4: 13579
- Mundo 5: 98765
- Mundo N: worldNumber * 1000 + 42

GENERADOR RNG:
- Algoritmo: Linear Congruential Generator (LCG)
- Fórmula: state = (state * 1664525 + 1013904223) % 4294967296
- Determinista: Mismo mundo = mismos números
- Uso: Reemplaza Math.random() en todas las generaciones

CONFIGURACIÓN POR MUNDO:
{
  "1": {
    "name": "Mundo Inicio",
    "theme": "peaceful",
    "enemiesEnabled": false,
    "npcsEnabled": true,
    "npcTypes": ["merchant", "elder"]
  },
  "2": {
    "name": "Mundo Aldea",
    "theme": "village",
    "enemiesEnabled": true,
    "specialBuildings": ["largeHouse"]
  }
}

========================================
GENERACIÓN PROCEDIMENTAL (4 FASES)
========================================

FASE 1: TERRENO BASE
- Pasto aleatorio (tiles 0-3)
- Noise: sin(x * 0.1) + cos(y * 0.1) + rng()
- Usa worldNumber en cálculo de noise
- Resultado: Terreno único por semilla

FASE 2: EDIFICIOS
- Grid estratégico: 4x3 celdas (configurable en JSON)
- Tipos simples: Casa (3x4), Templo (4x3), Tienda (2x3)
- Probabilidad: 70% por celda (worldGeneration.buildings.spawnChance)
- Detección de colisiones antes de colocar
- Resultado: 8-10 edificios distribuidos

PREPARADO - Edificios Multi-bloque:
{
  "largeHouse": {
    "tileStartIndex": 4,
    "width": 6,
    "height": 8,
    "interactive": true,
    "interior": "house_1_interior.json"
  },
  "mansion": {width: 8, height: 10},
  "castle": {width: 10, height: 12}
}

FASE 3: CAMINOS
- Conecta edificios: 30% probabilidad (configurable)
- 3 caminos principales (vertical x2, horizontal x1)
- Algoritmo: Pathfinding en L
- Tiles: 16 (main), 17 (secondary)
- Resultado: Red de caminos conectada

FASE 4: NATURALEZA
- 300 elementos de vegetación (configurable)
- Árboles: 32 (sakura), 33 (pino)
- Arbustos: 34
- 5 zonas de montañas 6x6 (tiles 48-50)
- Evita edificios y caminos

========================================
ESTRUCTURA DEL TILESET
========================================

TILES EN USO:
0-3:   Terreno (pasto 4 variantes) - NO colisión
16-17: Caminos (principal/secundario) - NO colisión
32-34: Naturaleza (árboles/arbustos) - CON colisión
48-50: Montañas (3 tipos) - CON colisión
64-66: Casa simple (3 tiles) - CON colisión
80-83: Templo simple (4 tiles) - CON colisión
96-97: Tienda simple (2 tiles) - CON colisión

TILES RESERVADOS (En JSON):
4-15:   Edificios grandes tipo A (largeHouse 6x8)
18-31:  Edificios grandes tipo B (mansion 8x10)
35-47:  Edificios grandes tipo C (castle 10x12)
51-63:  Decoración y detalles
67-79:  Estructuras especiales
84-87:  NPCs (Merchant, Guard, Elder, Child)
88-90:  Enemigos (Slime, Skeleton, Goblin)
91-94:  Elementos interactivos (Chest, Sign, Door, Lever)
95-255: Expansión futura

========================================
JUGADOR
========================================

SPRITE:
- Tamaño: 32x32 pixels
- Diseño: Cuadrado rojo con borde blanco (4px)
- Centro: Punto amarillo (6px radio)
- Profundidad: 10000 (siempre encima)

POSICIÓN INICIAL:
- x: WORLD.tileSize + 16 = 48px (1 tile desde borde)
- y: WORLD.screenHeight / 2 = 540px (centro vertical)

FÍSICAS:
- Velocidad: 250 px/s
- Colisiona con: bordes, árboles, montañas, edificios
- NO colisiona con: portales, pasto, caminos
- setCollideWorldBounds: false (permite salir por portales)

MOVIMIENTO:
- Flechas ⬆️⬇️⬅️➡️
- Velocidad constante
- Sin aceleración/fricción

========================================
NAVEGACIÓN ENTRE MUNDOS
========================================

FLUJO:
1. Mundo 1 → Portal rojo → Mundo 2
2. Mundo 2 → Portal rojo → Mundo 3
3. Mundo N → Portal verde → Mundo N-1
4. Mundo 1 → Portal verde → Sin efecto

MECÁNICA:
- Al tocar portal → canChangeWorld = false
- scene.scene.restart() regenera TODO
- worldNumber incrementa/decrementa
- Jugador reaparece en posición inicial
- Cooldown 500ms → canChangeWorld = true

LOGS:
- 🚪 PORTAL ENTRADA - Retrocediendo al mundo anterior
- 🚪 PORTAL SALIDA - Avanzando al siguiente mundo
- 🚫 Ya estás en el Mundo 1 (no puedes retroceder más)

========================================
CONTROLES
========================================

⬆️⬇️⬅️➡️ - Mover jugador
Portal verde (izquierda) - Mundo anterior
Portal rojo (derecha) - Siguiente mundo
F12 - Abrir consola de desarrollo

========================================
UI OVERLAY
========================================

SUPERIOR IZQUIERDA:
🌍 Mundo Inicio (#1) | 🎨 peaceful
Pos: (48, 540) | Tile: (1, 16)

INFERIOR:
🚪 Entrada (Izquierda) | Salida (Derecha) 🚪

PROFUNDIDAD:
- Texto UI: 2000
- Jugador: 10000
- Portales visuales: 500

========================================
LOGS EN CONSOLA (F12)
========================================

AL CARGAR MUNDO:
🎲 Semilla del mundo 1: 12345
📋 Configuración: {name: "Mundo Inicio", theme: "peaceful"...}
FASE 1: Generando terreno base...
✓ Terreno generado
FASE 2: Colocando edificios...
✓ Edificios colocados: 9
FASE 3: Conectando edificios con caminos...
✓ Caminos generados
FASE 4: Añadiendo naturaleza...
✓ Naturaleza colocada: 243 elementos
✓ Bordes del mundo creados (con portales)
✓ Portales creados (Entrada: Izquierda | Salida: Derecha)
========================================
🌍 Mundo Inicio (#1) GENERADO
🎨 Tema: peaceful
📐 Tamaño: 60 x 33 tiles
🏠 Edificios simples: 9
👥 NPCs habilitados: true
⚔️ Enemigos habilitados: false
🏰 Edificios especiales: Ninguno
========================================
✓ Portales activados - Puedes cambiar de mundo

========================================
ARCHIVOS DEL PROYECTO
========================================

v2game/
├── index.html                     → Punto de entrada
├── game.js                        → Motor del juego (430+ líneas)
├── README.txt                     → Este archivo
│
├── assets/
│   └── tilesets/
│       └── tileset1.png           → Tileset 16x16 (32x32px/tile)
│
├── data/
│   ├── tileset-collisions.json    → Mapa de colisiones 1:1
│   └── world-config.json          → Configuración completa
│
└── config/
    └── assets-config.js           → Configuración legacy (no usado)

========================================
CONFIGURACIÓN TÉCNICA
========================================

PHASER 3.70:
- Type: Phaser.AUTO (WebGL con fallback a Canvas)
- Física: Arcade (sin gravedad)
- pixelArt: true
- Debug: false

MUNDO:
- screenWidth: 1920
- screenHeight: 1080
- tilesX: 60 (1920 / 32)
- tilesY: 33 (1080 / 32)
- tileSize: 32
- portalSize: 96

CAPAS (en orden):
1. groundLayer (z:0) - Terreno base
2. pathsLayer (z:0) - Caminos
3. natureLayer (z:0) - Árboles/montañas + colisiones
4. buildingsLayer (z:0) - Edificios + colisiones
5. Portales (z:500) - Visuales
6. Jugador (z:10000) - Sprite
7. UI (z:2000) - Textos overlay

========================================
PRÓXIMA IMPLEMENTACIÓN
========================================

🏗️ FASE SIGUIENTE - EDIFICIOS GRANDES:
1. Agregar imágenes al tileset (tiles 4-95)
2. Crear función placeMultiBlockBuildings()
3. Sistema de detección de entrada a edificios
4. Cargar interiores desde JSON
5. Sistema de puertas/teletransporte

👥 NPCS:
1. Crear sprites (tiles 84-87)
2. Sistema de spawn según worldConfig
3. Detección de interacción (tecla E/Enter)
4. Sistema de diálogos
5. Animación idle/movimiento
6. Persistencia de estado

⚔️ ENEMIGOS:
1. Crear sprites (tiles 88-90)
2. Sistema de spawn por mundo
3. IA básica (patrol/chase/attack)
4. Sistema de combate
5. Drops de items/XP
6. Respawn en worldNumber > 1

🎁 ELEMENTOS INTERACTIVOS:
1. Cofres (tile 91) - Loot aleatorio
2. Señales (tile 92) - Mensajes/hints
3. Puertas (tile 93) - Teletransporte
4. Palancas (tile 94) - Switches/puzzles

📦 SISTEMA DE ITEMS:
1. Inventario del jugador
2. Equipamiento
3. Consumibles
4. Quest items

🎵 AUDIO:
1. Música de fondo por mundo
2. SFX de pasos
3. SFX de portales
4. SFX de combate
5. SFX de interacciones

========================================
COMANDOS DE DEBUG
========================================

En la consola del navegador (F12):

// Ver jugador
console.log('Player:', player);
console.log('Posición:', player.x, player.y);

// Ver configuración actual
console.log('World Config:', worldConfig);
console.log('Current World:', currentWorldConfig);

// Cambiar mundo manualmente
worldNumber = 5;
game.scene.scenes[0].scene.restart();

// Ver edificios
console.log('Buildings:', buildings);

// Ver semilla
console.log('Semilla actual:', worldNumber);

========================================
NOTAS IMPORTANTES
========================================

⚠️ SEMILLAS:
- Cada mundo tiene semilla única
- Mismo worldNumber = mismo mundo siempre
- NO uses Math.random(), usa rng()

⚠️ PORTALES:
- Cooldown de 500ms evita loops
- Portal verde bloqueado en Mundo 1
- canChangeWorld debe estar en true

⚠️ COLISIONES:
- Definidas en tileset-collisions.json
- 1 = colisión, 0 = sin colisión
- Aplicadas en natureLayer y buildingsLayer

⚠️ TILESET:
- Muchos slots vacíos reservados
- Tiles 4-95 preparados para expansión
- NO sobrescribir tiles en uso (0-3, 16-17, 32-34, 48-50, 64-66, 80-83, 96-97)

========================================
SOLUCIÓN DE PROBLEMAS
========================================

Jugador no visible:
- Verificar profundidad (depth: 10000)
- Verificar posición (no en borde)
- Verificar textura generada en preload

Loop infinito portales:
- Verificar canChangeWorld = false antes de restart
- Verificar cooldown de 500ms

Mundo no se regenera:
- Verificar semilla en worldConfig
- Verificar rng() en lugar de Math.random()
- Verificar scene.restart() se ejecuta

JSON no carga:
- Verificar ruta: data/world-config.json
- Verificar preload() tiene this.load.json()
- Verificar sintaxis JSON válida
