class NPCLoader {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
    }

    async loadNPCs(indexPath) {
        try {
            const response = await fetch(indexPath);
            const index = await response.json();

            for (const npcRef of index.npcs) {
                const npcData = await this.loadNPCData(npcRef.file);
                if (npcData) {
                    const npc = this.createNPC(npcData);
                    this.npcs.push(npc);
                }
            }

            return this.npcs;
        } catch (error) {
            console.error('Error loading NPCs:', error);
            return [];
        }
    }

    async loadNPCData(filePath) {
        try {
            const response = await fetch(filePath);
            return await response.json();
        } catch (error) {
            console.error(`Error loading NPC from ${filePath}:`, error);
            return null;
        }
    }

    createNPC(data) {
        const npcData = {
            id: data.id,
            name: data.name,
            role: data.role,
            personality: data.personality,
            specialty: data.specialty,
            x: data.position.x,
            y: data.position.y,
            sprite: this.getSpriteKey(data),
            unlockedDialogues: data.unlockedDialogues || ['first_meeting']
        };

        const npc = new NPC(this.scene, npcData);

        if (data.relationship) {
            const savedRelationship = this.loadSavedRelationship(data.id);
            if (savedRelationship) {
                npc.setRelationship(savedRelationship);
            } else {
                npc.setRelationship(data.relationship);
            }
        }

        if (data.sprite.type === 'svg') {
            this.createSVGSprite(npc, data.sprite);
        } else if (data.sprite.type === 'image') {
            this.loadImageSprite(npc, data.sprite);
        }

        return npc;
    }

    getSpriteKey(data) {
        if (data.sprite.type === 'image' && data.sprite.src) {
            return data.sprite.src;
        }
        return `npc_${data.id}`;
    }

    createSVGSprite(npc, spriteConfig) {
        const color = parseInt(spriteConfig.color.replace('#', '0x'));
        const size = spriteConfig.size || 80;

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, size / 2);

        graphics.generateTexture(`npc_${npc.id}`, size, size);
        graphics.destroy();

        if (npc.npcSprite) {
            npc.npcSprite.setTexture(`npc_${npc.id}`);
        }
    }

    loadImageSprite(npc, spriteConfig) {
        if (spriteConfig.src) {
            this.scene.load.image(`npc_${npc.id}`, spriteConfig.src);
            this.scene.load.once('complete', () => {
                if (npc.npcSprite) {
                    npc.npcSprite.setTexture(`npc_${npc.id}`);
                    if (spriteConfig.width && spriteConfig.height) {
                        npc.npcSprite.setDisplaySize(spriteConfig.width, spriteConfig.height);
                    }
                }
            });
            this.scene.load.start();
        }
    }

    loadSavedRelationship(npcId) {
        const savedData = localStorage.getItem(`npc_relationship_${npcId}`);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (error) {
                console.error('Error parsing saved relationship:', error);
                return null;
            }
        }
        return null;
    }

    saveRelationship(npc) {
        const relationship = npc.getRelationship();
        localStorage.setItem(`npc_relationship_${npc.id}`, JSON.stringify(relationship));
    }

    getNPCById(id) {
        return this.npcs.find(npc => npc.id === id);
    }

    getAllNPCs() {
        return this.npcs;
    }

    saveAllRelationships() {
        this.npcs.forEach(npc => {
            this.saveRelationship(npc);
        });
    }
}
