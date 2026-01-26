class PlayerController {
    constructor(scene, startNodeId) {
        this.scene = scene;

        const urlNodeId = this.getNodeFromURL();
        if (urlNodeId && this.scene.nodeManager.nodeObjects[urlNodeId]) {
            this.currentNodeId = urlNodeId;
        } else {
            this.currentNodeId = startNodeId;
        }

        this.isMoving = false;

        const startNode = this.scene.nodeManager.nodeObjects[this.currentNodeId];
        this.player = this.scene.add.sprite(startNode.container.x, startNode.container.y - 60, 'vaquero');
        this.player.setScale(0.25);
        this.player.setDepth(1000);

        this.setupControls();
        this.updateHighlights();
        this.startBounceAnimation();
        this.updateURL();
    }

    getNodeFromURL() {
        const hash = window.location.hash.substring(1);
        return hash || null;
    }

    updateURL() {
        window.history.replaceState(null, '', `#${this.currentNodeId}`);
    }

    startBounceAnimation() {
        this.scene.tweens.add({
            targets: this.player,
            y: this.player.y - 8,
            duration: 600,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    updateHighlights() {
        this.scene.nodeManager.highlightConnectedNodes(this.currentNodeId);
    }

    setupControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.scene.input.keyboard.on('keydown-RIGHT', () => this.moveToNextNode('right'));
        this.scene.input.keyboard.on('keydown-LEFT', () => this.moveToNextNode('left'));
        this.scene.input.keyboard.on('keydown-UP', () => this.moveToNextNode('up'));
        this.scene.input.keyboard.on('keydown-DOWN', () => this.moveToNextNode('down'));

        this.scene.input.keyboard.on('keydown-D', () => this.moveToNextNode('right'));
        this.scene.input.keyboard.on('keydown-A', () => this.moveToNextNode('left'));
        this.scene.input.keyboard.on('keydown-W', () => this.moveToNextNode('up'));
        this.scene.input.keyboard.on('keydown-S', () => this.moveToNextNode('down'));

        this.scene.input.keyboard.on('keydown-SPACE', () => this.openCurrentNodeModal());
        this.scene.input.keyboard.on('keydown-ENTER', () => this.openCurrentNodeModal());
    }

    openCurrentNodeModal() {
        const currentNode = this.scene.nodeManager.nodeObjects[this.currentNodeId];
        if (currentNode) {
            this.scene.modalManager.showModal(currentNode.data);
        }
    }

    moveToNextNode(direction) {
        if (this.isMoving) return;

        const currentNode = this.scene.nodeManager.nodeObjects[this.currentNodeId];
        const connections = currentNode.data.connections;

        if (!connections || connections.length === 0) return;

        let targetNodeId = null;
        let bestScore = -Infinity;

        connections.forEach(connId => {
            const connNode = this.scene.nodeManager.nodeObjects[connId];
            if (!connNode) return;

            const dx = connNode.container.x - currentNode.container.x;
            const dy = connNode.container.y - currentNode.container.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let score = -Infinity;

            switch (direction) {
                case 'right':
                    if (dx > 20) {
                        score = dx / distance - Math.abs(dy) / distance * 0.3;
                    }
                    break;
                case 'left':
                    if (dx < -20) {
                        score = -dx / distance - Math.abs(dy) / distance * 0.3;
                    }
                    break;
                case 'up':
                    if (dy < -20) {
                        score = -dy / distance - Math.abs(dx) / distance * 0.3;
                    }
                    break;
                case 'down':
                    if (dy > 20) {
                        score = dy / distance - Math.abs(dx) / distance * 0.3;
                    }
                    break;
            }

            if (score > bestScore) {
                bestScore = score;
                targetNodeId = connId;
            }
        });

        if (targetNodeId && bestScore > -Infinity) {
            this.jumpToNode(targetNodeId);
        }
    }

    jumpToNode(nodeId) {
        const targetNode = this.scene.nodeManager.nodeObjects[nodeId];
        if (!targetNode) return;

        this.isMoving = true;
        this.currentNodeId = nodeId;
        this.updateURL();

        this.scene.tweens.killTweensOf(this.player);

        this.scene.tweens.add({
            targets: this.player,
            x: targetNode.container.x,
            y: targetNode.container.y - 60,
            duration: 300,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.isMoving = false;
                this.updateHighlights();
                this.startBounceAnimation();
            }
        });
    }

    update() {
    }
}
