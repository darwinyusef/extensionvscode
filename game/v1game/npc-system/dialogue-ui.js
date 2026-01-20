class DialogueUI {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.currentText = '';
        this.currentChoices = [];
        this.onChoiceCallback = null;

        this.typewriterSpeed = 30;
        this.typewriterTimer = null;
        this.currentCharIndex = 0;

        this.createUI();
    }

    createUI() {
        const width = 1000;
        const height = 250;
        const x = this.scene.cameras.main.width / 2;
        const y = this.scene.cameras.main.height - height / 2 - 20;

        this.container = this.scene.add.container(x, y);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        this.container.setVisible(false);

        const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(4, 0x00ff88);

        this.portraitBg = this.scene.add.circle(-width / 2 + 80, 0, 60, 0x0a0a0a);
        this.portraitBg.setStrokeStyle(3, 0x00ff88);

        this.portraitEmoji = this.scene.add.text(-width / 2 + 80, 0, '👤', {
            fontSize: '60px'
        }).setOrigin(0.5);

        this.nameText = this.scene.add.text(-width / 2 + 160, -height / 2 + 20, 'NPC NAME', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#00ff88'
        }).setOrigin(0, 0);

        this.friendshipBar = this.createFriendshipBar(width / 2 - 150, -height / 2 + 20);

        this.dialogueText = this.scene.add.text(-width / 2 + 160, -height / 2 + 60, '', {
            fontSize: '18px',
            color: '#ffffff',
            wordWrap: { width: width - 200 }
        }).setOrigin(0, 0);

        this.continueIndicator = this.scene.add.text(width / 2 - 20, height / 2 - 20, '▼', {
            fontSize: '20px',
            color: '#00ff88'
        }).setOrigin(1, 1);

        this.scene.tweens.add({
            targets: this.continueIndicator,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.choiceButtons = [];
        this.createChoiceButtons(width, height);

        this.container.add([
            bg,
            this.portraitBg,
            this.portraitEmoji,
            this.nameText,
            this.dialogueText,
            this.continueIndicator,
            ...this.friendshipBar.elements,
            ...this.choiceButtons
        ]);

        this.scene.input.keyboard.on('keydown-SPACE', () => {
            if (this.isVisible) {
                this.handleContinue();
            }
        });

        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.isVisible) {
                this.hideDialogue();
            }
        });
    }

    createFriendshipBar(x, y) {
        const barWidth = 120;
        const barHeight = 12;

        const bgBar = this.scene.add.rectangle(x, y, barWidth, barHeight, 0x444444);
        bgBar.setOrigin(0, 0);

        const fillBar = this.scene.add.rectangle(x, y, 0, barHeight, 0x00ff88);
        fillBar.setOrigin(0, 0);

        const label = this.scene.add.text(x, y - 15, 'Amistad: 0%', {
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0, 0);

        return {
            elements: [bgBar, fillBar, label],
            bgBar,
            fillBar,
            label,
            update: (friendship) => {
                const percent = Math.round(friendship);
                fillBar.width = (barWidth * percent) / 100;
                label.setText(`Amistad: ${percent}%`);

                if (percent >= 80) fillBar.setFillStyle(0xffd700);
                else if (percent >= 60) fillBar.setFillStyle(0x00ff88);
                else if (percent >= 40) fillBar.setFillStyle(0x4ade80);
                else if (percent >= 20) fillBar.setFillStyle(0x94a3b8);
                else fillBar.setFillStyle(0x64748b);
            }
        };
    }

    createChoiceButtons(width, height) {
        const buttons = [];
        const buttonHeight = 40;
        const buttonSpacing = 10;
        const startY = 40;

        for (let i = 0; i < 4; i++) {
            const btn = this.scene.add.container(0, startY + i * (buttonHeight + buttonSpacing));

            const bg = this.scene.add.rectangle(0, 0, width - 200, buttonHeight, 0x2a2a3e);
            bg.setStrokeStyle(2, 0x00ff88, 0.5);

            const text = this.scene.add.text(0, 0, '', {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            bg.setInteractive({ useHandCursor: true });

            bg.on('pointerover', () => {
                bg.setFillStyle(0x3a3a4e);
                bg.setStrokeStyle(2, 0x00ff88, 1);
            });

            bg.on('pointerout', () => {
                bg.setFillStyle(0x2a2a3e);
                bg.setStrokeStyle(2, 0x00ff88, 0.5);
            });

            bg.on('pointerdown', () => {
                this.selectChoice(i);
            });

            btn.add([bg, text]);
            btn.setVisible(false);

            buttons.push({ container: btn, bg, text });
        }

        return buttons;
    }

    showDialogue(npcData, text, choices, onChoiceCallback) {
        this.isVisible = true;
        this.currentText = text;
        this.currentChoices = choices;
        this.onChoiceCallback = onChoiceCallback;

        this.nameText.setText(npcData.name.toUpperCase());
        this.portraitEmoji.setText(this.getEmotionEmoji(npcData.emotion));

        if (npcData.friendship !== undefined) {
            this.friendshipBar.update(npcData.friendship);
        }

        this.container.setVisible(true);
        this.dialogueText.setText('');
        this.currentCharIndex = 0;

        this.hideChoices();

        this.startTypewriter();

        this.scene.tweens.add({
            targets: this.container,
            y: this.scene.cameras.main.height - 250 / 2 - 20,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    getEmotionEmoji(emotion) {
        const emotions = {
            neutral: '😐',
            happy: '😊',
            sad: '😢',
            angry: '😠',
            surprised: '😲',
            thinking: '🤔',
            curious: '🧐',
            teaching: '👨‍🏫',
            disappointed: '😞',
            excited: '🤩'
        };

        return emotions[emotion] || '😐';
    }

    startTypewriter() {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
        }

        this.continueIndicator.setVisible(false);

        this.typewriterTimer = this.scene.time.addEvent({
            delay: this.typewriterSpeed,
            callback: () => {
                if (this.currentCharIndex < this.currentText.length) {
                    this.dialogueText.setText(this.currentText.substring(0, this.currentCharIndex + 1));
                    this.currentCharIndex++;
                } else {
                    this.finishTypewriter();
                }
            },
            loop: true
        });
    }

    finishTypewriter() {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }

        this.dialogueText.setText(this.currentText);
        this.currentCharIndex = this.currentText.length;

        if (this.currentChoices && this.currentChoices.length > 0) {
            this.showChoices();
        } else {
            this.continueIndicator.setVisible(true);
        }
    }

    handleContinue() {
        if (this.currentCharIndex < this.currentText.length) {
            this.finishTypewriter();
        } else if (!this.currentChoices || this.currentChoices.length === 0) {
            if (this.onChoiceCallback) {
                this.onChoiceCallback({ next: 'end' });
            }
        }
    }

    showChoices() {
        this.continueIndicator.setVisible(false);

        for (let i = 0; i < this.currentChoices.length && i < this.choiceButtons.length; i++) {
            const choice = this.currentChoices[i];
            const button = this.choiceButtons[i];

            button.text.setText(`${i + 1}. ${choice.text}`);
            button.container.setVisible(true);

            this.scene.tweens.add({
                targets: button.container,
                alpha: 1,
                duration: 200,
                delay: i * 50
            });
        }

        for (let i = 1; i <= 4; i++) {
            const key = `${i}`;
            this.scene.input.keyboard.once(`keydown-${key}`, () => {
                if (this.isVisible && i <= this.currentChoices.length) {
                    this.selectChoice(i - 1);
                }
            });
        }
    }

    hideChoices() {
        this.choiceButtons.forEach(btn => {
            btn.container.setVisible(false);
        });
    }

    selectChoice(index) {
        if (!this.isVisible || index >= this.currentChoices.length) return;

        const choice = this.currentChoices[index];

        this.hideChoices();

        if (this.onChoiceCallback) {
            this.onChoiceCallback(choice);
        }
    }

    hideDialogue() {
        if (!this.isVisible) return;

        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }

        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.container.setVisible(false);
                this.isVisible = false;
                this.hideChoices();
            }
        });
    }

    destroy() {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
        }

        this.container.destroy();
    }
}
