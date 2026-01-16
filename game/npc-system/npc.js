class NPC extends Phaser.GameObjects.Container {
    constructor(scene, data) {
        super(scene, data.x, data.y);
        scene.add.existing(this);

        this.id = data.id;
        this.npcName = data.name;
        this.role = data.role;
        this.personality = data.personality;
        this.specialty = data.specialty;
        this.sprite = data.sprite;

        this.friendship = 0;
        this.conversationCount = 0;
        this.questsGiven = [];
        this.questsCompleted = [];
        this.unlockedDialogues = data.unlockedDialogues || ['first_meeting'];
        this.lastInteraction = null;

        this.createSprite(data);
        this.createInteractIndicator();

        // NO usar setSize para evitar bloquear clicks
        // Solo el sprite individual será interactivo
        this.setDepth(500); // Aumentado para estar visible sobre todo
    }

    createSprite(data) {
        const spriteKey = data.sprite || 'npc_default';
        this.npcSprite = this.scene.add.sprite(0, 0, spriteKey);
        this.npcSprite.setDisplaySize(80, 80);

        // Hacer el sprite interactivo con área de click EXACTA
        this.npcSprite.setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
            alphaTolerance: 1
        });
        this.npcSprite.npcData = this;

        const shadow = this.scene.add.ellipse(0, 45, 60, 20, 0x000000, 0.4);
        shadow.setDepth(-1); // Sombra detrás

        this.add([shadow, this.npcSprite]);

        this.scene.tweens.add({
            targets: this.npcSprite,
            y: -5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createInteractIndicator() {
        this.interactIndicator = this.scene.add.text(0, -60, '[E]', {
            fontSize: '16px',
            color: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 }
        });
        this.interactIndicator.setOrigin(0.5);
        this.interactIndicator.setVisible(false);
        this.add(this.interactIndicator);
    }

    showInteractIndicator() {
        this.interactIndicator.setVisible(true);
        this.scene.tweens.add({
            targets: this.interactIndicator,
            y: -70,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    hideInteractIndicator() {
        this.interactIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(this.interactIndicator);
        this.interactIndicator.y = -60;
    }

    addFriendship(amount) {
        this.friendship = Math.max(0, Math.min(100, this.friendship + amount));

        if (amount > 0) {
            this.showHeartParticles();
        } else if (amount < 0) {
            this.showNegativeParticles();
        }
    }

    showHeartParticles() {
        const heart = this.scene.add.text(this.x, this.y - 30, '❤️', {
            fontSize: '24px'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: heart,
            y: this.y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => heart.destroy()
        });
    }

    showNegativeParticles() {
        const icon = this.scene.add.text(this.x, this.y - 30, '💔', {
            fontSize: '24px'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: icon,
            y: this.y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => icon.destroy()
        });
    }

    getRelationshipLevel() {
        if (this.friendship >= 80) return 'Mejor Amigo';
        if (this.friendship >= 60) return 'Buen Amigo';
        if (this.friendship >= 40) return 'Amigo';
        if (this.friendship >= 20) return 'Conocido';
        return 'Desconocido';
    }

    getRelationship() {
        return {
            id: this.id,
            name: this.npcName,
            friendship: this.friendship,
            relationshipLevel: this.getRelationshipLevel(),
            conversationCount: this.conversationCount,
            questsGiven: this.questsGiven,
            questsCompleted: this.questsCompleted,
            unlockedDialogues: this.unlockedDialogues,
            lastInteraction: this.lastInteraction
        };
    }

    setRelationship(data) {
        if (!data) return;

        this.friendship = data.friendship || 0;
        this.conversationCount = data.conversationCount || 0;
        this.questsGiven = data.questsGiven || [];
        this.questsCompleted = data.questsCompleted || [];
        this.unlockedDialogues = data.unlockedDialogues || ['first_meeting'];
        this.lastInteraction = data.lastInteraction || null;
    }

    incrementConversationCount() {
        this.conversationCount++;
        this.lastInteraction = Date.now();
    }

    unlockDialogue(dialogueId) {
        if (!this.unlockedDialogues.includes(dialogueId)) {
            this.unlockedDialogues.push(dialogueId);
            return true;
        }
        return false;
    }

    giveQuest(questId) {
        if (!this.questsGiven.includes(questId)) {
            this.questsGiven.push(questId);
            return true;
        }
        return false;
    }

    completeQuest(questId) {
        if (this.questsGiven.includes(questId) && !this.questsCompleted.includes(questId)) {
            this.questsCompleted.push(questId);
            return true;
        }
        return false;
    }
}
