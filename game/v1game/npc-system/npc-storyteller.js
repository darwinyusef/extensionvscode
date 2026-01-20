class NPCStoryteller {
    constructor(scene, npcData) {
        this.scene = scene;
        this.npc = npcData;
        this.stories = this.loadStories();
        this.currentStoryIndex = 0;
    }

    loadStories() {
        return [
            {
                id: 'story_1',
                title: 'La Leyenda del Código',
                text: `En los antiguos tiempos de la programación, existían tres llaves sagradas que abrían las puertas del conocimiento:

La Llave de HTML, guardada por el sabio Elder Tim en su casa.
La Llave de CSS, protegida por Flexbox Fred en su morada.
La Llave de JavaScript, custodiada por un enemigo oscuro.

Quien reúna las tres llaves y las entregue al Rey, será coronado como Maestro del Código y recibirá poderes inimaginables.

Las frutas del conocimiento - Manzana, Naranja y Banana - también deben ser recolectadas en tu viaje.

¡Ve joven aprendiz, y que el código te acompañe!`,
                hints: [
                    '🔍 Explora las casas para encontrar llaves',
                    '🍎 Las frutas están escondidas en diferentes lugares',
                    '👑 El Rey espera tus tesoros para recompensarte'
                ],
                reward: { type: 'xp', amount: 100 },
                unlocksNext: null
            }
        ];
    }

    loadProgress() {
        return parseInt(localStorage.getItem(`storyteller_progress_${this.npc.id}`) || '0');
    }

    saveProgress() {
        localStorage.setItem(`storyteller_progress_${this.npc.id}`, this.currentStoryIndex);
    }

    interact() {
        const story = this.stories[this.currentStoryIndex];

        if (!story) {
            this.showCompletionMessage();
            return;
        }

        this.showStoryUI(story);
    }

    showStoryUI(story) {
        const isCompleted = this.isStoryCompleted(story.id);

        const modal = document.createElement('div');
        modal.className = 'storyteller-modal';
        modal.innerHTML = `
            <div class="storyteller-content">
                <div class="storyteller-header">
                    <h2>📖 ${this.npc.name}</h2>
                    <div class="story-number">Historia ${this.currentStoryIndex + 1} de ${this.stories.length}</div>
                </div>

                <div class="story-title">
                    <h3>${story.title}</h3>
                    ${isCompleted ? '<span class="completed-badge">✓ Completada</span>' : ''}
                </div>

                <div class="story-text">
                    ${this.formatStoryText(story.text)}
                </div>

                <div class="story-hints">
                    <h4>🗺️ Pistas para tu aventura:</h4>
                    <ul>
                        ${story.hints.map(hint => `<li>${hint}</li>`).join('')}
                    </ul>
                </div>

                <div class="storyteller-actions">
                    ${!isCompleted ?
                        `<button class="btn-complete-story" onclick="window.completeStory('${story.id}')">
                            ✓ Entendido (Recibir recompensa)
                        </button>` :
                        `<button class="btn-next-story" onclick="window.nextStory()">
                            ➡️ Siguiente Historia
                        </button>`
                    }
                    <button class="btn-close" onclick="this.closest('.storyteller-modal').remove()">
                        Cerrar
                    </button>
                </div>

                <div class="story-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((this.currentStoryIndex + 1) / this.stories.length) * 100}%"></div>
                    </div>
                    <div class="progress-text">
                        Progreso: ${this.currentStoryIndex + 1}/${this.stories.length}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animación de typewriter para el texto
        this.animateStoryText(modal.querySelector('.story-text'));
    }

    formatStoryText(text) {
        return text.split('\n\n').map(paragraph =>
            `<p>${paragraph.replace(/\n/g, '<br>')}</p>`
        ).join('');
    }

    animateStoryText(element) {
        const paragraphs = element.querySelectorAll('p');
        paragraphs.forEach((p, index) => {
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
            p.style.transition = 'all 0.5s ease';

            setTimeout(() => {
                p.style.opacity = '1';
                p.style.transform = 'translateY(0)';
            }, index * 300);
        });
    }

    isStoryCompleted(storyId) {
        const completed = JSON.parse(localStorage.getItem('completed_stories') || '[]');
        return completed.includes(storyId);
    }

    completeStory(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        // Marcar como completada
        const completed = JSON.parse(localStorage.getItem('completed_stories') || '[]');
        if (!completed.includes(storyId)) {
            completed.push(storyId);
            localStorage.setItem('completed_stories', JSON.stringify(completed));
        }

        // Dar recompensa
        this.giveReward(story.reward);

        // Avanzar a la siguiente historia
        if (story.unlocksNext) {
            const nextIndex = this.stories.findIndex(s => s.id === story.unlocksNext);
            if (nextIndex > this.currentStoryIndex) {
                this.currentStoryIndex = nextIndex;
                this.saveProgress();
            }
        }

        // Mostrar recompensa
        this.showRewardMessage(story.reward);

        // Recargar UI
        setTimeout(() => {
            document.querySelector('.storyteller-modal')?.remove();
            this.interact();
        }, 2000);
    }

    nextStory() {
        if (this.currentStoryIndex < this.stories.length - 1) {
            this.currentStoryIndex++;
            this.saveProgress();
            document.querySelector('.storyteller-modal')?.remove();
            this.interact();
        } else {
            this.showCompletionMessage();
        }
    }

    giveReward(reward) {
        switch (reward.type) {
            case 'xp':
                const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
                localStorage.setItem('playerXP', currentXP + reward.amount);
                break;

            case 'coins':
                const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
                localStorage.setItem('playerCoins', currentCoins + reward.amount);
                break;

            case 'item':
                const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
                if (!inventory.items) inventory.items = [];
                inventory.items.push({
                    id: reward.item,
                    name: this.getItemName(reward.item),
                    amount: reward.amount || 1
                });
                localStorage.setItem('inventory', JSON.stringify(inventory));
                break;
        }
    }

    getItemName(itemId) {
        const names = {
            'healing_potion': 'Poción de Curación'
        };
        return names[itemId] || itemId;
    }

    showRewardMessage(reward) {
        let message = '';
        switch (reward.type) {
            case 'xp':
                message = `¡Ganaste ${reward.amount} XP!`;
                break;
            case 'coins':
                message = `¡Ganaste ${reward.amount} monedas!`;
                break;
            case 'item':
                message = `¡Obtuviste: ${this.getItemName(reward.item)}!`;
                break;
        }

        const popup = document.createElement('div');
        popup.className = 'story-reward-popup';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 2000);
    }

    showCompletionMessage() {
        const modal = document.createElement('div');
        modal.className = 'storyteller-modal';
        modal.innerHTML = `
            <div class="storyteller-content completion">
                <div class="completion-animation">
                    <div class="book-icon">📚</div>
                    <h2>¡Has completado todas las historias!</h2>
                </div>

                <div class="completion-message">
                    <p>Has escuchado todas las leyendas del Reino del Código.</p>
                    <p>Ahora conoces todos los secretos y ubicaciones importantes.</p>
                    <p class="final-wisdom">"El verdadero conocimiento no está en escuchar historias, sino en vivirlas."</p>
                </div>

                <button class="btn-close" onclick="this.closest('.storyteller-modal').remove()">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

// Global functions
window.completeStory = function(storyId) {
    if (window.currentStoryteller) {
        window.currentStoryteller.completeStory(storyId);
    }
};

window.nextStory = function() {
    if (window.currentStoryteller) {
        window.currentStoryteller.nextStory();
    }
};
