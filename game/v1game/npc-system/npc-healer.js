class NPCHealer {
    constructor(scene, npcData) {
        this.scene = scene;
        this.npc = npcData;
        this.shop = this.loadShop();
    }

    loadShop() {
        return {
            services: [
                {
                    id: 'heal_partial',
                    name: 'Curación Básica',
                    description: 'Restaura 1 corazón de vida',
                    icon: '💊',
                    effect: { type: 'heal', amount: 1 },
                    cost: 50,
                    available: true
                },
                {
                    id: 'heal_full',
                    name: 'Curación Completa',
                    description: 'Restaura toda tu vida',
                    icon: '💚',
                    effect: { type: 'heal_full' },
                    cost: 150,
                    available: true
                },
                {
                    id: 'increase_max_hp',
                    name: 'Corazón Adicional',
                    description: 'Aumenta tu vida máxima permanentemente en 1',
                    icon: '❤️',
                    effect: { type: 'increase_max_hp', amount: 1 },
                    cost: 500,
                    available: true,
                    limitPerPlayer: 3
                }
            ],
            items: [
                {
                    id: 'healing_potion',
                    name: 'Poción de Curación',
                    description: 'Restaura 1 vida cuando la uses (guardada en inventario)',
                    icon: '🧪',
                    effect: { type: 'healing_potion', amount: 1 },
                    cost: 75,
                    stock: 10
                },
                {
                    id: 'xp_boost',
                    name: 'Elixir de Experiencia',
                    description: 'Otorga 250 XP instantáneamente',
                    icon: '⭐',
                    effect: { type: 'xp', amount: 250 },
                    cost: 100,
                    stock: 5
                },
                {
                    id: 'skill_scroll_html',
                    name: 'Pergamino de HTML',
                    description: 'Aumenta tu habilidad de HTML en 1 nivel',
                    icon: '📜',
                    effect: { type: 'skill', skill: 'html', amount: 1 },
                    cost: 200,
                    stock: 3
                },
                {
                    id: 'skill_scroll_css',
                    name: 'Pergamino de CSS',
                    description: 'Aumenta tu habilidad de CSS en 1 nivel',
                    icon: '📜',
                    effect: { type: 'skill', skill: 'css', amount: 1 },
                    cost: 200,
                    stock: 3
                },
                {
                    id: 'skill_scroll_js',
                    name: 'Pergamino de JavaScript',
                    description: 'Aumenta tu habilidad de JavaScript en 1 nivel',
                    icon: '📜',
                    effect: { type: 'skill', skill: 'javascript', amount: 1 },
                    cost: 200,
                    stock: 3
                },
                {
                    id: 'lucky_coin',
                    name: 'Moneda de la Suerte',
                    description: 'Aumenta la probabilidad de recibir recompensas extras',
                    icon: '🪙',
                    effect: { type: 'buff', buff: 'lucky', duration: 600000 },
                    cost: 300,
                    stock: 2
                }
            ]
        };
    }

    interact() {
        this.showHealerUI();
    }

    showHealerUI() {
        const playerCoins = this.getPlayerCoins();
        const playerHP = this.getPlayerHP();
        const maxHP = this.getMaxHP();

        const modal = document.createElement('div');
        modal.className = 'healer-modal';
        modal.innerHTML = `
            <div class="healer-content">
                <div class="healer-header">
                    <div class="healer-icon">🏥</div>
                    <div class="healer-info">
                        <h2>${this.npc.name}</h2>
                        <p class="healer-subtitle">${this.npc.role || 'Curandero del Reino'}</p>
                    </div>
                </div>

                <div class="healer-greeting">
                    <p>"${this.getGreeting(playerHP, maxHP)}"</p>
                </div>

                <div class="player-status">
                    <div class="status-item">
                        <span class="status-label">💰 Tus Monedas:</span>
                        <span class="status-value">${playerCoins}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">❤️ Vida Actual:</span>
                        <span class="status-value">${playerHP}/${maxHP}</span>
                        <div class="hp-visual">${this.renderHearts(playerHP, maxHP)}</div>
                    </div>
                </div>

                <div class="healer-tabs">
                    <button class="tab-btn active" onclick="window.switchHealerTab('services')">
                        🩺 Servicios de Curación
                    </button>
                    <button class="tab-btn" onclick="window.switchHealerTab('items')">
                        🛒 Tienda de Items
                    </button>
                </div>

                <div class="healer-tab-content" id="services-tab">
                    <h3>Servicios de Curación</h3>
                    <div class="services-grid">
                        ${this.renderServices(playerCoins, playerHP, maxHP)}
                    </div>
                </div>

                <div class="healer-tab-content hidden" id="items-tab">
                    <h3>Items Especiales</h3>
                    <div class="items-grid">
                        ${this.renderItems(playerCoins)}
                    </div>
                </div>

                <div class="healer-footer">
                    <button class="btn-close" onclick="this.closest('.healer-modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getGreeting(hp, maxHP) {
        if (hp === 0) {
            return '¡Oh no! Estás gravemente herido. Déjame ayudarte inmediatamente.';
        } else if (hp < maxHP / 2) {
            return 'Veo que has estado en batalla. Puedo ayudarte a recuperarte.';
        } else if (hp === maxHP) {
            return 'Veo que estás en perfectas condiciones. ¿Quieres comprar algo para el futuro?';
        } else {
            return 'Bienvenido, aventurero. ¿En qué puedo ayudarte hoy?';
        }
    }

    renderHearts(current, max) {
        let hearts = '';
        for (let i = 0; i < max; i++) {
            hearts += i < current ? '❤️' : '🖤';
        }
        return hearts;
    }

    renderServices(coins, hp, maxHP) {
        return this.shop.services.map(service => {
            const canAfford = coins >= service.cost;
            const isNeeded = this.isServiceNeeded(service, hp, maxHP);
            const purchased = this.getServicePurchaseCount(service.id);
            const limitReached = service.limitPerPlayer && purchased >= service.limitPerPlayer;

            return `
                <div class="service-card ${!canAfford || !isNeeded || limitReached ? 'disabled' : ''}">
                    <div class="service-icon">${service.icon}</div>
                    <div class="service-info">
                        <h4>${service.name}</h4>
                        <p>${service.description}</p>
                        <div class="service-cost">💰 ${service.cost} monedas</div>
                        ${limitReached ? '<div class="limit-reached">Límite alcanzado</div>' : ''}
                        ${!isNeeded && !limitReached ? '<div class="not-needed">No lo necesitas ahora</div>' : ''}
                    </div>
                    <button
                        class="btn-purchase ${!canAfford || !isNeeded || limitReached ? 'disabled' : ''}"
                        onclick="window.purchaseService('${service.id}')"
                        ${!canAfford || !isNeeded || limitReached ? 'disabled' : ''}
                    >
                        ${canAfford && isNeeded && !limitReached ? 'Comprar' : 'No disponible'}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderItems(coins) {
        return this.shop.items.map(item => {
            const canAfford = coins >= item.cost;
            const stock = this.getItemStock(item.id, item.stock);

            return `
                <div class="item-card ${!canAfford || stock <= 0 ? 'disabled' : ''}">
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.description}</p>
                        <div class="item-footer">
                            <div class="item-cost">💰 ${item.cost}</div>
                            <div class="item-stock">Stock: ${stock}</div>
                        </div>
                    </div>
                    <button
                        class="btn-purchase ${!canAfford || stock <= 0 ? 'disabled' : ''}"
                        onclick="window.purchaseItem('${item.id}')"
                        ${!canAfford || stock <= 0 ? 'disabled' : ''}
                    >
                        ${stock > 0 ? (canAfford ? 'Comprar' : 'Sin fondos') : 'Agotado'}
                    </button>
                </div>
            `;
        }).join('');
    }

    isServiceNeeded(service, hp, maxHP) {
        switch (service.effect.type) {
            case 'heal':
                return hp < maxHP;
            case 'heal_full':
                return hp < maxHP;
            case 'increase_max_hp':
                return maxHP < 10; // Límite máximo de corazones
            default:
                return true;
        }
    }

    getServicePurchaseCount(serviceId) {
        return parseInt(localStorage.getItem(`healer_service_${serviceId}`) || '0');
    }

    incrementServicePurchase(serviceId) {
        const count = this.getServicePurchaseCount(serviceId);
        localStorage.setItem(`healer_service_${serviceId}`, count + 1);
    }

    getItemStock(itemId, initialStock) {
        const purchased = parseInt(localStorage.getItem(`healer_item_${itemId}`) || '0');
        return Math.max(0, initialStock - purchased);
    }

    decrementItemStock(itemId) {
        const purchased = parseInt(localStorage.getItem(`healer_item_${itemId}`) || '0');
        localStorage.setItem(`healer_item_${itemId}`, purchased + 1);
    }

    purchaseService(serviceId) {
        const service = this.shop.services.find(s => s.id === serviceId);
        if (!service) return;

        const coins = this.getPlayerCoins();
        if (coins < service.cost) {
            this.showMessage('❌ No tienes suficientes monedas');
            return;
        }

        // Cobrar
        localStorage.setItem('playerCoins', coins - service.cost);

        // Aplicar efecto
        this.applyEffect(service.effect);

        // Incrementar contador
        this.incrementServicePurchase(serviceId);

        // Mostrar confirmación
        this.showPurchaseConfirmation(service.name, service.icon);

        // Refrescar UI
        setTimeout(() => {
            document.querySelector('.healer-modal')?.remove();
            this.interact();
        }, 1500);
    }

    purchaseItem(itemId) {
        const item = this.shop.items.find(i => i.id === itemId);
        if (!item) return;

        const coins = this.getPlayerCoins();
        if (coins < item.cost) {
            this.showMessage('❌ No tienes suficientes monedas');
            return;
        }

        const stock = this.getItemStock(itemId, item.stock);
        if (stock <= 0) {
            this.showMessage('❌ Este item está agotado');
            return;
        }

        // Cobrar
        localStorage.setItem('playerCoins', coins - item.cost);

        // Reducir stock
        this.decrementItemStock(itemId);

        // Aplicar efecto
        this.applyEffect(item.effect, item);

        // Mostrar confirmación
        this.showPurchaseConfirmation(item.name, item.icon);

        // Refrescar UI
        setTimeout(() => {
            document.querySelector('.healer-modal')?.remove();
            this.interact();
        }, 1500);
    }

    applyEffect(effect, item = null) {
        switch (effect.type) {
            case 'heal':
                const currentHP = this.getPlayerHP();
                const maxHP = this.getMaxHP();
                const newHP = Math.min(maxHP, currentHP + effect.amount);
                localStorage.setItem('currentLives', newHP);
                this.showHealingAnimation(effect.amount);
                break;

            case 'heal_full':
                const maxLives = this.getMaxHP();
                localStorage.setItem('currentLives', maxLives);
                this.showHealingAnimation(maxLives);
                break;

            case 'increase_max_hp':
                const currentMax = this.getMaxHP();
                const currentLives = this.getPlayerHP();
                localStorage.setItem('maxLives', currentMax + effect.amount);
                localStorage.setItem('currentLives', currentLives + effect.amount);
                break;

            case 'healing_potion':
                this.addToInventory({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    effect: 'restore_hp',
                    amount: effect.amount
                });
                break;

            case 'xp':
                const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
                localStorage.setItem('playerXP', currentXP + effect.amount);
                break;

            case 'skill':
                const skillKey = `player${effect.skill.charAt(0).toUpperCase() + effect.skill.slice(1)}`;
                const currentSkill = parseInt(localStorage.getItem(skillKey) || '0');
                localStorage.setItem(skillKey, Math.min(5, currentSkill + effect.amount));
                break;

            case 'buff':
                this.applyBuff(effect.buff, effect.duration);
                break;
        }

        // Emitir evento
        if (this.scene.events) {
            this.scene.events.emit('healer_purchase', { effect, item });
        }
    }

    applyBuff(buffType, duration) {
        const buff = {
            type: buffType,
            expiresAt: Date.now() + duration
        };
        localStorage.setItem(`active_buff_${buffType}`, JSON.stringify(buff));
    }

    addToInventory(item) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        if (!inventory.items) inventory.items = [];
        inventory.items.push(item);
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    showHealingAnimation(amount) {
        const animation = document.createElement('div');
        animation.className = 'healing-animation';
        animation.innerHTML = `
            <div class="healing-effect">
                ${'💚'.repeat(amount)}
                <div class="healing-text">+${amount} HP</div>
            </div>
        `;
        document.body.appendChild(animation);

        setTimeout(() => {
            animation.classList.add('fade-out');
            setTimeout(() => animation.remove(), 500);
        }, 2000);
    }

    showPurchaseConfirmation(itemName, icon) {
        const confirmation = document.createElement('div');
        confirmation.className = 'purchase-confirmation';
        confirmation.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">${icon}</div>
                <div class="confirmation-text">¡Comprado!</div>
                <div class="confirmation-item">${itemName}</div>
            </div>
        `;
        document.body.appendChild(confirmation);

        setTimeout(() => {
            confirmation.classList.add('fade-out');
            setTimeout(() => confirmation.remove(), 500);
        }, 1500);
    }

    showMessage(text) {
        const message = document.createElement('div');
        message.className = 'healer-message';
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 500);
        }, 2000);
    }

    getPlayerCoins() {
        return parseInt(localStorage.getItem('playerCoins') || '0');
    }

    getPlayerHP() {
        return parseInt(localStorage.getItem('currentLives') || '3');
    }

    getMaxHP() {
        return parseInt(localStorage.getItem('maxLives') || '3');
    }
}

// Global functions
window.switchHealerTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.healer-tab-content').forEach(tab => tab.classList.add('hidden'));

    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.remove('hidden');
};

window.purchaseService = function(serviceId) {
    if (window.currentHealer) {
        window.currentHealer.purchaseService(serviceId);
    }
};

window.purchaseItem = function(itemId) {
    if (window.currentHealer) {
        window.currentHealer.purchaseItem(itemId);
    }
};
