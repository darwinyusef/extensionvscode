class MapLoader {
    constructor(scene) {
        this.scene = scene;
        this.worldConfig = null;
        this.collisionMatrix = null;
        this.tileSize = 40;
    }

    async loadWorld(worldConfigPath) {
        try {
            const response = await fetch(worldConfigPath);
            this.worldConfig = await response.json();
            this.tileSize = this.worldConfig.dimensions.tileSize;

            await this.loadCollisionMatrix(this.worldConfig.collisionMatrix);

            this.createBackground();
            this.createGrid();
            this.createRoads();
            this.createDecorations();
            this.createCollisionBodies();

            return {
                spawnPoint: this.worldConfig.spawnPoint,
                worldSize: this.worldConfig.dimensions
            };
        } catch (error) {
            console.error('Error loading world config:', error);
            return null;
        }
    }

    async loadCollisionMatrix(matrixPath) {
        try {
            const response = await fetch(matrixPath);
            this.collisionMatrix = await response.json();
        } catch (error) {
            console.error('Error loading collision matrix:', error);
        }
    }

    createBackground() {
        const { width, height } = this.worldConfig.dimensions;
        const bgConfig = this.worldConfig.background;

        if (bgConfig.type === 'image' && bgConfig.src) {
            const bg = this.scene.add.image(width / 2, height / 2, bgConfig.src);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1000);
        } else {
            const color = bgConfig.color || bgConfig.fallbackColor;
            const bg = this.scene.add.rectangle(
                width / 2,
                height / 2,
                width,
                height,
                parseInt(color.replace('#', '0x'))
            );
            bg.setDepth(-1000);
        }
    }

    createGrid() {
        if (!this.worldConfig.grid.enabled) return;

        const graphics = this.scene.add.graphics();
        graphics.setDepth(-500);

        const { width, height } = this.worldConfig.dimensions;
        const color = parseInt(this.worldConfig.grid.color.replace('#', '0x'));
        const alpha = this.worldConfig.grid.opacity;

        graphics.lineStyle(1, color, alpha);

        for (let x = 0; x <= width; x += this.tileSize) {
            graphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y <= height; y += this.tileSize) {
            graphics.lineBetween(0, y, width, y);
        }

        graphics.strokePath();
    }

    createRoads() {
        if (!this.worldConfig.roads) return;

        const graphics = this.scene.add.graphics();
        graphics.setDepth(-200);

        this.worldConfig.roads.forEach(road => {
            const color = parseInt(road.color.replace('#', '0x'));
            graphics.fillStyle(color, 1);
            graphics.fillRect(road.x, road.y, road.width, road.height);

            if (road.type === 'horizontal' && road.width > 150) {
                graphics.lineStyle(2, 0x444444, 0.6);
                const centerY = road.y + road.height / 2;
                graphics.lineBetween(road.x, centerY, road.x + road.width, centerY);
            } else if (road.type === 'vertical' && road.height > 150) {
                graphics.lineStyle(2, 0x444444, 0.6);
                const centerX = road.x + road.width / 2;
                graphics.lineBetween(centerX, road.y, centerX, road.y + road.height);
            }
        });

        graphics.strokePath();
    }

    createDecorations() {
        if (!this.worldConfig.decorations) return;

        const graphics = this.scene.add.graphics();
        graphics.setDepth(100);

        if (this.worldConfig.decorations.trees) {
            this.worldConfig.decorations.trees.forEach(tree => {
                const color = parseInt(tree.color.replace('#', '0x'));
                graphics.fillStyle(color, 1);
                graphics.fillCircle(tree.x, tree.y, tree.size);
                graphics.fillStyle(0x4a3228, 1);
                graphics.fillRect(tree.x - 5, tree.y + tree.size - 10, 10, 20);
            });
        }

        if (this.worldConfig.decorations.bushes) {
            this.worldConfig.decorations.bushes.forEach(bush => {
                const color = parseInt(bush.color.replace('#', '0x'));
                graphics.fillStyle(color, 1);
                graphics.fillCircle(bush.x, bush.y, bush.size);
            });
        }
    }

    createCollisionBodies() {
        if (!this.collisionMatrix) return;

        if (this.collisionMatrix.buildings) {
            this.collisionMatrix.buildings.forEach(building => {
                this.createBuildingCollision(building);
            });
        }

        if (this.collisionMatrix.customZones) {
            this.collisionMatrix.customZones.forEach(zone => {
                if (zone.matrix) {
                    this.createZoneCollision(zone);
                }
            });
        }
    }

    createBuildingCollision(buildingData) {
        const { startTile, matrix } = buildingData;
        const startX = startTile.col * this.tileSize;
        const startY = startTile.row * this.tileSize;

        matrix.forEach((row, rowIndex) => {
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                if (row[colIndex] === '0') {
                    const x = startX + (colIndex * this.tileSize) + (this.tileSize / 2);
                    const y = startY + (rowIndex * this.tileSize) + (this.tileSize / 2);

                    const collisionBody = this.scene.add.rectangle(
                        x, y,
                        this.tileSize,
                        this.tileSize,
                        0xff0000,
                        0
                    );

                    this.scene.physics.add.existing(collisionBody, true);
                    collisionBody.setVisible(false);

                    if (this.scene.collisionBodies) {
                        this.scene.collisionBodies.push(collisionBody);
                    }
                }
            }
        });
    }

    createZoneCollision(zoneData) {
        const { startTile, matrix } = zoneData;
        const startX = startTile.col * this.tileSize;
        const startY = startTile.row * this.tileSize;

        matrix.forEach((row, rowIndex) => {
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                if (row[colIndex] === '0') {
                    const x = startX + (colIndex * this.tileSize) + (this.tileSize / 2);
                    const y = startY + (rowIndex * this.tileSize) + (this.tileSize / 2);

                    const collisionBody = this.scene.add.rectangle(
                        x, y,
                        this.tileSize,
                        this.tileSize,
                        0xff0000,
                        0
                    );

                    this.scene.physics.add.existing(collisionBody, true);
                    collisionBody.setVisible(false);

                    if (this.scene.collisionBodies) {
                        this.scene.collisionBodies.push(collisionBody);
                    }
                }
            }
        });
    }

    getBuildingEntrances() {
        const entrances = [];

        if (!this.collisionMatrix || !this.collisionMatrix.buildings) {
            return entrances;
        }

        this.collisionMatrix.buildings.forEach(building => {
            const { startTile, matrix } = building;
            const rows = matrix.length;
            const cols = matrix[0].length;

            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                for (let colIndex = 0; colIndex < cols; colIndex++) {
                    if (matrix[rowIndex][colIndex] === '1') {
                        const worldX = (startTile.col + colIndex) * this.tileSize + (this.tileSize / 2);
                        const worldY = (startTile.row + rowIndex) * this.tileSize + (this.tileSize / 2);

                        entrances.push({
                            buildingId: building.id,
                            buildingName: building.name,
                            x: worldX,
                            y: worldY,
                            tileCol: startTile.col + colIndex,
                            tileRow: startTile.row + rowIndex
                        });
                    }
                }
            }
        });

        return entrances;
    }

    getWorldBounds() {
        if (!this.worldConfig) return { width: 4000, height: 4000 };
        return {
            width: this.worldConfig.dimensions.width,
            height: this.worldConfig.dimensions.height
        };
    }
}
