class NPCEnemy {
    constructor(scene, npcData) {
        this.scene = scene;
        this.npc = npcData;
        this.enemyHP = this.loadEnemyHP();
        this.maxEnemyHP = npcData.maxHP || 5;
        this.isDefeated = this.loadDefeatedStatus();
        this.challenges = this.loadChallenges();
        this.currentChallengeIndex = 0;
    }

    loadEnemyHP() {
        const saved = localStorage.getItem(`enemy_hp_${this.npc.id}`);
        return saved ? parseInt(saved) : (this.npc.maxHP || 5);
    }

    saveEnemyHP() {
        localStorage.setItem(`enemy_hp_${this.npc.id}`, this.enemyHP);
    }

    loadDefeatedStatus() {
        return localStorage.getItem(`enemy_defeated_${this.npc.id}`) === 'true';
    }

    markDefeated() {
        localStorage.setItem(`enemy_defeated_${this.npc.id}`, 'true');
        this.isDefeated = true;
    }

    loadChallenges() {
        // ÚNICO desafío de código que el jugador debe completar
        return [
            {
                type: 'fix_syntax',
                title: 'Corrige el Error de Sintaxis',
                description: 'Este código tiene un error. ¡Corrígelo!',
                brokenCode: 'function suma(a, b) {\n  return a + b\n}',
                correctCode: 'function suma(a, b) {\n  return a + b;\n}',
                hint: 'Falta un punto y coma',
                damage: 5  // Daño suficiente para derrotar al enemigo de una vez
            }
        ];
    }

    interact() {
        if (this.isDefeated) {
            this.showDefeatedMessage();
            return;
        }

        this.showBattleIntro();
    }

