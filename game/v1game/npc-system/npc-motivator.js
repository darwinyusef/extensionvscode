class NPCMotivator {
    constructor(scene, npcData) {
        this.scene = scene;
        this.npc = npcData;
        this.lastInteractionTime = this.loadLastInteraction();
        this.interactionCount = this.loadInteractionCount();
        this.cooldownMinutes = 5; // Cooldown entre interacciones
    }

    loadLastInteraction() {
        return parseInt(localStorage.getItem(`motivator_last_${this.npc.id}`) || '0');
    }

    loadInteractionCount() {
        return parseInt(localStorage.getItem(`motivator_count_${this.npc.id}`) || '0');
    }

    saveInteraction() {
        const now = Date.now();
        localStorage.setItem(`motivator_last_${this.npc.id}`, now);
        this.interactionCount++;
        localStorage.setItem(`motivator_count_${this.npc.id}`, this.interactionCount);
        this.lastInteractionTime = now;
    }

    canInteract() {
        const now = Date.now();
        const timeSinceLastInteraction = now - this.lastInteractionTime;
        const cooldownMs = this.cooldownMinutes * 60 * 1000;
        return timeSinceLastInteraction >= cooldownMs;
    }

    getRemainingCooldown() {
        const now = Date.now();
        const timeSinceLastInteraction = now - this.lastInteractionTime;
        const cooldownMs = this.cooldownMinutes * 60 * 1000;
        const remaining = cooldownMs - timeSinceLastInteraction;
        return Math.max(0, Math.ceil(remaining / 60000)); // en minutos
    }

    interact() {
        if (!this.canInteract()) {
            this.showCooldownMessage();
            return;
        }

        const motivation = this.getMotivation();
        const reward = this.getReward();

        this.showMotivationUI(motivation, reward);
        this.saveInteraction();
    }

    getMotivation() {
        return {
            title: '💪 Nunca te Rindas',
            message: 'Cada desarrollador senior fue una vez un principiante que nunca se rindió. Los errores son parte del proceso de aprendizaje. Sigue adelante, cada línea de código que escribes te acerca más a tu meta.',
            quote: '"El código no es perfecto en el primer intento. La perfección llega con la iteración y la práctica constante."'
        };
    }

    getReward() {
        return { type: 'xp', amount: 150, message: '150 XP' };
    }

    showMotivationUI(motivation, reward) {
        const modal = document.createElement('div');
        modal.className = 'motivator-modal';
        modal.innerHTML = `
            <div class="motivator-content">
                <div class="motivator-header">
                    <div class="motivator-icon">🌟</div>
                    <h2>${this.npc.name}</h2>
                </div>

                <div class="motivation-card">
                    <h3>${motivation.title}</h3>

                    <div class="motivation-message">
                        ${motivation.message}
                    </div>

                    <div class="motivation-quote">
                        <div class="quote-mark">"</div>
                        ${motivation.quote}
                        <div class="quote-mark">"</div>
                    </div>
                </div>

                ${reward ? this.renderRewardSection(reward) : ''}

                <div class="motivator-stats">
                    <div class="stat-item">
                        <span class="stat-label">Visitas:</span>
                        <span class="stat-value">${this.interactionCount + 1}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Próxima motivación en:</span>
                        <span class="stat-value">${this.cooldownMinutes} minutos</span>
                    </div>
                </div>

                <div class="motivator-actions">
                    ${reward ?
                        `<button class="btn-claim-reward" onclick="window.claimMotivatorReward(${JSON.stringify(reward).replace(/"/g, '&quot;')})">
                            🎁 Recibir Recompensa
                        </button>` : ''
                    }
                    <button class="btn-close" onclick="this.closest('.motivator-modal').remove()">
                        Cerrar
                    </button>
                </div>

                <div class="motivator-footer">
                    <p>💬 "Recuerda: cada día que programas es un día que creces."</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animación de entrada
        setTimeout(() => {
            modal.querySelector('.motivator-content').classList.add('show');
        }, 10);

        // Partículas motivacionales
        this.spawnMotivationParticles();
    }

    renderRewardSection(reward) {
        return `
            <div class="reward-section">
                <div class="reward-banner">
                    <div class="reward-shine">✨</div>
                    <h4>¡Bonificación Especial!</h4>
                    <div class="reward-shine">✨</div>
                </div>
                <div class="reward-description">
                    Has recibido: <strong>${reward.message}</strong>
                </div>
            </div>
        `;
    }

    claimReward(reward) {
        switch (reward.type) {
            case 'coins':
                const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
                localStorage.setItem('playerCoins', currentCoins + reward.amount);
                break;

            case 'xp':
                const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
                localStorage.setItem('playerXP', currentXP + reward.amount);
                break;

            case 'key':
                const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
                if (!inventory.keys) inventory.keys = [];
                inventory.keys.push({
                    id: reward.item,
                    name: 'Llave de la Motivación',
                    description: 'Una llave especial que brilla con energía positiva'
                });
                localStorage.setItem('inventory', JSON.stringify(inventory));
                break;

            case 'item':
                const inv = JSON.parse(localStorage.getItem('inventory') || '{}');
                if (!inv.items) inv.items = [];
                inv.items.push({
                    id: reward.item,
                    name: 'Bebida Energética',
                    effect: 'restore_hp',
                    amount: 1
                });
                localStorage.setItem('inventory', JSON.stringify(inv));
                break;

            case 'buff':
                this.applyBuff(reward.buff, reward.duration);
                break;
        }

        // Cerrar modal
        document.querySelector('.motivator-modal')?.remove();

        // Mostrar confirmación
        this.showRewardConfirmation(reward);

        // Emitir evento
        if (this.scene.events) {
            this.scene.events.emit('motivator_reward', reward);
        }
    }

    applyBuff(buffType, duration) {
        const buff = {
            type: buffType,
            expiresAt: Date.now() + duration
        };
        localStorage.setItem('active_buff', JSON.stringify(buff));

        // Mostrar indicador de buff
        this.showBuffIndicator(buffType, duration);
    }

    showBuffIndicator(buffType, duration) {
        const indicator = document.createElement('div');
        indicator.className = 'buff-indicator';
        indicator.innerHTML = `
            <div class="buff-icon">⚡</div>
            <div class="buff-text">
                <strong>Buff Activo: Doble XP</strong>
                <div class="buff-timer">${Math.floor(duration / 60000)} minutos</div>
            </div>
        `;
        document.body.appendChild(indicator);

        // Remover después de la duración
        setTimeout(() => {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 500);
        }, duration);
    }

    showRewardConfirmation(reward) {
        const popup = document.createElement('div');
        popup.className = 'reward-confirmation';
        popup.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">🎁</div>
                <div class="confirmation-text">¡Recompensa obtenida!</div>
                <div class="confirmation-reward">${reward.message}</div>
            </div>
        `;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    }

    showCooldownMessage() {
        const remaining = this.getRemainingCooldown();

        const modal = document.createElement('div');
        modal.className = 'motivator-modal cooldown';
        modal.innerHTML = `
            <div class="motivator-content">
                <div class="cooldown-icon">⏰</div>
                <h3>El Motivador Está Descansando</h3>
                <p>Vuelve en <strong>${remaining} minuto${remaining !== 1 ? 's' : ''}</strong> para recibir más motivación.</p>
                <p class="cooldown-tip">💡 Mientras tanto, sigue practicando y mejorando tus habilidades!</p>
                <button class="btn-close" onclick="this.closest('.motivator-modal').remove()">
                    Entendido
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    spawnMotivationParticles() {
        const particles = ['⭐', '💫', '✨', '🌟', '💪', '🚀', '🎯', '💡'];

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'motivation-particle';
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (3 + Math.random() * 2) + 's';
                document.body.appendChild(particle);

                setTimeout(() => particle.remove(), 5000);
            }, i * 100);
        }
    }
}

// Global function
window.claimMotivatorReward = function(reward) {
    if (window.currentMotivator) {
        window.currentMotivator.claimReward(reward);
    }
};
