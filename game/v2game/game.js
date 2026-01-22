const WORLD = {
    tileSize: 32,
    screenWidth: 1920,
    screenHeight: 1080,
    get tilesX() { return Math.floor(this.screenWidth / this.tileSize); },
    get tilesY() { return Math.floor(this.screenHeight / this.tileSize); },
    portalSize: 96
};

const TILES = {
    grass: [0, 1, 2, 3],
    path: 16,
    pathSecondary: 17,
    tree: 32,
    pine: 33,
    bush: 34,
    mountain: [48, 49, 50],
    house: [64, 65, 66],
    temple: [80, 81, 82, 83],
    shop: [96, 97]
};

const config = {
    type: Phaser.AUTO,
    width: WORLD.screenWidth,
    height: WORLD.screenHeight,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    pixelArt: true
};

const game = new Phaser.Game(config);

window.addEventListener('load', () => {
    setTimeout(() => {
        const seedInput = document.getElementById('seed-input');
        const worldNumberInput = document.getElementById('worldNumber-input');
        const applyButton = document.getElementById('apply-seed-btn');

        if (applyButton) {
            applyButton.addEventListener('click', () => {
                const customSeed = parseInt(seedInput.value);
                const customWorldNumber = parseInt(worldNumberInput.value);

                if (customWorldNumber && customWorldNumber > 0) {
                    worldNumber = customWorldNumber;
                }

                const targetSeed = customSeed || (worldNumber * 1000 + 42);

                localStorage.setItem('playerData', JSON.stringify({
                    x: WORLD.tileSize + 16,
                    y: WORLD.screenHeight / 2,
                    worldNumber: worldNumber,
                    seed: targetSeed,
                    lastPortal: null,
                    customSeed: customSeed || null
                }));

                console.log(`🎲 Recargando mundo ${worldNumber} con semilla ${targetSeed}`);
                location.reload();
            });
        }
    }, 100);
});

let map, tileset, player, cursors, buildings = [];
let groundLayer, pathsLayer, natureLayer, buildingsLayer;
let portalEntrance, portalExit, worldBorders;
let worldNumber = 1;
let canChangeWorld = false;
let rng;
let worldConfig;
let currentWorldConfig;
let seedStructures;
let doorTiles = [];
let keyE;
let doorPromptText;

