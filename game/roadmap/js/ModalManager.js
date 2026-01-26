class ModalManager {
    constructor() {
        this.modal = document.getElementById('modal');
        this.modalContent = this.modal.querySelector('.modal-content');
        this.setupCloseHandlers();
    }

    showModal(nodeData) {
        const isLocked = nodeData.locked === true;

        if (isLocked) {
            this.modalContent.classList.add('modal-locked');
        } else {
            this.modalContent.classList.remove('modal-locked');
        }

        let html = this.buildModalHTML(nodeData, isLocked);
        this.modalContent.innerHTML = html;

        this.modal.style.display = 'block';
        setTimeout(() => this.modal.classList.add('show'), 10);

        this.setupCloseHandlers();
    }

    buildModalHTML(nodeData, isLocked) {
        const statusIcon = nodeData.active ? '✓' : nodeData.locked ? '🔒' : '○';
        const statusBg = nodeData.active
            ? 'rgba(16, 185, 129, 0.2)'
            : nodeData.locked
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(255, 255, 255, 0.08)';

        const iconFilter = isLocked ? 'grayscale(1) opacity(0.6)' : 'none';

        let content = `
            <span class="close">&times;</span>
            <div class="modal-header">
                <span class="status-icon" style="background: ${statusBg}">${statusIcon}</span>
                <img class="modal-icon" src="${nodeData.icon}" alt="icon" style="filter: ${iconFilter}">
                <h2>${nodeData.title}</h2>
                ${this.buildRating(nodeData, isLocked)}
                ${this.buildDifficultyBadge(nodeData)}
            </div>
            <div class="modal-body">
        `;

        if (isLocked) {
            const requiresText = nodeData.requires && nodeData.requires.length > 0
                ? `Debes completar primero: <strong>${nodeData.requires.join(', ')}</strong>`
                : 'Este nodo está bloqueado';
            content += `<div class="modal-locked-warning">🔒 ${requiresText}</div>`;
        }

        content += `<p class="modal-description">${nodeData.description || 'Sin descripción disponible'}</p>`;

        if (!isLocked) {
            if (nodeData.what_is) {
                content += `
                    <div class="modal-section">
                        <h3>¿Qué es?</h3>
                        <p>${nodeData.what_is}</p>
                    </div>
                `;
            }

            if (nodeData.why_learn) {
                content += `
                    <div class="modal-section">
                        <h3>¿Por qué aprender?</h3>
                        <p>${nodeData.why_learn}</p>
                    </div>
                `;
            }

            if (nodeData.key_concepts && nodeData.key_concepts.length > 0) {
                content += `
                    <div class="modal-section">
                        <h3>Conceptos clave</h3>
                        <ul>
                            ${nodeData.key_concepts.map(concept => `<li>${concept}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (nodeData.use_cases && nodeData.use_cases.length > 0) {
                content += `
                    <div class="modal-section">
                        <h3>Casos de uso</h3>
                        <ul>
                            ${nodeData.use_cases.map(useCase => `<li>${useCase}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (nodeData.relation_with_nodes && Object.keys(nodeData.relation_with_nodes).length > 0) {
                content += `
                    <div class="modal-section">
                        <h3>Relación con otras tecnologías</h3>
                        <div class="modal-relations">
                            ${Object.entries(nodeData.relation_with_nodes).map(([nodeId, relation]) => `
                                <div class="modal-relation-item">
                                    <strong>${nodeId.toUpperCase()}</strong>: ${relation}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (nodeData.estimated_time || nodeData.prerequisites) {
                content += `<div class="modal-section modal-meta">`;
                if (nodeData.estimated_time) {
                    content += `<div class="modal-meta-item">⏱️ <strong>Tiempo estimado:</strong> ${nodeData.estimated_time}</div>`;
                }
                if (nodeData.prerequisites) {
                    content += `<div class="modal-meta-item">📚 <strong>Prerequisitos:</strong> ${nodeData.prerequisites}</div>`;
                }
                content += `</div>`;
            }

            if (nodeData.resources && nodeData.resources.length > 0) {
                content += `
                    <div class="modal-section">
                        <h3>Recursos de aprendizaje</h3>
                        <div class="modal-resources">
                            ${nodeData.resources.map(resource => `
                                <a href="${resource.url}" target="_blank" class="modal-resource-link">
                                    📖 ${resource.name}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        content += `
            </div>
            <div class="modal-footer">
                <div class="modal-actions">
                    ${this.buildActionButtons(nodeData, isLocked)}
                </div>
            </div>
        `;

        return content;
    }

    buildRating(nodeData, isLocked) {
        if (!nodeData.rating || isLocked) return '';

        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= nodeData.rating ? 'star' : 'star empty';
            stars += `<span class="${starClass}">★</span>`;
        }

        return `<div class="modal-rating">${stars}</div>`;
    }

    buildDifficultyBadge(nodeData) {
        if (!nodeData.difficulty) return '';

        const difficultyColors = {
            'Principiante': '#10b981',
            'Principiante-Intermedio': '#3b82f6',
            'Intermedio': '#f59e0b',
            'Intermedio-Avanzado': '#ef4444',
            'Avanzado': '#dc2626'
        };

        const color = difficultyColors[nodeData.difficulty] || '#6b7280';

        return `
            <div class="modal-difficulty" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                ${nodeData.difficulty}
            </div>
        `;
    }

    buildActionButtons(nodeData, isLocked) {
        let buttons = '';

        if (nodeData.url) {
            const disabled = isLocked ? 'style="opacity: 0.5; pointer-events: none;"' : '';
            buttons += `
                <a href="${nodeData.url}" target="_blank" class="btn-primary" ${disabled}>
                    <span>→</span>
                    <span>Empezar aprendizaje</span>
                </a>
            `;
        }

        return buttons;
    }

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => this.modal.style.display = 'none', 250);
    }

    setupCloseHandlers() {
        const closeBtn = this.modalContent.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.closeModal();
        };
    }
}
