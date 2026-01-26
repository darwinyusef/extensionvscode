class NodeManager {
    constructor(scene, roadmapData) {
        this.scene = scene;
        this.roadmapData = roadmapData;
        this.nodeObjects = {};
        this.connectionLines = this.scene.add.graphics();
        this.connectionLines.setDepth(0);
        this.highlightGraphics = this.scene.add.graphics();
        this.highlightGraphics.setDepth(9);
        this.drawConnections();
        this.createNodes();
    }

    highlightConnectedNodes(currentNodeId) {
        this.highlightGraphics.clear();

        const currentNode = this.nodeObjects[currentNodeId];
        if (!currentNode || !currentNode.data.connections) return;

        currentNode.data.connections.forEach(connId => {
            const connNode = this.nodeObjects[connId];
            if (connNode) {
                this.highlightGraphics.lineStyle(4, 0x10b981, 0.6);
                this.highlightGraphics.strokeCircle(connNode.container.x, connNode.container.y, 40);

                this.highlightGraphics.fillStyle(0x10b981, 0.15);
                this.highlightGraphics.fillCircle(connNode.container.x, connNode.container.y, 40);
            }
        });
    }

    drawConnections() {
        this.connectionLines.clear();

        this.roadmapData.nodes.forEach(node => {
            if (node.connections) {
                node.connections.forEach(targetId => {
                    const targetNode = this.roadmapData.nodes.find(n => n.id === targetId);
                    if (targetNode) {
                        const distance = Phaser.Math.Distance.Between(node.x, node.y, targetNode.x, targetNode.y);
                        const dashLength = 8;
                        const gapLength = 6;
                        const numDashes = Math.floor(distance / (dashLength + gapLength));

                        for (let i = 0; i < numDashes; i++) {
                            const startRatio = (i * (dashLength + gapLength)) / distance;
                            const endRatio = ((i * (dashLength + gapLength)) + dashLength) / distance;

                            const startX = node.x + (targetNode.x - node.x) * startRatio;
                            const startY = node.y + (targetNode.y - node.y) * startRatio;
                            const endX = node.x + (targetNode.x - node.x) * endRatio;
                            const endY = node.y + (targetNode.y - node.y) * endRatio;

                            this.connectionLines.lineStyle(2, 0xcccccc, 0.25);
                            this.connectionLines.beginPath();
                            this.connectionLines.moveTo(startX, startY);
                            this.connectionLines.lineTo(endX, endY);
                            this.connectionLines.strokePath();
                        }
                    }
                });
            }
        });
    }

    createNodes() {
        this.roadmapData.nodes.forEach(node => {
            const nodeContainer = this.scene.add.container(node.x, node.y);
            nodeContainer.setDepth(10);

            const iconElement = document.createElement('img');
            iconElement.src = node.icon;
            iconElement.style.width = '50px';
            iconElement.style.height = '50px';
            iconElement.style.pointerEvents = 'none';
            iconElement.style.filter = node.locked ? 'grayscale(1) opacity(0.5)' : node.active ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'none';
            iconElement.style.transition = 'all 0.3s ease';

            const iconDom = this.scene.add.dom(0, 0, iconElement);
            iconDom.setOrigin(0.5, 0.5);
            iconDom.setDepth(11);

            const text = this.scene.add.text(0, 45, node.title, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#1f2937',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5, 0.5);

            nodeContainer.add([iconDom, text]);

            const levelBadge = this.scene.add.circle(25, -25, 12, 0x3b82f6);
            levelBadge.setStrokeStyle(2, 0xffffff);
            const levelText = this.scene.add.text(25, -25, node.level.toString(), {
                fontSize: '11px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            levelText.setOrigin(0.5, 0.5);

            nodeContainer.add([levelBadge, levelText]);

            this.nodeObjects[node.id] = {
                container: nodeContainer,
                iconElement: iconElement,
                data: node
            };

            nodeContainer.setInteractive(
                new Phaser.Geom.Circle(0, 0, 40),
                Phaser.Geom.Circle.Contains
            );

            nodeContainer.on('pointerover', () => {
                iconElement.style.filter = 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) brightness(1.1)';
                iconElement.style.transform = 'scale(1.1)';
            });

            nodeContainer.on('pointerout', () => {
                iconElement.style.filter = node.locked ? 'grayscale(1) opacity(0.5)' : node.active ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'none';
                iconElement.style.transform = 'scale(1)';
            });

            nodeContainer.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown() || pointer.button === 1) {
                    this.scene.modalManager.showModal(node);
                    pointer.event.stopPropagation();
                }
            });
        });
    }
}