function seededRandom(seed) {
    let state = seed;
    return function() {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function preload() {
    this.load.image('tileset', 'assets/tilesets/tileset1.png');
    this.load.json('collisions', 'data/tileset-collisions.json');
    this.load.json('worldConfig', 'data/world-config.json');
    this.load.json('seedStructures', 'data/seed-structures.json');
}

function create() {
    buildings = [];
    doorTiles = [];

    const savedData = localStorage.getItem('playerData');
    if (savedData) {
        const data = JSON.parse(savedData);
        worldNumber = data.worldNumber || worldNumber;
    }

    worldConfig = this.cache.json.get('worldConfig');
    seedStructures = this.cache.json.get('seedStructures');
    currentWorldConfig = worldConfig.worldSpecificConfig[worldNumber] || {
        name: `Mundo ${worldNumber}`,
        theme: 'default',
        enemiesEnabled: true,
        npcsEnabled: true,
        npcTypes: ['merchant', 'guard'],
        specialBuildings: []
    };

    const seed = worldConfig.worldSeeds[worldNumber] || (worldNumber * 1000 + 42);

    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.worldNumber === worldNumber && data.seed !== seed) {
            console.log('🔄 Semilla cambió - Regenerando mundo');
            localStorage.setItem('playerData', JSON.stringify({
                x: WORLD.tileSize + 16,
                y: WORLD.screenHeight / 2,
                worldNumber: worldNumber,
                seed: seed
            }));
        }
    }

    rng = seededRandom(seed);

    console.log(`🎲 Semilla del mundo ${worldNumber}:`, seed);
    console.log(`📋 Configuración:`, currentWorldConfig);

    map = this.make.tilemap({
        tileWidth: WORLD.tileSize,
        tileHeight: WORLD.tileSize,
        width: WORLD.tilesX,
        height: WORLD.tilesY
    });

    tileset = map.addTilesetImage('tileset');

    groundLayer = map.createBlankLayer('ground', tileset, 0, 0);
    pathsLayer = map.createBlankLayer('paths', tileset, 0, 0);
    natureLayer = map.createBlankLayer('nature', tileset, 0, 0);
    buildingsLayer = map.createBlankLayer('buildings', tileset, 0, 0);

    generateTerrain();
    placeBuildings();
    generatePaths();
    placeNature();

    const gfx = this.add.graphics();
    gfx.fillStyle(0xFF0000, 1);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(4, 0xFFFFFF, 1);
    gfx.strokeRect(2, 2, 28, 28);
    gfx.fillStyle(0xFFFF00, 1);
    gfx.fillCircle(16, 16, 6);
    gfx.generateTexture('player', 32, 32);
    gfx.destroy();

    let startX = WORLD.tileSize + 16;
    let startY = WORLD.screenHeight / 2;

    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.worldNumber === worldNumber) {
            if (data.lastPortal === 'exit') {
                startX = WORLD.tileSize + 16;
                startY = WORLD.screenHeight / 2;
            } else if (data.lastPortal === 'entrance') {
                startX = WORLD.screenWidth - WORLD.tileSize - 16;
                startY = WORLD.screenHeight / 2;
            } else {
                startX = data.x || startX;
                startY = data.y || startY;
            }
        }
    }

    player = this.physics.add.sprite(startX, startY, 'player');
    player.setCollideWorldBounds(true);
    player.setDepth(10000);
    player.displayWidth = 32;
    player.displayHeight = 32;

    const collisionData = this.cache.json.get('collisions');
    if (collisionData && collisionData.collisions) {
        const collidableTiles = [];
        for (let idx in collisionData.collisions) {
            if (collisionData.collisions[idx] === 1) {
                collidableTiles.push(parseInt(idx));
            }
        }
        natureLayer.setCollision(collidableTiles);

        const doorTileIndices = doorTiles.map(d => d.tileIndex);
        console.log('🚪 Door tiles para excluir de colisión:', doorTileIndices);
        const buildingCollisionTiles = collidableTiles.filter(t => !doorTileIndices.includes(t));
        buildingsLayer.setCollision(buildingCollisionTiles);
        console.log('✓ Colisiones configuradas. Tiles bloqueados:', buildingCollisionTiles.length, 'Puertas excluidas:', doorTileIndices.length);
    }

    this.physics.add.collider(player, natureLayer);
    this.physics.add.collider(player, buildingsLayer);

    createWorldBorders(this);
    createPortals(this);

    cursors = this.input.keyboard.createCursorKeys();
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    canChangeWorld = false;
    this.time.delayedCall(500, () => {
        canChangeWorld = true;
        console.log('✓ Portales activados - Puedes cambiar de mundo');
    });

    this.add.text(16, 16, `🌍 ${currentWorldConfig.name} (#${worldNumber}) | 🎨 ${currentWorldConfig.theme}`, {
        fontSize: '22px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 12, y: 8 }
    }).setDepth(2000);

    const debugText = this.add.text(16, 60, '', {
        fontSize: '16px',
        fill: '#0f0',
        backgroundColor: '#000',
        padding: { x: 8, y: 4 }
    }).setDepth(2000);

    this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
            const tx = Math.floor(player.x / WORLD.tileSize);
            const ty = Math.floor(player.y / WORLD.tileSize);
            debugText.setText(`Pos: (${Math.floor(player.x)}, ${Math.floor(player.y)}) | Tile: (${tx}, ${ty})`);
        }
    });

    this.add.text(16, WORLD.screenHeight - 60, '🚪 Entrada (Izquierda) | Salida (Derecha) 🚪', {
        fontSize: '18px',
        fill: '#ffff00',
        backgroundColor: '#000',
        padding: { x: 10, y: 6 }
    }).setDepth(2000);

    doorPromptText = this.add.text(WORLD.screenWidth / 2, WORLD.screenHeight - 80, '', {
        fontSize: '20px',
        fill: '#00ff00',
        backgroundColor: '#000',
        padding: { x: 12, y: 8 },
        align: 'center'
    }).setOrigin(0.5).setDepth(2000).setVisible(false);

    console.log('========================================');
    console.log(`🌍 ${currentWorldConfig.name} (#${worldNumber}) GENERADO`);
    console.log('🎨 Tema:', currentWorldConfig.theme);
    console.log('📐 Tamaño:', WORLD.tilesX, 'x', WORLD.tilesY, 'tiles');
    console.log('🏠 Edificios simples:', buildings.length);
    console.log('🚪 Puertas interactivas:', doorTiles.length);
    if (doorTiles.length > 0) {
        console.log('📍 Puertas detectadas:');
        doorTiles.forEach(d => console.log(`  - Pos: (${d.x}, ${d.y}) Tile:${d.tileIndex} Link:${d.link}`));
    }
    console.log('👥 NPCs habilitados:', currentWorldConfig.npcsEnabled);
    console.log('⚔️ Enemigos habilitados:', currentWorldConfig.enemiesEnabled);
    console.log('🏰 Edificios especiales:', currentWorldConfig.specialBuildings.join(', ') || 'Ninguno');
    console.log('========================================');
}

