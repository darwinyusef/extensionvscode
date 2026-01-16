class MouthAnimator {
    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;

        this.mouthStates = {
            closed: 0,
            open_small: 1,
            open_medium: 2,
            open_large: 3
        };

        this.currentState = 'closed';
        this.isAnimating = false;
        this.animationInterval = null;

        this.createMouthGraphic();
    }

    createMouthGraphic() {
        this.mouthGraphic = this.scene.add.graphics();
        this.mouthGraphic.setDepth(51);
        this.openAmount = 0;
        this.targetOpen = 0;
    }

    update() {
        if (!this.mouthGraphic) return;

        this.openAmount += (this.targetOpen - this.openAmount) * 0.3;
        this.drawMouth();
    }

    drawMouth() {
        if (!this.mouthGraphic || !this.npc) return;

        this.mouthGraphic.clear();

        const mouthX = this.npc.x;
        const mouthY = this.npc.y + 15;
        const width = 12;
        const maxHeight = 10;
        const height = maxHeight * this.openAmount;

        // Usar fillEllipse en lugar de ellipse
        this.mouthGraphic.fillStyle(0x000000, 0.8);
        this.mouthGraphic.fillEllipse(mouthX, mouthY, width, height / 2);

        // Lengua (solo si está muy abierta)
        if (this.openAmount > 0.6) {
            this.mouthGraphic.fillStyle(0xff6b6b, 0.7);
            this.mouthGraphic.fillEllipse(mouthX, mouthY + height * 0.2, width * 0.6, height * 0.2);
        }
    }

    startTalking(text, duration) {
        this.isAnimating = true;
        const phonemes = this.textToPhonemes(text);
        const phonemeDuration = duration / phonemes.length;

        let index = 0;

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        this.animationInterval = setInterval(() => {
            if (index >= phonemes.length || !this.isAnimating) {
                this.stopTalking();
                return;
            }

            this.targetOpen = phonemes[index].openAmount;
            index++;
        }, phonemeDuration);
    }

    textToPhonemes(text) {
        return text.split('').map(char => {
            const lower = char.toLowerCase();
            if ('aáeéoó'.includes(lower)) return { openAmount: 0.9 };
            if ('iíuú'.includes(lower)) return { openAmount: 0.4 };
            if ('bcdfghjklmnpqrstvwxyz'.includes(lower)) return { openAmount: 0.6 };
            if ('ñ'.includes(lower)) return { openAmount: 0.3 };
            if (char === ' ' || char === '.' || char === ',') return { openAmount: 0 };
            return { openAmount: 0.5 };
        });
    }

    stopTalking() {
        this.isAnimating = false;
        this.targetOpen = 0;

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    destroy() {
        this.stopTalking();
        if (this.mouthGraphic) {
            this.mouthGraphic.destroy();
            this.mouthGraphic = null;
        }
    }
}
// Cache buster: 1768508197
