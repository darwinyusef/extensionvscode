class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.dialogueEngine = new DialogueEngine(scene);
        this.relationshipManager = new RelationshipManager();
        this.dialogueUI = null;
        this.activeNPC = null;
    }

    setDialogueUI(ui) {
        this.dialogueUI = ui;
    }

    async loadNPCs(npcDataPath) {
        try {
            const response = await fetch(npcDataPath);
            const npcData = await response.json();

            for (const data of npcData.npcs) {
                await this.createNPC(data);
            }

            console.log(`Loaded ${this.npcs.size} NPCs`);
        } catch (error) {
            console.error('Error loading NPCs:', error);
        }
    }

    async createNPC(data) {
        const npc = new NPC(this.scene, data);

        const relationship = this.relationshipManager.load(data.id);
        npc.setRelationship(relationship);

        npc.mouthAnimator = new MouthAnimator(this.scene, npc);

        // Configurar eventos en el SPRITE del NPC
        // Usar pointerdown para no interferir con el drag del mapa
        npc.npcSprite.on('pointerdown', (pointer, localX, localY, event) => {
            // Detener propagación para evitar que active el drag del mapa
            event.stopPropagation();
            this.interact(data.id);
        });

        npc.npcSprite.on('pointerover', () => {
            npc.showInteractIndicator();
        });

        npc.npcSprite.on('pointerout', () => {
            npc.hideInteractIndicator();
        });

        this.npcs.set(data.id, npc);

        if (data.dialogueFile) {
            await this.dialogueEngine.loadDialogueFromJSON(data.id, data.dialogueFile);
        }

        return npc;
    }

    getNPC(id) {
        return this.npcs.get(id);
    }

    getAllNPCs() {
        return Array.from(this.npcs.values());
    }

    async interact(npcId) {
        const npc = this.getNPC(npcId);
        if (!npc || !this.dialogueUI) {
            console.error('NPC or UI not found');
            return;
        }

        if (this.dialogueEngine.isDialogueActive()) {
            return;
        }

        this.activeNPC = npc;

        const context = this.buildContext(npc);
        const dialogue = this.dialogueEngine.getAvailableDialogue(npcId, context);

        if (dialogue) {
            this.dialogueEngine.start(dialogue, npc, this.dialogueUI, context);
        } else {
            console.warn(`No dialogue available for NPC: ${npcId}`);
            this.showDefaultMessage(npc);
        }

        this.relationshipManager.save(npcId, npc.getRelationship());
    }

    buildContext(npc) {
        return {
            friendship: npc.friendship,
            conversationCount: npc.conversationCount,
            playerLevel: this.scene.playerLevel || 1,
            playerSkills: this.scene.playerSkills || { html: 0, css: 0, javascript: 0 },
            currentLearningTopic: this.scene.currentTopic || 'html',
            lastQuestCompleted: this.scene.lastQuestCompleted || null,
            currentChallenge: this.scene.currentChallenge || null
        };
    }

    showDefaultMessage(npc) {
        if (!this.dialogueUI) return;

        const defaultDialogue = {
            nodes: [{
                id: 'default',
                speaker: npc.id,
                text: '¡Hola! Soy ' + npc.npcName + '. ' + npc.role,
                emotion: 'neutral',
                choices: []
            }]
        };

        this.dialogueEngine.start(defaultDialogue, npc, this.dialogueUI, this.buildContext(npc));
    }

    update() {
        this.npcs.forEach(npc => {
            if (npc.mouthAnimator) {
                npc.mouthAnimator.update();
            }
        });
    }

    checkProximity(playerX, playerY, radius = 100) {
        const nearbyNPCs = [];

        this.npcs.forEach((npc) => {
            const distance = Phaser.Math.Distance.Between(playerX, playerY, npc.x, npc.y);

            if (distance < radius) {
                nearbyNPCs.push({ npc, distance });
                npc.showInteractIndicator();
            } else {
                npc.hideInteractIndicator();
            }
        });

        return nearbyNPCs.sort((a, b) => a.distance - b.distance);
    }

    getClosestNPC(playerX, playerY, maxRadius = 100) {
        let closest = null;
        let minDistance = maxRadius;

        this.npcs.forEach((npc) => {
            const distance = Phaser.Math.Distance.Between(playerX, playerY, npc.x, npc.y);

            if (distance < minDistance) {
                minDistance = distance;
                closest = npc;
            }
        });

        return closest;
    }

    saveAllRelationships() {
        this.npcs.forEach((npc) => {
            this.relationshipManager.save(npc.id, npc.getRelationship());
        });
    }

    getTotalNPCsMet() {
        return this.relationshipManager.getTotalNPCsMet();
    }

    getBestFriends(limit = 5) {
        return this.relationshipManager.getBestFriends(limit);
    }

    destroy() {
        this.npcs.forEach(npc => {
            if (npc.mouthAnimator) {
                npc.mouthAnimator.destroy();
            }
            npc.destroy();
        });

        this.npcs.clear();
        this.saveAllRelationships();
    }
}