function update() {
    const speed = 250;
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
        player.setVelocityX(speed);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        player.setVelocityY(speed);
    }

    checkNearDoor();

    if (Phaser.Input.Keyboard.JustDown(keyE)) {
        checkDoorInteraction(this);
    }

    const currentSeed = worldConfig.worldSeeds[worldNumber] || (worldNumber * 1000 + 42);
    localStorage.setItem('playerData', JSON.stringify({
        x: player.x,
        y: player.y,
        worldNumber: worldNumber,
        seed: currentSeed,
        lastPortal: null
    }));
}

function checkNearDoor() {
    if (!player || doorTiles.length === 0) return;

    const playerTileX = Math.floor(player.x / WORLD.tileSize);
    const playerTileY = Math.floor(player.y / WORLD.tileSize);

    for (const door of doorTiles) {
        const distance = Phaser.Math.Distance.Between(
            playerTileX, playerTileY,
            door.x, door.y
        );

        if (distance <= 1.5) {
            doorPromptText.setText(door.messageIn);
            doorPromptText.setVisible(true);
            return;
        }
    }

    doorPromptText.setVisible(false);
}

function checkDoorInteraction(scene) {
    if (!player || doorTiles.length === 0) {
        console.log('⚠️ No hay puertas disponibles');
        return;
    }

    const playerTileX = Math.floor(player.x / WORLD.tileSize);
    const playerTileY = Math.floor(player.y / WORLD.tileSize);

    console.log(`🔍 Buscando puertas cerca de (${playerTileX}, ${playerTileY})`);

    for (const door of doorTiles) {
        const distance = Phaser.Math.Distance.Between(
            playerTileX, playerTileY,
            door.x, door.y
        );

        console.log(`  - Puerta en (${door.x}, ${door.y}) distancia: ${distance.toFixed(2)}`);

        if (distance <= 1.5) {
            console.log('🚪 Interactuando con puerta:', door.messageIn);
            if (door.link) {
                console.log('🔗 Redirigiendo a:', door.link);
                console.log('💬', door.messageOut);
                window.location.href = door.link;
            } else {
                console.log('⚠️ Esta puerta no tiene link configurado');
            }
            return;
        }
    }

    console.log('⚠️ No hay puertas cerca');
}

function createWorldBorders(scene) {
    worldBorders = scene.physics.add.staticGroup();

    const borderThickness = 10;
    const portalY = WORLD.screenHeight / 2;
    const portalHalfSize = WORLD.portalSize / 2;

    worldBorders.create(WORLD.screenWidth / 2, -borderThickness / 2, null)
        .setSize(WORLD.screenWidth, borderThickness)
        .setVisible(false);

    worldBorders.create(WORLD.screenWidth / 2, WORLD.screenHeight + borderThickness / 2, null)
        .setSize(WORLD.screenWidth, borderThickness)
        .setVisible(false);

    const leftTopHeight = portalY - portalHalfSize;
    if (leftTopHeight > 0) {
        worldBorders.create(-borderThickness / 2, leftTopHeight / 2, null)
            .setSize(borderThickness, leftTopHeight)
            .setVisible(false);
    }

    const leftBottomY = portalY + portalHalfSize;
    const leftBottomHeight = WORLD.screenHeight - leftBottomY;
    if (leftBottomHeight > 0) {
        worldBorders.create(-borderThickness / 2, leftBottomY + leftBottomHeight / 2, null)
            .setSize(borderThickness, leftBottomHeight)
            .setVisible(false);
    }

    const rightTopHeight = portalY - portalHalfSize;
    if (rightTopHeight > 0) {
        worldBorders.create(WORLD.screenWidth + borderThickness / 2, rightTopHeight / 2, null)
            .setSize(borderThickness, rightTopHeight)
            .setVisible(false);
    }

    const rightBottomY = portalY + portalHalfSize;
    const rightBottomHeight = WORLD.screenHeight - rightBottomY;
    if (rightBottomHeight > 0) {
        worldBorders.create(WORLD.screenWidth + borderThickness / 2, rightBottomY + rightBottomHeight / 2, null)
            .setSize(borderThickness, rightBottomHeight)
            .setVisible(false);
    }

    scene.physics.add.collider(player, worldBorders);

    console.log('✓ Bordes del mundo creados (con portales)');
}

