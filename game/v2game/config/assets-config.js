/**
 * CONFIGURACIÓN DE ASSETS - ERA MEIJI JAPÓN
 * ==========================================
 *
 * TILESET:
 * - Archivo: tileset1.png
 * - Tamaño total: 512x512 pixels
 * - Tamaño de cada tile: 32x32 pixels
 * - Grid: 16 columnas x 16 filas = 256 tiles posibles
 * - Formato: PNG
 *
 * ÍNDICES DE TILES:
 * -----------------
 *
 * TERRENO (Fila 0):
 *   0: Pasto verde
 *   1: Pasto claro
 *   2: Pasto oscuro
 *   3: Pasto amarillento
 *
 * CAMINOS (Fila 1):
 *   16: Camino principal (tierra)
 *   17: Camino secundario (piedras)
 *
 * NATURALEZA (Fila 2):
 *   32: Árbol (cerezo/sakura)
 *   33: Pino
 *   34: Arbusto/bush
 *
 * MONTAÑAS (Fila 3):
 *   48: Montaña tipo 1
 *   49: Montaña tipo 2
 *   50: Montaña tipo 3
 *
 * EDIFICIOS - CASAS (Fila 4):
 *   64: Casa parte 1
 *   65: Casa parte 2
 *   66: Casa parte 3
 *
 * EDIFICIOS - TEMPLOS (Fila 5):
 *   80: Templo parte 1
 *   81: Templo parte 2
 *   82: Templo parte 3
 *   83: Templo parte 4
 *
 * EDIFICIOS - TIENDAS (Fila 6):
 *   96: Tienda parte 1
 *   97: Tienda parte 2
 *
 * CÁLCULO DE ÍNDICE:
 * índice = (fila * 16) + columna
 * Ejemplo: Fila 1, Columna 0 = (1 * 16) + 0 = 16
 */

const ASSETS_CONFIG = {
    // Configuración del tileset principal
    tileset: {
        key: 'tileset',
        path: 'assets/tilesets/tileset1.png',
        tileWidth: 32,
        tileHeight: 32,
        spacing: 0,
        margin: 0
    },

    // Sprites de personajes
    characters: {
        player: {
            key: 'player',
            path: 'assets/characters/player.png',
            frameWidth: 32,
            frameHeight: 32
        }
    },

    // Índices de tiles organizados por categoría
    tiles: {
        terrain: {
            grass: [0, 1, 2, 3]
        },
        paths: {
            main: [16],
            secondary: [17]
        },
        nature: {
            trees: [32, 33],
            bushes: [34]
        },
        mountains: {
            types: [48, 49, 50]
        },
        buildings: {
            house: [64, 65, 66],
            temple: [80, 81, 82, 83],
            shop: [96, 97]
        }
    },

    // Configuración del mapa
    map: {
        width: 100,
        height: 100,
        tileSize: 32
    },

    // Configuración del juego
    game: {
        width: 1280,
        height: 720,
        backgroundColor: '#87CEEB',
        zoom: 1.5
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ASSETS_CONFIG;
}
