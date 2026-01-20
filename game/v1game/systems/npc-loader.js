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
            unlockedDialogues: data.unlockedDialogues || ['first_meeting'],
            maxHP: data.maxHP,
            rewards: data.rewards
        };

        const npc = new NPC(this.scene, npcData);

        // Create specialized behavior based on NPC type
        npc.npcType = data.type || 'questioner';

        switch (npc.npcType) {
            case 'king':
                npc.specialBehavior = new NPCKing(this.scene, npc);
                break;
            case 'storyteller':
                npc.specialBehavior = new NPCStoryteller(this.scene, npc);
                break;
            case 'motivator':
                npc.specialBehavior = new NPCMotivator(this.scene, npc);
                break;
            case 'enemy':
                npc.specialBehavior = new NPCEnemy(this.scene, npc);
                break;
            case 'healer':
                npc.specialBehavior = new NPCHealer(this.scene, npc);
                break;
            case 'questioner':
            default:
                // Original behavior - uses task manager
                npc.specialBehavior = null;
                break;
        }

        if (data.relationship) {
            const savedRelationship = this.loadSavedRelationship(data.id);
            if (savedRelationship) {
                npc.setRelationship(savedRelationship);
            } else {
                npc.setRelationship(data.relationship);
            }
        }

        if (data.sprite.type === 'svg' || data.sprite.type === 'circle') {
            this.createCircleSprite(npc, data.sprite);
        } else if (data.sprite.type === 'image') {
            this.loadImageSprite(npc, data.sprite);
        }

        // Add click handler for specialized NPCs
        if (npc.specialBehavior) {
            npc.npcSprite.off('pointerdown'); // Remove default handler
            npc.npcSprite.on('pointerdown', () => {
                this.handleSpecializedNPCClick(npc);
            });
        }

        return npc;
    }

    handleSpecializedNPCClick(npc) {
        // Store current NPC globally for the specialized UI
        switch (npc.npcType) {
            case 'king':
                window.currentKingNPC = npc.specialBehavior;
                break;
            case 'storyteller':
                window.currentStoryteller = npc.specialBehavior;
                break;
            case 'motivator':
                window.currentMotivator = npc.specialBehavior;
                break;
            case 'enemy':
                window.currentEnemy = npc.specialBehavior;
                break;
            case 'healer':
                window.currentHealer = npc.specialBehavior;
                break;
        }

        // Call the interact method
        if (npc.specialBehavior && npc.specialBehavior.interact) {
            npc.specialBehavior.interact();
        }
    }

    getSpriteKey(data) {
        if (data.sprite.type === 'image' && data.sprite.src) {
            return data.sprite.src;
        }
        return `npc_${data.id}`;
    }

    createCircleSprite(npc, spriteConfig) {
        const color = parseInt(spriteConfig.color.replace('#', '0x'));
        const size = spriteConfig.size || 80;

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, size / 2);

        graphics.generateTexture(`npc_${npc.id}`, size, size);
        graphics.destroy();

        if (npc.npcSprite) {
            npc.npcSprite.setTexture(`npc_${npc.id}`);

            // Add emoji if present
            if (spriteConfig.emoji) {
                const emojiText = this.scene.add.text(0, 0, spriteConfig.emoji, {
                    fontSize: `${size * 0.6}px`,
                    align: 'center'
                });
                emojiText.setOrigin(0.5, 0.5);
                npc.add(emojiText);
            }
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

    getClosestNPC(x, y, maxDistance) {
        let closestNPC = null;
        let closestDistance = maxDistance;

        this.npcs.forEach(npc => {
            const distance = Phaser.Math.Distance.Between(x, y, npc.x, npc.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestNPC = npc;
            }
        });

        return closestNPC;
    }

    update() {
        this.npcs.forEach(npc => {
            if (npc.update) {
                npc.update();
            }
        });
    }

    saveAllRelationships() {
        this.npcs.forEach(npc => {
            this.saveRelationship(npc);
        });
    }
}