function createPortals(scene) {
    const portalY = WORLD.screenHeight / 2;

    const gfxEntrance = scene.add.graphics();
    gfxEntrance.fillStyle(0x00FF00, 0.3);
    gfxEntrance.fillRect(0, portalY - WORLD.portalSize / 2, 40, WORLD.portalSize);
    gfxEntrance.lineStyle(4, 0x00FF00, 1);
    gfxEntrance.strokeRect(0, portalY - WORLD.portalSize / 2, 40, WORLD.portalSize);
    gfxEntrance.setDepth(500);

    portalEntrance = scene.add.zone(20, portalY, 40, WORLD.portalSize);
    scene.physics.world.enable(portalEntrance);
    portalEntrance.body.setAllowGravity(false);
    portalEntrance.body.moves = false;

    const gfxExit = scene.add.graphics();
    gfxExit.fillStyle(0xFF0000, 0.3);
    gfxExit.fillRect(WORLD.screenWidth - 40, portalY - WORLD.portalSize / 2, 40, WORLD.portalSize);
    gfxExit.lineStyle(4, 0xFF0000, 1);
    gfxExit.strokeRect(WORLD.screenWidth - 40, portalY - WORLD.portalSize / 2, 40, WORLD.portalSize);
    gfxExit.setDepth(500);

    portalExit = scene.add.zone(WORLD.screenWidth - 20, portalY, 40, WORLD.portalSize);
    scene.physics.world.enable(portalExit);
    portalExit.body.setAllowGravity(false);
    portalExit.body.moves = false;

    scene.physics.add.overlap(player, portalEntrance, () => {
        if (!canChangeWorld) return;
        if (worldNumber <= 1) {
            console.log('🚫 Ya estás en el Mundo 1 (no puedes retroceder más)');
            return;
        }
        console.log('🚪 PORTAL ENTRADA - Retrocediendo al mundo anterior');
        canChangeWorld = false;
        worldNumber--;
        const previousSeed = worldConfig.worldSeeds[worldNumber] || (worldNumber * 1000 + 42);
        localStorage.setItem('playerData', JSON.stringify({
            x: WORLD.screenWidth - WORLD.tileSize - 16,
            y: WORLD.screenHeight / 2,
            worldNumber: worldNumber,
            seed: previousSeed,
            lastPortal: 'entrance'
        }));
        scene.scene.restart();
    });

    scene.physics.add.overlap(player, portalExit, () => {
        if (!canChangeWorld) return;
        console.log('🚪 PORTAL SALIDA - Avanzando al siguiente mundo');
        canChangeWorld = false;
        worldNumber++;
        const nextSeed = worldConfig.worldSeeds[worldNumber] || (worldNumber * 1000 + 42);
        localStorage.setItem('playerData', JSON.stringify({
            x: WORLD.tileSize + 16,
            y: WORLD.screenHeight / 2,
            worldNumber: worldNumber,
            seed: nextSeed,
            lastPortal: 'exit'
        }));
        scene.scene.restart();
    });

    const entranceText = scene.add.text(50, portalY, '🚪\nENTRADA', {
        fontSize: '18px',
        fill: '#00ff00',
        backgroundColor: '#000',
        padding: { x: 8, y: 4 },
        align: 'center'
    }).setDepth(2000);

    const exitText = scene.add.text(WORLD.screenWidth - 120, portalY, '🚪\nSALIDA', {
        fontSize: '18px',
        fill: '#ff0000',
        backgroundColor: '#000',
        padding: { x: 8, y: 4 },
        align: 'center'
    }).setDepth(2000);

    console.log('✓ Portales creados (Entrada: Izquierda | Salida: Derecha)');
}

