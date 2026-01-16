class RelationshipManager {
    constructor() {
        this.relationships = new Map();
        this.storageKey = 'npc_relationships';
        this.loadAll();
    }

    load(npcId) {
        if (this.relationships.has(npcId)) {
            return this.relationships.get(npcId);
        }

        return this.createDefaultRelationship(npcId);
    }

    loadAll() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                Object.keys(parsed).forEach(key => {
                    this.relationships.set(key, parsed[key]);
                });
            }
        } catch (error) {
            console.error('Error loading relationships:', error);
        }
    }

    save(npcId, relationshipData) {
        this.relationships.set(npcId, relationshipData);
        this.saveAll();
    }

    saveAll() {
        try {
            const dataToSave = {};
            this.relationships.forEach((value, key) => {
                dataToSave[key] = value;
            });
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving relationships:', error);
        }
    }

    createDefaultRelationship(npcId) {
        return {
            id: npcId,
            friendship: 0,
            conversationCount: 0,
            questsGiven: [],
            questsCompleted: [],
            unlockedDialogues: ['first_meeting'],
            lastInteraction: null
        };
    }

    getAll() {
        const allRelationships = [];
        this.relationships.forEach((value) => {
            allRelationships.push(value);
        });
        return allRelationships;
    }

    getTotalNPCsMet() {
        return Array.from(this.relationships.values()).filter(r => r.conversationCount > 0).length;
    }

    getBestFriends(limit = 5) {
        return Array.from(this.relationships.values())
            .sort((a, b) => b.friendship - a.friendship)
            .slice(0, limit);
    }

    resetRelationship(npcId) {
        const defaultRel = this.createDefaultRelationship(npcId);
        this.relationships.set(npcId, defaultRel);
        this.saveAll();
        return defaultRel;
    }

    resetAll() {
        this.relationships.clear();
        localStorage.removeItem(this.storageKey);
    }
}
