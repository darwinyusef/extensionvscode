class CameraController {
    constructor(scene) {
        this.scene = scene;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.setupCamera();
        this.setupControls();
    }

    setupCamera() {
        this.scene.cameras.main.setBounds(0, 0, 2000, 1500);
        this.scene.cameras.main.setZoom(0.8);
        this.scene.cameras.main.centerOn(800, 500);
    }

    setupControls() {
        this.setupZoom();
        this.setupDrag();
        this.setupKeyboardZoom();
    }

    setupKeyboardZoom() {
        this.scene.input.keyboard.on('keydown-PLUS', () => this.zoomIn());
        this.scene.input.keyboard.on('keydown-MINUS', () => this.zoomOut());
        this.scene.input.keyboard.on('keydown-NUMPAD_ADD', () => this.zoomIn());
        this.scene.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this.zoomOut());
    }

    zoomIn() {
        const currentZoom = this.scene.cameras.main.zoom;
        const newZoom = Phaser.Math.Clamp(currentZoom * 1.2, 0.3, 2.5);
        this.scene.cameras.main.setZoom(newZoom);
    }

    zoomOut() {
        const currentZoom = this.scene.cameras.main.zoom;
        const newZoom = Phaser.Math.Clamp(currentZoom * 0.8, 0.3, 2.5);
        this.scene.cameras.main.setZoom(newZoom);
    }

    setupZoom() {
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const currentZoom = this.scene.cameras.main.zoom;
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Phaser.Math.Clamp(currentZoom * zoomFactor, 0.3, 2.5);

            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

            this.scene.cameras.main.setZoom(newZoom);

            const newWorldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.scene.cameras.main.scrollX += worldPoint.x - newWorldPoint.x;
            this.scene.cameras.main.scrollY += worldPoint.y - newWorldPoint.y;
        });
    }

    setupDrag() {
        this.scene.input.on('pointerdown', (pointer) => {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const clickedNode = this.checkNodeClick(worldPoint);

            if (clickedNode) {
                if (pointer.rightButtonDown()) {
                    this.scene.modalManager.showModal(clickedNode.data);
                } else {
                    const currentNode = this.scene.playerController.currentNodeId;
                    const currentConnections = this.scene.nodeManager.nodeObjects[currentNode].data.connections;

                    if (pointer.button === 1) {
                        this.scene.modalManager.showModal(clickedNode.data);
                    } else if (currentConnections && currentConnections.includes(clickedNode.data.id)) {
                        this.scene.playerController.jumpToNode(clickedNode.data.id);
                    } else {
                        this.scene.modalManager.showModal(clickedNode.data);
                    }
                }
            } else {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const deltaX = pointer.x - this.dragStartX;
                const deltaY = pointer.y - this.dragStartY;

                this.scene.cameras.main.scrollX -= deltaX / this.scene.cameras.main.zoom;
                this.scene.cameras.main.scrollY -= deltaY / this.scene.cameras.main.zoom;

                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        });

        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }

    checkNodeClick(worldPoint) {
        let clickedNode = null;
        let minDistance = Infinity;

        Object.entries(this.scene.nodeManager.nodeObjects).forEach(([nodeId, nodeData]) => {
            const distance = Phaser.Math.Distance.Between(
                worldPoint.x,
                worldPoint.y,
                nodeData.container.x,
                nodeData.container.y
            );

            if (distance < 50 && distance < minDistance) {
                minDistance = distance;
                clickedNode = nodeData;
            }
        });

        return clickedNode;
    }
}