function generateTerrain() {
    console.log('FASE 1: Generando terreno base...');
    for (let y = 0; y < WORLD.tilesY; y++) {
        for (let x = 0; x < WORLD.tilesX; x++) {
            const noise = (Math.sin(x * 0.1 + worldNumber) + Math.cos(y * 0.1 + worldNumber)) * 0.5 + rng() * 0.5;
            const grassTile = TILES.grass[Math.floor(Math.abs(noise) * TILES.grass.length) % TILES.grass.length];
            groundLayer.putTileAt(grassTile, x, y);
        }
    }
    console.log('✓ Terreno generado');
}

function placeBuildings() {
    console.log('FASE 2: Colocando edificios...');

    const simpleBuildings = worldConfig.buildings.simple;
    const buildingTypes = [
        { tiles: simpleBuildings.house.tiles, w: simpleBuildings.house.width, h: simpleBuildings.house.height, name: 'casa' },
        { tiles: simpleBuildings.temple.tiles, w: simpleBuildings.temple.width, h: simpleBuildings.temple.height, name: 'templo' },
        { tiles: simpleBuildings.shop.tiles, w: simpleBuildings.shop.width, h: simpleBuildings.shop.height, name: 'tienda' }
    ];

    const customStructuresArray = [];
    const customWorldStructures = seedStructures.customStructures[worldNumber];
    if (customWorldStructures && customWorldStructures.structures) {
        console.log(`📦 Estructuras custom encontradas para mundo ${worldNumber}`);
        for (const [key, structure] of Object.entries(customWorldStructures.structures)) {
            customStructuresArray.push({
                tiles: structure.tiles,
                w: structure.width,
                h: structure.height,
                name: structure.name,
                spawnCount: structure.spawnCount || 1,
                restrictions: structure.restrictions || null
            });
        }
    }

    const genRules = worldConfig.worldGeneration.buildings;
    const gridX = genRules.gridX;
    const gridY = genRules.gridY;
    const cellW = Math.floor(WORLD.tilesX / gridX);
    const cellH = Math.floor(WORLD.tilesY / gridY);

    for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < gridX; gx++) {
            if (rng() < genRules.spawnChance) {
                const bType = buildingTypes[Math.floor(rng() * buildingTypes.length)];
                const cellStartX = gx * cellW;
                const cellStartY = gy * cellH;

                const bx = cellStartX + Math.floor(rng() * (cellW - bType.w - 2)) + 1;
                const by = cellStartY + Math.floor(rng() * (cellH - bType.h - 2)) + 1;

                let canPlace = true;
                for (let dy = -1; dy <= bType.h; dy++) {
                    for (let dx = -1; dx <= bType.w; dx++) {
                        if (buildingsLayer.getTileAt(bx + dx, by + dy)) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }

                if (canPlace) {
                    for (let dy = 0; dy < bType.h; dy++) {
                        for (let dx = 0; dx < bType.w; dx++) {
                            const tileIdx = bType.tiles[dx % bType.tiles.length];
                            buildingsLayer.putTileAt(tileIdx, bx + dx, by + dy);
                        }
                    }
                    buildings.push({ x: bx + Math.floor(bType.w / 2), y: by + Math.floor(bType.h / 2), type: bType.name });
                }
            }
        }
    }

    for (const customStructure of customStructuresArray) {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placed < customStructure.spawnCount && attempts < maxAttempts) {
            attempts++;
            const bx = Math.floor(rng() * (WORLD.tilesX - customStructure.w - 2)) + 1;
            const by = Math.floor(rng() * (WORLD.tilesY - customStructure.h - 2)) + 1;

            let canPlace = true;

            for (let dy = -1; dy <= customStructure.h; dy++) {
                for (let dx = -1; dx <= customStructure.w; dx++) {
                    if (buildingsLayer.getTileAt(bx + dx, by + dy)) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }

            if (canPlace && customStructure.restrictions) {
                if (customStructure.restrictions.minDistanceFromOtherStructures) {
                    const minDist = customStructure.restrictions.minDistanceFromOtherStructures;
                    for (const building of buildings) {
                        const dist = Phaser.Math.Distance.Between(
                            bx + Math.floor(customStructure.w / 2),
                            by + Math.floor(customStructure.h / 2),
                            building.x, building.y
                        );
                        if (dist < minDist) {
                            canPlace = false;
                            break;
                        }
                    }
                }
            }

            if (canPlace) {
                let tileIndex = 0;
                for (let dy = 0; dy < customStructure.h; dy++) {
                    for (let dx = 0; dx < customStructure.w; dx++) {
                        const currentTile = customStructure.tiles[tileIndex];
                        buildingsLayer.putTileAt(currentTile, bx + dx, by + dy);

                        if (customStructure.restrictions && customStructure.restrictions.door_link) {
                            if (customStructure.restrictions.door_link.includes(currentTile)) {
                                doorTiles.push({
                                    x: bx + dx,
                                    y: by + dy,
                                    tileIndex: currentTile,
                                    messageIn: customStructure.restrictions.messajein || 'Presiona E para entrar',
                                    messageOut: customStructure.restrictions.messajeout || 'Saliendo...',
                                    link: customStructure.restrictions.link || null
                                });
                                console.log(`🚪 Puerta detectada en (${bx + dx}, ${by + dy}) tile:${currentTile} link:${customStructure.restrictions.link}`);
                            }
                        }

                        tileIndex++;
                    }
                }
                buildings.push({ x: bx + Math.floor(customStructure.w / 2), y: by + Math.floor(customStructure.h / 2), type: customStructure.name });
                placed++;
            }
        }

        if (placed < customStructure.spawnCount) {
            console.log(`⚠️ Solo se colocaron ${placed}/${customStructure.spawnCount} de ${customStructure.name}`);
        } else {
            console.log(`✓ ${customStructure.name}: ${placed} colocados`);
        }
    }

    console.log('✓ Edificios colocados:', buildings.length);
}

