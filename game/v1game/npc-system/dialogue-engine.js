class DialogueEngine {
    constructor(scene) {
        this.scene = scene;
        this.dialogues = new Map();
        this.currentDialogue = null;
        this.currentNodeIndex = 0;
        this.isActive = false;
    }

    async loadDialogue(npcId, dialogueData) {
        this.dialogues.set(npcId, dialogueData);
    }

    async loadDialogueFromJSON(npcId, jsonPath) {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            this.dialogues.set(npcId, data);
            return data;
        } catch (error) {
            console.error(`Error loading dialogue for ${npcId}:`, error);
            return null;
        }
    }

    getAvailableDialogue(npcId, context) {
        const npcDialogues = this.dialogues.get(npcId);
        if (!npcDialogues || !npcDialogues.dialogues) return null;

        for (const dialogue of npcDialogues.dialogues) {
            if (this.checkTrigger(dialogue, context)) {
                if (!dialogue.requirements || this.checkRequirements(dialogue.requirements, context)) {
                    return dialogue;
                }
            }
        }

        return npcDialogues.dialogues.find(d => d.id === 'default') || null;
    }

    checkTrigger(dialogue, context) {
        if (!dialogue.trigger) return true;

        switch (dialogue.trigger) {
            case 'first_interaction':
                return context.conversationCount === 0;
            case 'manual':
                return true;
            case 'quest_complete':
                return context.lastQuestCompleted === dialogue.quest_id;
            default:
                return true;
        }
    }

    checkRequirements(requirements, context) {
        if (requirements.friendship && context.friendship < requirements.friendship) {
            return false;
        }

        if (requirements.level && context.playerLevel < requirements.level) {
            return false;
        }

        if (requirements.skill_html && (!context.playerSkills || context.playerSkills.html < requirements.skill_html)) {
            return false;
        }

        return true;
    }

    start(dialogue, npc, ui, context) {
        if (!dialogue || !dialogue.nodes || dialogue.nodes.length === 0) {
            console.error('Invalid dialogue data');
            return;
        }

        this.currentDialogue = dialogue;
        this.currentNPC = npc;
        this.currentUI = ui;
        this.context = context;
        this.isActive = true;
        this.currentNodeIndex = 0;

        this.showNode(dialogue.nodes[0]);
    }

    showNode(node) {
        if (!node || !this.currentUI) {
            console.error('Invalid node or UI');
            return;
        }

        const npcData = {
            name: this.currentNPC.npcName,
            sprite: this.currentNPC.sprite,
            emotion: node.emotion || 'neutral'
        };

        this.currentUI.showDialogue(
            npcData,
            node.text,
            node.choices || [],
            (choice) => this.handleChoice(node, choice)
        );

        if (this.currentNPC.mouthAnimator) {
            const duration = node.text.length * 50;
            this.currentNPC.mouthAnimator.startTalking(node.text, duration);
        }
    }

    handleChoice(currentNode, choice) {
        if (choice.friendship) {
            this.currentNPC.addFriendship(choice.friendship);
        }

        if (choice.reward) {
            this.applyReward(choice.reward);
        }

        if (choice.action) {
            this.handleAction(choice.action, choice);
        }

        if (choice.next === 'end') {
            this.end();
        } else {
            const nextNode = this.findNode(choice.next);
            if (nextNode) {
                this.showNode(nextNode);
            } else {
                this.end();
            }
        }
    }

    findNode(nodeId) {
        if (!this.currentDialogue || !this.currentDialogue.nodes) return null;
        return this.currentDialogue.nodes.find(n => n.id === nodeId);
    }

    handleAction(action, choice) {
        switch (action) {
            case 'give_quest':
                if (choice.quest_id) {
                    this.currentNPC.giveQuest(choice.quest_id);
                    this.scene.events.emit('quest_given', choice.quest_id, this.currentNPC.id);
                }
                break;
            case 'unlock_dialogue':
                if (choice.dialogue_id) {
                    this.currentNPC.unlockDialogue(choice.dialogue_id);
                }
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    applyReward(reward) {
        if (reward.xp) {
            this.scene.events.emit('add_xp', reward.xp);
        }

        if (reward.item) {
            this.scene.events.emit('add_item', reward.item);
        }

        if (reward.skill_points) {
            this.scene.events.emit('add_skill_points', reward.skill_points);
        }
    }

    end() {
        if (this.currentNPC && this.currentNPC.mouthAnimator) {
            this.currentNPC.mouthAnimator.stopTalking();
        }

        if (this.currentUI) {
            this.currentUI.hideDialogue();
        }

        this.currentNPC.incrementConversationCount();

        this.isActive = false;
        this.currentDialogue = null;
        this.currentNodeIndex = 0;
        this.currentNPC = null;
        this.currentUI = null;
    }

    isDialogueActive() {
        return this.isActive;
    }
}
