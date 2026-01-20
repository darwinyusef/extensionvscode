class NPCKing {
    constructor(scene, npcData) {
        this.scene = scene;
        this.npc = npcData;
        this.requiredItems = this.loadRequirements();
        this.currentLevel = this.loadPlayerLevel();
        this.maxLevel = 10;
    }

    loadRequirements() {
        const requirements = localStorage.getItem(`king_requirements_${this.npc.id}`);
        return requirements ? JSON.parse(requirements) : this.getDefaultRequirements();
    }

    getDefaultRequirements() {
        return {
            level_1: { keys: ['key_html'], fruits: [], coins: 0 },
            level_2: { keys: ['key_html', 'key_css'], fruits: ['apple'], coins: 100 },
            level_3: { keys: ['key_html', 'key_css', 'key_js'], fruits: ['apple', 'orange'], coins: 250 },
            level_4: { keys: ['key_html', 'key_css', 'key_js'], fruits: ['apple', 'orange', 'banana'], coins: 500 },
            level_5: { keys: ['key_html', 'key_css', 'key_js', 'key_react'], fruits: ['apple', 'orange', 'banana'], coins: 1000 }
        };
    }

    loadPlayerLevel() {
        return parseInt(localStorage.getItem('playerLevel') || '1');
    }

    interact() {
        const hasInteractedBefore = localStorage.getItem(`king_met_${this.npc.id}`) === 'true';

        if (!hasInteractedBefore) {
            this.showIntroduction();
        } else {
            this.showKingUI();
        }
    }

    showIntroduction() {
        const modal = document.createElement('div');
        modal.className = 'king-modal intro';
        modal.innerHTML = `
            <div class="king-content">
                <div class="king-header">
                    <div class="king-crown">👑</div>
                    <h2>${this.npc.name}</h2>
                    <div class="king-subtitle">Rey del Reino del Código</div>
                </div>

                <div class="king-speech">
                    <p>"¡Bienvenido, joven desarrollador! Soy el Rey de este reino digital."</p>
                    <p>"Mi propósito es recompensar a aquellos que demuestren su dominio del código. A medida que reúnas <strong>llaves sagradas</strong>, <strong>frutas del conocimiento</strong> y <strong>monedas</strong>, podrás subir de nivel y obtener grandes recompensas."</p>
                    <p>"Cada nivel te otorgará más experiencia, más recursos y nuevos títulos de honor."</p>
                    <p class="king-tip">💡 <em>Consejo: Habla con el Sabio Cuentahistorias para conocer la leyenda de las llaves sagradas.</em></p>
                </div>

                <div class="king-actions">
                    <button class="btn-level-up" onclick="window.kingShowRequirements()">
                        📋 Ver Requisitos para Nivel 2
                    </button>
                    <button class="btn-close" onclick="this.closest('.king-modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Marcar como conocido
        localStorage.setItem(`king_met_${this.npc.id}`, 'true');
    }

    showKingUI() {
        const inventory = this.getInventory();
        const nextLevel = this.currentLevel + 1;
        const requirements = this.requiredItems[`level_${nextLevel}`];

        if (!requirements) {
            this.showMessage('¡Has alcanzado el nivel máximo! Eres un maestro del código. 👑');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'king-modal';
        modal.innerHTML = `
            <div class="king-content">
                <div class="king-header">
                    <h2>👑 ${this.npc.name} - El Rey del Reino del Código</h2>
                    <div class="current-level">Nivel Actual: ${this.currentLevel}</div>
                </div>

                <div class="king-speech">
                    <p>"${this.getKingSpeech(nextLevel)}"</p>
                </div>

                <div class="requirements-section">
                    <h3>Requisitos para Nivel ${nextLevel}:</h3>

                    <div class="requirement-group">
                        <h4>🗝️ Llaves:</h4>
                        ${this.renderRequirementList(requirements.keys, inventory.keys, 'key')}
                    </div>

                    <div class="requirement-group">
                        <h4>🍎 Frutas del Conocimiento:</h4>
                        ${this.renderRequirementList(requirements.fruits, inventory.items, 'fruit')}
                    </div>

                    <div class="requirement-group">
                        <h4>💰 Monedas:</h4>
                        <div class="coin-requirement ${inventory.coins >= requirements.coins ? 'completed' : 'pending'}">
                            ${inventory.coins} / ${requirements.coins} monedas
                        </div>
                    </div>
                </div>

                <div class="king-actions">
                    ${this.canLevelUp(inventory, requirements) ?
                        '<button class="btn-level-up" onclick="window.kingLevelUp()">⬆️ Subir de Nivel</button>' :
                        '<button class="btn-level-up disabled" disabled>❌ Requisitos Incompletos</button>'
                    }
                    <button class="btn-close" onclick="this.closest(\'.king-modal\').remove()">Cerrar</button>
                </div>

                <div class="king-inventory">
                    <h4>📦 Tu Inventario:</h4>
                    <div class="inventory-display">
                        <div>Llaves: ${inventory.keys.length}</div>
                        <div>Items: ${inventory.items.length}</div>
                        <div>Monedas: ${inventory.coins}</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    renderRequirementList(required, playerItems, type) {
        if (required.length === 0) {
            return '<div class="requirement-item completed">✓ Ninguno requerido</div>';
        }

        // Asegurar que playerItems es un array
        const itemsArray = Array.isArray(playerItems) ? playerItems : [];

        return required.map(itemId => {
            const hasItem = itemsArray.some(item =>
                type === 'key' ? item.id === itemId : item.id === itemId
            );
            const itemName = this.getItemName(itemId);
            return `
                <div class="requirement-item ${hasItem ? 'completed' : 'pending'}">
                    ${hasItem ? '✓' : '○'} ${itemName}
                </div>
            `;
        }).join('');
    }

    getItemName(itemId) {
        const names = {
            'key_html': 'Llave de HTML',
            'key_css': 'Llave de CSS',
            'key_js': 'Llave de JavaScript',
            'key_react': 'Llave de React',
            'apple': 'Manzana del Conocimiento',
            'orange': 'Naranja de la Creatividad',
            'banana': 'Banana de la Lógica'
        };
        return names[itemId] || itemId;
    }

    getKingSpeech(nextLevel) {
        const speeches = {
            2: 'Veo que has comenzado tu viaje en el código. Tráeme las llaves del conocimiento HTML y CSS, junto con la manzana de la sabiduría.',
            3: 'Tu dominio de los lenguajes fundamentales crece. Ahora necesito que demuestres tu valía con JavaScript y más frutas del conocimiento.',
            4: 'Impresionante progreso, joven desarrollador. Para el siguiente nivel necesitarás más experiencia y recursos.',
            5: 'Estás cerca de la maestría. Demuestra tu dominio completo del stack moderno.',
            6: 'Has llegado lejos. Solo los verdaderos maestros alcanzan este nivel.'
        };
        return speeches[nextLevel] || 'Continúa tu viaje de aprendizaje, desarrollador.';
    }

    canLevelUp(inventory, requirements) {
        // Asegurar que keys e items son arrays
        const keys = Array.isArray(inventory.keys) ? inventory.keys : [];
        const items = Array.isArray(inventory.items) ? inventory.items : [];

        const hasKeys = requirements.keys.every(keyId =>
            keys.some(k => k.id === keyId)
        );
        const hasFruits = requirements.fruits.every(fruitId =>
            items.some(i => i.id === fruitId)
        );
        const hasCoins = inventory.coins >= requirements.coins;

        return hasKeys && hasFruits && hasCoins;
    }

    getInventory() {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        return {
            keys: Array.isArray(inventory.keys) ? inventory.keys : [],
            items: Array.isArray(inventory.items) ? inventory.items : [],
            coins: parseInt(localStorage.getItem('playerCoins') || '0')
        };
    }

    levelUp() {
        const inventory = this.getInventory();
        const nextLevel = this.currentLevel + 1;
        const requirements = this.requiredItems[`level_${nextLevel}`];

        if (!this.canLevelUp(inventory, requirements)) {
            this.showMessage('No cumples con todos los requisitos.');
            return;
        }

        // Consumir items
        this.consumeItems(inventory, requirements);

        // Subir nivel
        this.currentLevel = nextLevel;
        localStorage.setItem('playerLevel', this.currentLevel);

        // Dar recompensas
        const rewards = this.getLevelUpRewards(nextLevel);
        this.giveRewards(rewards);

        // Cerrar modal
        document.querySelector('.king-modal')?.remove();

        // Mostrar celebración
        this.showLevelUpCelebration(nextLevel, rewards);

        // Emitir evento
        if (this.scene.events) {
            this.scene.events.emit('player_level_up', { level: nextLevel, rewards });
        }
    }

    consumeItems(inventory, requirements) {
        // Restar monedas
        const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
        localStorage.setItem('playerCoins', currentCoins - requirements.coins);

        // Marcar items como consumidos (opcional - podrías dejarlos)
        // Por ahora solo restamos las monedas
    }

    getLevelUpRewards(level) {
        const rewardsByLevel = {
            2: { xp: 200, coins: 50, title: 'Aprendiz del Código' },
            3: { xp: 500, coins: 150, title: 'Desarrollador Junior', hp: 1 },
            4: { xp: 1000, coins: 300, title: 'Desarrollador Mid-Level', hp: 1 },
            5: { xp: 2000, coins: 500, title: 'Desarrollador Senior', hp: 2 },
            6: { xp: 5000, coins: 1000, title: 'Arquitecto de Software', hp: 2 }
        };
        return rewardsByLevel[level] || { xp: 100, coins: 50 };
    }

    giveRewards(rewards) {
        // XP
        if (rewards.xp) {
            const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
            localStorage.setItem('playerXP', currentXP + rewards.xp);
        }

        // Monedas
        if (rewards.coins) {
            const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
            localStorage.setItem('playerCoins', currentCoins + rewards.coins);
        }

        // HP adicional (aumenta max hearts)
        if (rewards.hp) {
            const maxLives = parseInt(localStorage.getItem('maxLives') || '3');
            const currentLives = parseInt(localStorage.getItem('currentLives') || '3');
            localStorage.setItem('maxLives', maxLives + rewards.hp);
            localStorage.setItem('currentLives', currentLives + rewards.hp);
        }

        // Título
        if (rewards.title) {
            localStorage.setItem('playerTitle', rewards.title);
        }
    }

    showLevelUpCelebration(level, rewards) {
        const modal = document.createElement('div');
        modal.className = 'level-up-celebration';
        modal.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-animation">
                    <div class="crown-big">👑</div>
                    <h1 class="celebration-title">¡NIVEL ${level} ALCANZADO!</h1>
                </div>

                <div class="new-title">
                    ${rewards.title ? `<h2>Nuevo Título: ${rewards.title}</h2>` : ''}
                </div>

                <div class="rewards-list">
                    <h3>Recompensas:</h3>
                    ${rewards.xp ? `<div class="reward-item">⭐ +${rewards.xp} XP</div>` : ''}
                    ${rewards.coins ? `<div class="reward-item">💰 +${rewards.coins} Monedas</div>` : ''}
                    ${rewards.hp ? `<div class="reward-item">❤️ +${rewards.hp} Vida Máxima</div>` : ''}
                </div>

                <button class="btn-celebrate" onclick="this.closest('.level-up-celebration').remove()">
                    ¡CONTINUAR!
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Animación de confetti (simple)
        this.spawnConfetti();
    }

    spawnConfetti() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.textContent = ['🎉', '⭐', '👑', '💎', '🏆'][Math.floor(Math.random() * 5)];
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 4000);
            }, i * 50);
        }
    }

    showMessage(text) {
        const message = document.createElement('div');
        message.className = 'king-message';
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 500);
        }, 3000);
    }
}

// Global functions para los botones
window.kingShowRequirements = function() {
    if (window.currentKingNPC) {
        document.querySelector('.king-modal')?.remove();
        window.currentKingNPC.showKingUI();
    }
};

window.kingLevelUp = function() {
    if (window.currentKingNPC) {
        window.currentKingNPC.levelUp();
    }
};