function generatePaths() {
    console.log('FASE 3: Conectando edificios con caminos...');

    for (let i = 0; i < buildings.length; i++) {
        for (let j = i + 1; j < buildings.length; j++) {
            if (rng() > 0.7) {
                connectBuildings(buildings[i], buildings[j]);
            }
        }
    }

    const mainRoads = [
        { x: Math.floor(WORLD.tilesX / 3), dir: 'v' },
        { x: Math.floor(2 * WORLD.tilesX / 3), dir: 'v' },
        { y: Math.floor(WORLD.tilesY / 2), dir: 'h' }
    ];

    mainRoads.forEach(road => {
        if (road.dir === 'v') {
            for (let y = 0; y < WORLD.tilesY; y++) {
                pathsLayer.putTileAt(TILES.path, road.x, y);
            }
        } else {
            for (let x = 0; x < WORLD.tilesX; x++) {
                pathsLayer.putTileAt(TILES.path, x, road.y);
            }
        }
    });

    console.log('✓ Caminos generados');
}

function connectBuildings(b1, b2) {
    let x = b1.x;
    let y = b1.y;

    while (x !== b2.x) {
        pathsLayer.putTileAt(TILES.path, x, y);
        x += (b2.x > x) ? 1 : -1;
    }

    while (y !== b2.y) {
        pathsLayer.putTileAt(TILES.path, x, y);
        y += (b2.y > y) ? 1 : -1;
    }
}

function placeNature() {
    console.log('FASE 4: Añadiendo naturaleza...');

    const natureTiles = [TILES.tree, TILES.pine, TILES.bush];
    let placed = 0;

    for (let i = 0; i < 300; i++) {
        const x = Math.floor(rng() * WORLD.tilesX);
        const y = Math.floor(rng() * WORLD.tilesY);

        if (!buildingsLayer.getTileAt(x, y) && !pathsLayer.getTileAt(x, y)) {
            const tile = natureTiles[Math.floor(rng() * natureTiles.length)];
            natureLayer.putTileAt(tile, x, y);
            placed++;
        }
    }

    for (let i = 0; i < 5; i++) {
        const mx = Math.floor(rng() * (WORLD.tilesX - 8));
        const my = Math.floor(rng() * (WORLD.tilesY - 8));

        for (let dy = 0; dy < 6; dy++) {
            for (let dx = 0; dx < 6; dx++) {
                if (rng() > 0.4 && !buildingsLayer.getTileAt(mx + dx, my + dy)) {
                    const mTile = TILES.mountain[Math.floor(rng() * TILES.mountain.length)];
                    natureLayer.putTileAt(mTile, mx + dx, my + dy);
                }
            }
        }
    }

    console.log('✓ Naturaleza colocada:', placed, 'elementos');
}
