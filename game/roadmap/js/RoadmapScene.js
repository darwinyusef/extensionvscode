class RoadmapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RoadmapScene' });
        this.roadmapData = null;
        this.nodeManager = null;
        this.playerController = null;
        this.cameraController = null;
        this.modalManager = null;
    }

    preload() {
        this.load.image('vaquero', 'vaquero.gif');
        this.load.json('roadmap', 'roadmap.json');
    }

    create() {
        this.roadmapData = this.cache.json.get('roadmap');
        this.makeBidirectionalConnections();

        this.modalManager = new ModalManager();
        this.nodeManager = new NodeManager(this, this.roadmapData);
        this.playerController = new PlayerController(this, 'html');
        this.cameraController = new CameraController(this);
    }

    makeBidirectionalConnections() {
        const connectionsMap = new Map();

        this.roadmapData.nodes.forEach(node => {
            if (!connectionsMap.has(node.id)) {
                connectionsMap.set(node.id, new Set(node.connections || []));
            }

            if (node.connections) {
                node.connections.forEach(targetId => {
                    if (!connectionsMap.has(targetId)) {
                        connectionsMap.set(targetId, new Set());
                    }
                    connectionsMap.get(targetId).add(node.id);
                });
            }
        });

        this.roadmapData.nodes.forEach(node => {
            node.connections = Array.from(connectionsMap.get(node.id) || []);
        });
    }

    update() {
        this.playerController.update();
    }
}