    showBattleIntro() {
        const modal = document.createElement('div');
        modal.className = 'enemy-modal intro';
        modal.innerHTML = `
            <div class="enemy-content">
                <div class="enemy-header">
                    <div class="enemy-avatar">😈</div>
                    <h2>${this.npc.name}</h2>
                    <div class="enemy-title">${this.npc.role || 'Guardian del Código Oscuro'}</div>
                </div>

                <div class="enemy-hp-bar">
                    <div class="hp-label">HP del Enemigo</div>
                    <div class="hp-bar-container">
                        <div class="hp-bar-fill" style="width: ${(this.enemyHP / this.maxEnemyHP) * 100}%">
                            ${this.enemyHP}/${this.maxEnemyHP}
                        </div>
                    </div>
                </div>

                <div class="enemy-speech">
                    <p>"${this.getBattleIntroText()}"</p>
                </div>

                <div class="battle-warning">
                    ⚠️ Batalla de Código Iniciada ⚠️
                    <p>Responde correctamente para dañar al enemigo.</p>
                    <p>Respuestas incorrectas te quitarán vida.</p>
                </div>

                <div class="enemy-actions">
                    <button class="btn-start-battle" onclick="window.startCodeBattle()">
                        ⚔️ Iniciar Batalla
                    </button>
                    <button class="btn-flee" onclick="window.fleeBattle()">
                        🏃 Huir
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getBattleIntroText() {
        const texts = [
            '¡Así que quieres enfrentarme! Prepárate para demostrar tus conocimientos de código.',
            'Muchos han intentado derrotarme. Todos fallaron. ¿Serás diferente?',
            'El código es mi arma. Veamos si puedes mantener el ritmo.',
            'Solo los programadores más valientes y hábiles me han vencido. ¿Eres uno de ellos?'
        ];
        return texts[Math.floor(Math.random() * texts.length)];
    }

    startBattle() {
        document.querySelector('.enemy-modal')?.remove();
        this.showNextChallenge();
    }

    showNextChallenge() {
        const challenge = this.challenges[0]; // Solo hay un desafío

        const modal = document.createElement('div');
        modal.className = 'enemy-modal challenge';
        modal.innerHTML = `
            <div class="enemy-content">
                <div class="battle-status">
                    <div class="enemy-hp-mini">
                        <span>😈 Enemigo</span>
                        <div class="hp-mini-bar">
                            <div class="hp-mini-fill enemy" style="width: ${(this.enemyHP / this.maxEnemyHP) * 100}%"></div>
                        </div>
                        <span>${this.enemyHP}/${this.maxEnemyHP}</span>
                    </div>
                    <div class="vs">⚔️</div>
                    <div class="player-hp-mini">
                        <span>👤 Tú</span>
                        <div class="hp-mini-bar">
                            <div class="hp-mini-fill player" style="width: ${this.getPlayerHPPercentage()}%"></div>
                        </div>
                        <span>${this.getPlayerHP()}/3</span>
                    </div>
                </div>

                <div class="challenge-card">
                    <div class="challenge-header">
                        <h3>${challenge.title}</h3>
                    </div>

                    <p class="challenge-description">${challenge.description}</p>

                    ${this.renderChallengeInput(challenge)}

                    <div class="challenge-hint collapsed" id="hint-section">
                        <button class="btn-show-hint" onclick="this.parentElement.classList.toggle('collapsed')">
                            💡 Mostrar Pista
                        </button>
                        <div class="hint-text">${challenge.hint}</div>
                    </div>
                </div>

                <div class="challenge-actions">
                    <button class="btn-submit-code" onclick="window.submitCodeChallenge(0)">
                        ✓ Enviar Respuesta
                    </button>
                    <button class="btn-surrender" onclick="window.surrenderBattle()">
                        🏳️ Rendirse
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    renderChallengeInput(challenge) {
        switch (challenge.type) {
            case 'fix_syntax':
            case 'fix_logic':
                return `
                    <div class="code-editor">
                        <textarea id="code-input" class="code-textarea" spellcheck="false">${challenge.brokenCode}</textarea>
                    </div>
                `;

            case 'complete_code':
                return `
                    <div class="code-display">
                        <pre><code>${challenge.brokenCode}</code></pre>
                    </div>
                    <div class="answer-input">
                        <label>Tu respuesta:</label>
                        <input type="text" id="code-input" placeholder="Completa el código..." />
                    </div>
                `;

            case 'write_function':
                return `
                    <div class="code-editor">
                        <textarea id="code-input" class="code-textarea" spellcheck="false" placeholder="Escribe tu función aquí..."></textarea>
                    </div>
                    <div class="test-cases">
                        <h4>Casos de Prueba:</h4>
                        ${challenge.testCases.map(tc => `
                            <div class="test-case">
                                Input: ${tc.input} → Output esperado: ${tc.output}
                            </div>
                        `).join('')}
                    </div>
                `;

            default:
                return '<p>Tipo de desafío desconocido</p>';
        }
    }

    getPlayerHP() {
        return parseInt(localStorage.getItem('currentLives') || '3');
    }

    getPlayerHPPercentage() {
        const maxLives = parseInt(localStorage.getItem('maxLives') || '3');
        return (this.getPlayerHP() / maxLives) * 100;
    }

    submitChallenge(challengeIndex) {
        const challenge = this.challenges[0]; // Solo hay un desafío
        const userInput = document.getElementById('code-input')?.value || '';

        const isCorrect = this.validateAnswer(challenge, userInput);

        if (isCorrect) {
            this.handleCorrectAnswer(challenge);
        } else {
            this.handleWrongAnswer(challenge);
        }
    }

    validateAnswer(challenge, userInput) {
        const normalized = userInput.trim().replace(/\s+/g, ' ');

        switch (challenge.type) {
            case 'fix_syntax':
            case 'fix_logic':
                const expectedNormalized = challenge.correctCode.trim().replace(/\s+/g, ' ');
                return normalized === expectedNormalized;

            case 'complete_code':
                return normalized.includes(challenge.correctAnswer);

            case 'write_function':
                // Validación simplificada - en producción usarías eval con sandbox
                return normalized.includes('function') &&
                       normalized.includes('length') &&
                       normalized.includes('return');

            default:
                return false;
        }
    }

    handleCorrectAnswer(challenge) {
        // Dañar al enemigo (lo derrota de una vez)
        this.enemyHP = 0;
        this.saveEnemyHP();

        // Cerrar modal actual
        document.querySelector('.enemy-modal')?.remove();

        // Mostrar feedback
        this.showFeedback(true, challenge.damage);

        // Terminar batalla
        setTimeout(() => {
            this.defeatedEnemy();
        }, 2000);
    }

    handleWrongAnswer(challenge) {
        // Quitar vida al jugador
        const currentLives = this.getPlayerHP();
        if (currentLives > 0) {
            localStorage.setItem('currentLives', currentLives - 1);
        }

        // Cerrar modal actual
        document.querySelector('.enemy-modal')?.remove();

        // Mostrar feedback
        this.showFeedback(false, 1);

        // Verificar game over o dar otra oportunidad
        setTimeout(() => {
            if (this.getPlayerHP() <= 0) {
                this.gameOver();
            } else {
                // Dar otra oportunidad con el mismo desafío
                this.showNextChallenge();
            }
        }, 2000);
    }

    showFeedback(isCorrect, damage) {
        const modal = document.createElement('div');
        modal.className = `feedback-modal ${isCorrect ? 'success' : 'failure'}`;
        modal.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">
                    ${isCorrect ? '✅' : '❌'}
                </div>
                <h3>${isCorrect ? '¡Correcto!' : 'Incorrecto'}</h3>
                <p>${isCorrect ?
                    `Has dañado al enemigo. -${damage} HP` :
                    'Has perdido 1 vida. ¡Cuidado!'
                }</p>
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => modal.remove(), 1800);
    }

