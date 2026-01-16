class BuildingLoader {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.tileSize = 40;
    }

    async loadBuildings(indexPath) {
        try {
            const response = await fetch(indexPath);
            const index = await response.json();

            for (const buildingRef of index.buildings) {
                const buildingData = await this.loadBuildingData(buildingRef.file);
                if (buildingData) {
                    this.createBuilding(buildingData);
                }
            }

            return this.buildings;
        } catch (error) {
            console.error('Error loading buildings:', error);
            return [];
        }
    }

    async loadBuildingData(filePath) {
        try {
            const response = await fetch(filePath);
            return await response.json();
        } catch (error) {
            console.error(`Error loading building from ${filePath}:`, error);
            return null;
        }
    }

    createBuilding(data) {
        const worldX = data.position.tileCol * this.tileSize;
        const worldY = data.position.tileRow * this.tileSize;

        const buildingContainer = this.scene.add.container(worldX, worldY);
        buildingContainer.setDepth(200);

        if (data.visual.type === 'rectangle') {
            this.createRectangleBuilding(buildingContainer, data);
        } else if (data.visual.type === 'image' && data.visual.src) {
            this.createImageBuilding(buildingContainer, data);
        }

        if (data.hasInterior) {
            this.createEntranceIndicator(buildingContainer, data);
        }

        const buildingInfo = {
            id: data.id,
            name: data.name,
            container: buildingContainer,
            hasInterior: data.hasInterior,
            interiorConfig: data.interiorConfig,
            entrance: this.calculateEntrancePosition(data)
        };

        this.buildings.push(buildingInfo);

        return buildingInfo;
    }

    createRectangleBuilding(container, data) {
        const visual = data.visual;
        const width = visual.width;
        const height = visual.height;

        const roofHeight = 40;
        const roof = this.scene.add.polygon(
            width / 2, 0,
            [0, roofHeight, width / 2, -10, width, roofHeight],
            parseInt(visual.roofColor.replace('#', '0x'))
        );

        const wallColor = parseInt(visual.color.replace('#', '0x'));
        const walls = this.scene.add.rectangle(
            width / 2,
            roofHeight + (height - roofHeight) / 2,
            width,
            height - roofHeight,
            wallColor
        );

        container.add([roof, walls]);

        if (visual.windowColor) {
            this.createWindows(container, data);
        }
    }

    createWindows(container, data) {
        const visual = data.visual;
        const windowColor = parseInt(visual.windowColor.replace('#', '0x'));

        if (visual.windowsGrid) {
            const grid = visual.windowsGrid;
            const startY = 60;
            const startX = 40;

            for (let row = 0; row < grid.rows; row++) {
                for (let col = 0; col < grid.cols; col++) {
                    const x = startX + col * (grid.windowWidth + grid.spacing);
                    const y = startY + row * (grid.windowHeight + grid.spacing);

                    const window = this.scene.add.rectangle(
                        x, y,
                        grid.windowWidth,
                        grid.windowHeight,
                        windowColor
                    );
                    container.add(window);
                }
            }
        } else {
            const window1 = this.scene.add.rectangle(60, 80, 30, 40, windowColor);
            const window2 = this.scene.add.rectangle(visual.width - 60, 80, 30, 40, windowColor);
            container.add([window1, window2]);
        }
    }

    createImageBuilding(container, data) {
        const sprite = this.scene.add.image(0, 0, data.visual.src);
        sprite.setDisplaySize(data.visual.width, data.visual.height);
        sprite.setOrigin(0, 0);
        container.add(sprite);
    }

    createEntranceIndicator(container, data) {
        const entrance = this.calculateEntrancePosition(data);
        const localX = entrance.offsetX;
        const localY = entrance.offsetY;

        const door = this.scene.add.rectangle(
            localX,
            localY,
            data.entrance.width,
            20,
            0x654321
        );

        const doorknob = this.scene.add.circle(
            localX + 20,
            localY,
            5,
            0xffd700
        );

        const doorIcon = this.scene.add.text(localX, localY - 30, '🚪', {
            fontSize: '24px'
        }).setOrigin(0.5);

        container.add([door, doorknob, doorIcon]);
    }

    calculateEntrancePosition(data) {
        const matrix = data.collisionMatrix;
        const visual = data.visual;

        for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
            for (let colIndex = 0; colIndex < matrix[rowIndex].length; colIndex++) {
                if (matrix[rowIndex][colIndex] === '1') {
                    return {
                        worldX: (data.position.tileCol + colIndex) * this.tileSize + (this.tileSize / 2),
                        worldY: (data.position.tileRow + rowIndex) * this.tileSize + (this.tileSize / 2),
                        offsetX: colIndex * this.tileSize + (this.tileSize / 2),
                        offsetY: rowIndex * this.tileSize + (this.tileSize / 2)
                    };
                }
            }
        }

        return {
            worldX: data.position.tileCol * this.tileSize + visual.width / 2,
            worldY: data.position.tileRow * this.tileSize + visual.height,
            offsetX: visual.width / 2,
            offsetY: visual.height
        };
    }

    getBuildingById(id) {
        return this.buildings.find(b => b.id === id);
    }

    getBuildingsWithInteriors() {
        return this.buildings.filter(b => b.hasInterior);
    }
}
