class HouseInteriorLoader {
    constructor(scene) {
        this.scene = scene;
        this.interiorConfig = null;
    }

    async loadInterior(configPath) {
        try {
            const response = await fetch(configPath);
            this.interiorConfig = await response.json();

            this.createInterior();
            this.createActivities();
            this.createExitZone();

            return this.interiorConfig;
        } catch (error) {
            console.error('Error loading house interior:', error);
            return null;
        }
    }

    createInterior() {
        const interior = this.interiorConfig.interior;

        const wallColor = parseInt(interior.wallColor.replace('#', '0x'));
        const floorColor = parseInt(interior.floorColor.replace('#', '0x'));

        const walls = this.scene.add.rectangle(
            interior.width / 2,
            interior.height / 2,
            interior.width,
            interior.height,
            wallColor
        );
        walls.setDepth(-100);

        const floor = this.scene.add.rectangle(
            interior.width / 2,
            interior.height / 2 + 100,
            interior.width - 100,
            interior.height - 200,
            floorColor
        );
        floor.setDepth(-50);

        const ceiling = this.scene.add.rectangle(
            interior.width / 2,
            30,
            interior.width - 100,
            60,
            wallColor - 0x111111
        );
        ceiling.setDepth(-50);
    }

    createActivities() {
        if (!this.interiorConfig.activities) return;

        this.interiorConfig.activities.forEach(activity => {
            this.createActivityIcon(activity);
        });
    }