    defeatedEnemy() {
        this.markDefeated();

        const modal = document.createElement('div');
        modal.className = 'enemy-modal victory';
        modal.innerHTML = `
            <div class="enemy-content">
                <div class="victory-animation">
                    <div class="trophy">🏆</div>
                    <h1>¡VICTORIA!</h1>
                </div>

                <div class="victory-message">
                    <p>Has derrotado a ${this.npc.name}!</p>
                    <p class="victory-quote">"Tu dominio del código es impresionante..."</p>
                </div>

                <div class="victory-rewards">
                    <h3>Recompensas:</h3>
                    ${this.renderRewards()}
                </div>

                <button class="btn-collect-rewards" onclick="window.collectBattleRewards()">
                    💎 Reclamar Recompensas
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        this.spawnVictoryConfetti();
    }

    renderRewards() {
        const rewards = this.npc.rewards || {
            xp: 500,
            coins: 300,
            items: [{ id: 'key_js', name: 'Llave de JavaScript' }]
        };

        let html = '';
        if (rewards.xp) html += `<div class="reward-item">⭐ ${rewards.xp} XP</div>`;
        if (rewards.coins) html += `<div class="reward-item">💰 ${rewards.coins} Monedas</div>`;
        if (rewards.items) {
            rewards.items.forEach(item => {
                html += `<div class="reward-item">🗝️ ${item.name}</div>`;
            });
        }

        return html;
    }

    collectRewards() {
        const rewards = this.npc.rewards || {
            xp: 500,
            coins: 300,
            items: [{ id: 'key_js', name: 'Llave de JavaScript' }]
        };

        // Dar XP
        if (rewards.xp) {
            const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
            localStorage.setItem('playerXP', currentXP + rewards.xp);
        }

        // Dar monedas
        if (rewards.coins) {
            const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
            localStorage.setItem('playerCoins', currentCoins + rewards.coins);
        }

        // Dar items
        if (rewards.items) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
            if (!inventory.keys) inventory.keys = [];

            rewards.items.forEach(item => {
                inventory.keys.push({
                    id: item.id,
                    name: item.name,
                    description: 'Obtenida derrotando a ' + this.npc.name
                });
            });

            localStorage.setItem('inventory', JSON.stringify(inventory));
        }

        // Cerrar modal
        document.querySelector('.enemy-modal')?.remove();

        // Emitir evento
        if (this.scene.events) {
            this.scene.events.emit('enemy_defeated', { enemyId: this.npc.id, rewards });
        }
    }

    gameOver() {
        const modal = document.createElement('div');
        modal.className = 'enemy-modal gameover';
        modal.innerHTML = `
            <div class="enemy-content">
                <div class="gameover-animation">
                    <div class="skull">💀</div>
                    <h1>GAME OVER</h1>
                </div>

                <div class="gameover-message">
                    <p>Has sido derrotado por ${this.npc.name}...</p>
                    <p>Busca al Curandero para restaurar tu vida y vuelve a intentarlo.</p>
                </div>

                <button class="btn-respawn" onclick="window.location.reload()">
                    🔄 Volver al Juego
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    surrenderBattle() {
        document.querySelector('.enemy-modal')?.remove();
        this.showMessage('Has huido de la batalla. El enemigo sigue esperando...');
    }

    showDefeatedMessage() {
        const modal = document.createElement('div');
        modal.className = 'enemy-modal defeated';
        modal.innerHTML = `
            <div class="enemy-content">
                <div class="defeated-icon">😵</div>
                <h3>${this.npc.name}</h3>
                <p>"Ya me has derrotado... no tengo más que ofrecerte."</p>
                <button class="btn-close" onclick="this.closest('.enemy-modal').remove()">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showMessage(text) {
        const message = document.createElement('div');
        message.className = 'battle-message';
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 500);
        }, 3000);
    }

    spawnVictoryConfetti() {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'victory-confetti';
                confetti.textContent = ['🎉', '⭐', '💎', '🏆', '👑', '✨'][Math.floor(Math.random() * 6)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 5000);
            }, i * 30);
        }
    }
}

// Global functions
window.startCodeBattle = function() {
    if (window.currentEnemy) {
        window.currentEnemy.startBattle();
    }
};

window.fleeBattle = function() {
    document.querySelector('.enemy-modal')?.remove();
};

window.submitCodeChallenge = function(index) {
    if (window.currentEnemy) {
        window.currentEnemy.submitChallenge(index);
    }
};

window.surrenderBattle = function() {
    if (window.currentEnemy) {
        window.currentEnemy.surrenderBattle();
    }
};

window.collectBattleRewards = function() {
    if (window.currentEnemy) {
        window.currentEnemy.collectRewards();
    }
};
