MUNDO MEIJI - GENERACIÓN PROCEDIMENTAL DIRIGIDA
================================================

RESOLUCIÓN: 1920x1080 Full HD (pantalla completa visible)
MUNDO: 60x33 tiles (exacto al tamaño de pantalla, sin scroll)
MOTOR: Phaser 3.70

ARCHIVOS:
- index.html → Punto de entrada
- game.js → Sistema de generación procedimental en 4 fases

========================================
SISTEMA DE GENERACIÓN PROCEDIMENTAL
========================================

FASE 1: TERRENO BASE
- Genera todo el mapa con tiles de pasto (0-3)
- Usa noise procedural (sin + cos + random)
- Resultado: Base verde completa

FASE 2: EDIFICIOS (Colocación Estratégica)
- Grid inteligente: 4x3 celdas
- Tipos: Casas (3x4), Templos (4x3), Tiendas (2x3)
- Probabilidad 70% por celda
- Detección de colisiones antes de colocar
- Resultado: 8-10 edificios distribuidos uniformemente

FASE 3: CAMINOS (Conectividad)
- Conecta edificios entre sí (30% probabilidad)
- 3 caminos principales:
  * 2 verticales (divide en tercios)
  * 1 horizontal (centro)
- Algoritmo: Pathfinding en L
- Resultado: Red de caminos conectada

FASE 4: NATURALEZA
- 300 elementos: árboles, pinos, arbustos
- 5 zonas de montañas (6x6 tiles cada una)
- Evita edificios y caminos
- Resultado: Mundo vivo y natural

========================================
CONTROLES
========================================

⬆️⬇️⬅️➡️ - Mover jugador (velocidad 300)
F12 - Consola (ver logs de generación)

========================================
CARACTERÍSTICAS TÉCNICAS
========================================

✓ Pantalla estática (sin scroll ni cámara)
✓ Mundo exacto a pantalla (60x33 tiles)
✓ Jugador visible: círculo rojo 32x32
✓ Colisiones: árboles, montañas, edificios
✓ Debug overlay: posición en tiempo real
✓ Logs en consola de cada fase

TILES DEL TILESET:
0-3: Pasto (4 variantes)
16-17: Caminos
32-34: Árboles/arbustos
48-50: Montañas
64-66: Casas
80-83: Templos
96-97: Tiendas

COLISIONES (JSON):
- Con colisión: 32-34, 48-50, 64-66, 80-83, 96-97
- Sin colisión: 0-3, 16-17

========================================
DEBUG
========================================

Abre la consola (F12) para ver:
- FASE 1: Generando terreno base...
- FASE 2: Colocando edificios...
- FASE 3: Conectando edificios con caminos...
- FASE 4: Añadiendo naturaleza...
- Mundo generado: 60 x 33 tiles
- Edificios colocados: X
- MUNDO COMPLETO - Listo para jugar

OVERLAY:
- Esquina superior izquierda: Controles
- Segunda línea: Posición exacta del jugador

========================================
DIFERENCIAS CON VERSIÓN ANTERIOR
========================================

✗ Antes: 120x80 tiles (mundo gigante con scroll)
✓ Ahora: 60x33 tiles (pantalla completa visible)

✗ Antes: Generación caótica aleatoria
✓ Ahora: 4 fases dirigidas

✗ Antes: Edificios dispersos
✓ Ahora: Grid estratégico 4x3

✗ Antes: Sin caminos coherentes
✓ Ahora: Red de caminos conectados

✗ Antes: Jugador perdido
✓ Ahora: Todo visible, pantalla estática