    createActivityIcon(activity) {
        const icon = this.scene.add.text(
            activity.position.x,
            activity.position.y,
            activity.icon,
            {
                fontSize: '48px'
            }
        );
        icon.setOrigin(0.5);
        icon.setInteractive({ useHandCursor: true });
        icon.setDepth(100);

        icon.activityData = activity;

        const completedKey = `activity_${this.interiorConfig.id}_${activity.id}`;
        if (localStorage.getItem(completedKey) === 'true') {
            icon.setAlpha(0.3);
        } else {
            this.scene.tweens.add({
                targets: icon,
                y: activity.position.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const label = this.scene.add.text(
            activity.position.x,
            activity.position.y + 40,
            activity.title || this.getActivityTypeName(activity.type),
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        label.setOrigin(0.5);
        label.setDepth(100);

        icon.on('pointerdown', () => {
            this.handleActivityClick(activity, icon);
        });
    }

    getActivityTypeName(type) {
        const names = {
            'document': 'Leer Documento',
            'video': 'Ver Video',
            'podcast': 'Escuchar Podcast',
            'question': 'Responder Pregunta',
            'key': 'Tomar Llave',
            'fruit': 'Tomar Fruta'
        };
        return names[type] || type;
    }

    handleActivityClick(activity, icon) {
        const completedKey = `activity_${this.interiorConfig.id}_${activity.id}`;

        if (localStorage.getItem(completedKey) === 'true') {
            this.showMessage('Ya completaste esta actividad');
            return;
        }

        switch (activity.type) {
            case 'document':
                this.showDocument(activity);
                break;
            case 'video':
                this.showVideo(activity);
                break;
            case 'podcast':
                this.showPodcast(activity);
                break;
            case 'question':
                this.showQuestion(activity);
                break;
            case 'key':
                this.collectKey(activity);
                break;
            case 'fruit':
                this.collectFruit(activity);
                break;
        }
    }

    showDocument(activity) {
        const modal = document.createElement('div');
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-content">
                <h2>${activity.title}</h2>
                <div class="document-content">${activity.content}</div>
                <button onclick="this.parentElement.parentElement.remove(); window.completeActivity('${this.interiorConfig.id}', '${activity.id}', ${JSON.stringify(activity.reward).replace(/"/g, '&quot;')})">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showVideo(activity) {
        const modal = document.createElement('div');
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-content">
                <h2>${activity.title}</h2>
                <iframe width="560" height="315" src="${activity.videoUrl}" frameborder="0" allowfullscreen></iframe>
                <button onclick="this.parentElement.parentElement.remove(); window.completeActivity('${this.interiorConfig.id}', '${activity.id}', ${JSON.stringify(activity.reward).replace(/"/g, '&quot;')})">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showPodcast(activity) {
        const modal = document.createElement('div');
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-content">
                <h2>${activity.title}</h2>
                <p>${activity.description}</p>
                <audio controls style="width: 100%; margin: 20px 0;">
                    <source src="${activity.audioUrl}" type="audio/mpeg">
                </audio>
                <button onclick="this.parentElement.parentElement.remove(); window.completeActivity('${this.interiorConfig.id}', '${activity.id}', ${JSON.stringify(activity.reward).replace(/"/g, '&quot;')})">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showQuestion(activity) {
        const modal = document.createElement('div');
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-content">
                <h2>${activity.title}</h2>
                <p>${activity.question}</p>
                ${activity.hint ? `<p class="hint">💡 Pista: ${activity.hint}</p>` : ''}
                <input type="text" id="answer-input" placeholder="Tu respuesta...">
                <div id="answer-feedback"></div>
                <button onclick="window.checkAnswer('${activity.correctAnswer}', '${this.interiorConfig.id}', '${activity.id}', ${JSON.stringify(activity.reward).replace(/"/g, '&quot;')})">Responder</button>
                <button onclick="this.parentElement.parentElement.remove()">Cancelar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    collectKey(activity) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        if (!inventory.keys) inventory.keys = [];

        inventory.keys.push({
            id: activity.reward.item,
            name: activity.reward.name,
            description: activity.description
        });

        localStorage.setItem('inventory', JSON.stringify(inventory));

        const completedKey = `activity_${this.interiorConfig.id}_${activity.id}`;
        localStorage.setItem(completedKey, 'true');

        this.showMessage(`¡Obtuviste: ${activity.keyName}!`);
        this.scene.scene.restart();
    }

    collectFruit(activity) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        if (!inventory.items) inventory.items = [];

        inventory.items.push({
            id: activity.reward.item,
            name: activity.reward.name,
            description: activity.description,
            effect: activity.reward.effect,
            amount: activity.reward.amount
        });

        localStorage.setItem('inventory', JSON.stringify(inventory));

        const completedKey = `activity_${this.interiorConfig.id}_${activity.id}`;
        localStorage.setItem(completedKey, 'true');

        this.showMessage(`¡Obtuviste: ${activity.fruitName}!`);
        this.scene.scene.restart();
    }

    showMessage(text) {
        const message = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            text,
            {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        );
        message.setOrigin(0.5);
        message.setDepth(1000);

        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => message.destroy()
        });
    }

    createExitZone() {
        const exitConfig = this.interiorConfig.exitZone;

        const exitZone = this.scene.add.rectangle(
            exitConfig.x,
            exitConfig.y,
            exitConfig.width,
            exitConfig.height,
            0x00ff00,
            0
        );

        this.scene.physics.add.existing(exitZone);
        exitZone.body.setImmovable(true);

        const exitText = this.scene.add.text(
            exitConfig.x,
            exitConfig.y - 20,
            '🚪 Salir [E]',
            {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        );
        exitText.setOrigin(0.5);
        exitText.setDepth(100);

        return exitZone;
    }

    getSpawnPoint() {
        return this.interiorConfig.spawnPoint;
    }
}

window.completeActivity = function(houseId, activityId, reward) {
    const completedKey = `activity_${houseId}_${activityId}`;
    localStorage.setItem(completedKey, 'true');

    if (reward.type === 'xp') {
        const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
        localStorage.setItem('playerXP', currentXP + reward.amount);
    }

    location.reload();
};

window.checkAnswer = function(correctAnswer, houseId, activityId, reward) {
    const userAnswer = document.getElementById('answer-input').value.trim().toLowerCase();
    const feedback = document.getElementById('answer-feedback');

    if (userAnswer === correctAnswer.toLowerCase()) {
        feedback.innerHTML = '<p style="color: #4ade80;">¡Correcto! 🎉</p>';
        setTimeout(() => {
            window.completeActivity(houseId, activityId, reward);
        }, 1000);
    } else {
        feedback.innerHTML = '<p style="color: #ef4444;">Incorrecto. Intenta de nuevo.</p>';
    }
};
