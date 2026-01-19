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

let map, tileset, player, cursors, buildings = [];
let groundLayer, pathsLayer, natureLayer, buildingsLayer;
let portalEntrance, portalExit, worldBorders;
let worldNumber = 1;

function preload() {
    this.load.image('tileset', 'assets/tilesets/tileset1.png');
    this.load.json('collisions', 'data/tileset-collisions.json');
}

function create() {
    buildings = [];

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
    gfx.fillStyle(0xFF4444, 1);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(3, 0xFFFFFF, 1);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.generateTexture('player', 32, 32);
    gfx.destroy();

    player = this.physics.add.sprite(150, WORLD.screenHeight / 2, 'player');
    player.setCollideWorldBounds(false);
    player.setDepth(1000);

    const collisionData = this.cache.json.get('collisions');
    if (collisionData && collisionData.collisions) {
        const collidableTiles = [];
        for (let idx in collisionData.collisions) {
            if (collisionData.collisions[idx] === 1) {
                collidableTiles.push(parseInt(idx));
            }
        }
        natureLayer.setCollision(collidableTiles);
        buildingsLayer.setCollision(collidableTiles);
    }

    this.physics.add.collider(player, natureLayer);
    this.physics.add.collider(player, buildingsLayer);

    createWorldBorders(this);
    createPortals(this);

    cursors = this.input.keyboard.createCursorKeys();

    this.add.text(16, 16, `🌍 MUNDO ${worldNumber} | Flechas: Mover`, {
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

    console.log('========================================');
    console.log(`🌍 MUNDO ${worldNumber} GENERADO`);
    console.log('Mundo:', WORLD.tilesX, 'x', WORLD.tilesY, 'tiles');
    console.log('Edificios:', buildings.length);
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
        console.log('🚪 PORTAL ENTRADA - Retrocediendo al mundo anterior');
        worldNumber = Math.max(1, worldNumber - 1);
        scene.scene.restart();
    });

    scene.physics.add.overlap(player, portalExit, () => {
        console.log('🚪 PORTAL SALIDA - Avanzando al siguiente mundo');
        worldNumber++;
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
            const noise = (Math.sin(x * 0.1 + worldNumber) + Math.cos(y * 0.1 + worldNumber)) * 0.5 + Math.random() * 0.5;
            const grassTile = TILES.grass[Math.floor(Math.abs(noise) * TILES.grass.length) % TILES.grass.length];
            groundLayer.putTileAt(grassTile, x, y);
        }
    }
    console.log('✓ Terreno generado');
}

function placeBuildings() {
    console.log('FASE 2: Colocando edificios...');

    const buildingTypes = [
        { tiles: TILES.house, w: 3, h: 4, name: 'casa' },
        { tiles: TILES.temple, w: 4, h: 3, name: 'templo' },
        { tiles: TILES.shop, w: 2, h: 3, name: 'tienda' }
    ];

    const gridX = 4;
    const gridY = 3;
    const cellW = Math.floor(WORLD.tilesX / gridX);
    const cellH = Math.floor(WORLD.tilesY / gridY);

    for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < gridX; gx++) {
            if (Math.random() > 0.3) {
                const bType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                const cellStartX = gx * cellW;
                const cellStartY = gy * cellH;

                const bx = cellStartX + Math.floor(Math.random() * (cellW - bType.w - 2)) + 1;
                const by = cellStartY + Math.floor(Math.random() * (cellH - bType.h - 2)) + 1;

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
    console.log('✓ Edificios colocados:', buildings.length);
}

function generatePaths() {
    console.log('FASE 3: Conectando edificios con caminos...');

    for (let i = 0; i < buildings.length; i++) {
        for (let j = i + 1; j < buildings.length; j++) {
            if (Math.random() > 0.7) {
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
        const x = Math.floor(Math.random() * WORLD.tilesX);
        const y = Math.floor(Math.random() * WORLD.tilesY);

        if (!buildingsLayer.getTileAt(x, y) && !pathsLayer.getTileAt(x, y)) {
            const tile = natureTiles[Math.floor(Math.random() * natureTiles.length)];
            natureLayer.putTileAt(tile, x, y);
            placed++;
        }
    }

    for (let i = 0; i < 5; i++) {
        const mx = Math.floor(Math.random() * (WORLD.tilesX - 8));
        const my = Math.floor(Math.random() * (WORLD.tilesY - 8));

        for (let dy = 0; dy < 6; dy++) {
            for (let dx = 0; dx < 6; dx++) {
                if (Math.random() > 0.4 && !buildingsLayer.getTileAt(mx + dx, my + dy)) {
                    const mTile = TILES.mountain[Math.floor(Math.random() * TILES.mountain.length)];
                    natureLayer.putTileAt(mTile, mx + dx, my + dy);
                }
            }
        }
    }

    console.log('✓ Naturaleza colocada:', placed, 'elementos');
}
