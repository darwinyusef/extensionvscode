class EvaluationUIHTML {
    constructor(scene, aiEvaluator = null) {
        this.scene = scene;
        this.aiEvaluator = aiEvaluator;
        this.isVisible = false;
        this.currentNPC = null;
        this.currentConcept = null;
        this.onSubmitCallback = null;
        this.currentStage = 0;
        this.generatedGreeting = '';
        this.taskQuestion = '';
        this.taskData = null;

        this.initElements();
        this.attachEvents();
    }

    initElements() {
        this.modal = document.getElementById('evaluation-modal');
        this.portrait = document.getElementById('npc-portrait');
        this.npcName = document.getElementById('npc-name');
        this.conceptLabel = document.getElementById('concept-label');
        this.stageIndicator = document.getElementById('stage-indicator');
        this.modalText = document.getElementById('modal-text');
        this.btnNext = document.getElementById('btn-next');
        this.btnSubmit = document.getElementById('btn-submit');
        this.btnClose = document.getElementById('btn-close');
        this.textarea = document.getElementById('evaluation-textarea');
    }

    attachEvents() {
        this.btnNext.addEventListener('click', () => this.nextStage());
        this.btnSubmit.addEventListener('click', () => this.submitAnswer());
        this.btnClose.addEventListener('click', () => this.hide());
    }

    async show(npcData, concept, taskData, onSubmit) {
        this.isVisible = true;
        this.currentNPC = npcData;
        this.currentConcept = concept;
        this.taskData = taskData;
        this.taskQuestion = taskData.question;
        this.onSubmitCallback = onSubmit;
        this.currentStage = 0;

        // Actualizar header
        this.npcName.textContent = npcData.name;
        this.conceptLabel.textContent = `Tema: ${concept}`;
        this.portrait.textContent = npcData.name.charAt(0);

        // Deshabilitar controles de Phaser
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = false;
        }

        // Mostrar modal
        this.modal.classList.add('active');
        this.textarea.classList.remove('active');

        // Generar saludo con IA
        this.modalText.textContent = '💭 El NPC está preparando su saludo...';
        if (this.aiEvaluator) {
            try {
                this.generatedGreeting = await this.aiEvaluator.generateGreeting(npcData);
            } catch (error) {
                console.error('Error generando saludo:', error);
                this.generatedGreeting = `Soy ${npcData.name}, ${npcData.role}.`;
            }
        } else {
            this.generatedGreeting = `Soy ${npcData.name}, ${npcData.role}.`;
        }

        this.updateStageContent();
    }

    updateStageContent() {
        const totalStages = 6;

        switch (this.currentStage) {
            case 0: // Presentación del NPC
                this.stageIndicator.textContent = `1/${totalStages}`;
                this.modalText.textContent = this.generatedGreeting;
                this.btnNext.textContent = 'Siguiente >';
                this.btnNext.style.display = 'block';
                this.btnSubmit.style.display = 'none';
                this.textarea.classList.remove('active');
                break;

            case 1: // Introducción al tópico
                this.stageIndicator.textContent = `2/${totalStages}`;
                this.modalText.textContent = this.getTopicIntroduction();
                this.btnNext.textContent = 'Siguiente >';
                this.btnNext.style.display = 'block';
                this.btnSubmit.style.display = 'none';
                this.textarea.classList.remove('active');
                break;

            case 2: // Por qué es importante
                this.stageIndicator.textContent = `3/${totalStages}`;
                this.modalText.textContent = this.getTopicImportance();
                this.btnNext.textContent = 'Siguiente >';
                this.btnNext.style.display = 'block';
                this.btnSubmit.style.display = 'none';
                this.textarea.classList.remove('active');
                break;

            case 3: // La tarea/pregunta
                this.stageIndicator.textContent = `4/${totalStages}`;
                this.modalText.textContent = this.taskQuestion;
                this.btnNext.textContent = 'Comenzar >';
                this.btnNext.style.display = 'block';
                this.btnSubmit.style.display = 'none';
                this.textarea.classList.remove('active');
                break;

            case 4: // Input del usuario
                this.stageIndicator.textContent = `5/${totalStages}`;
                this.modalText.textContent = 'Explica el concepto con tus propias palabras:';
                this.btnNext.style.display = 'none';
                this.btnSubmit.style.display = 'block';
                this.textarea.classList.add('active');
                this.textarea.value = '';
                setTimeout(() => this.textarea.focus(), 100);
                break;

            case 5: // Feedback
                this.stageIndicator.textContent = `6/${totalStages}`;
                this.btnNext.textContent = 'Continuar >';
                this.btnNext.style.display = 'block';
                this.btnSubmit.style.display = 'none';
                this.textarea.classList.remove('active');
                break;
        }
    }

    getTopicIntroduction() {
        if (!this.taskData) return `Vamos a aprender sobre ${this.currentConcept}.`;

        if (this.taskData.evaluation_context && this.taskData.evaluation_context.topic) {
            return `Vamos a hablar sobre ${this.taskData.evaluation_context.topic}.\n\nEste es un concepto fundamental que todo desarrollador debe conocer.`;
        }

        return `Hoy aprenderemos sobre ${this.currentConcept}.\n\nPresta atención, esto será importante.`;
    }

    getTopicImportance() {
        if (!this.taskData || !this.taskData.evaluation_context) {
            return `Dominar ${this.currentConcept} te ayudará a ser mejor desarrollador.`;
        }

        const context = this.taskData.evaluation_context;
        const keyPoints = context.key_points || [];

        if (keyPoints.length > 0) {
            const points = keyPoints.slice(0, 2).map(point => `• ${point}`).join('\n');
            return `Este concepto es esencial porque:\n\n${points}`;
        }

        return `Dominar ${this.currentConcept} te permitirá escribir código más efectivo y profesional.`;
    }

    nextStage() {
        this.currentStage++;
        if (this.currentStage <= 5) {
            this.updateStageContent();
        } else {
            this.hide();
        }
    }

    submitAnswer() {
        const answer = this.textarea.value.trim();

        if (answer.length < 10) {
            this.showFeedback('Por favor, escribe una explicación más completa (mínimo 10 caracteres)', false);
            return;
        }

        if (this.onSubmitCallback) {
            this.onSubmitCallback(answer);
        }
    }

    showFeedback(feedback, isPositive = true) {
        this.currentStage = 5;
        this.textarea.classList.remove('active');

        const icon = isPositive ? '✅' : '❌';
        const color = isPositive ? '#00ff88' : '#ff6b6b';

        this.modalText.innerHTML = `<span style="color: ${color}">${icon} ${this.currentNPC.name}:</span><br><br>"${feedback}"`;

        if (isPositive) {
            this.btnNext.textContent = 'Ver recompensa >';
            this.btnNext.style.color = '#fbbf24';
        } else {
            this.btnNext.textContent = 'Reintentar >';
            this.btnNext.style.color = '#ff6b6b';

            // Remover listeners anteriores y agregar nuevo
            const newBtn = this.btnNext.cloneNode(true);
            this.btnNext.parentNode.replaceChild(newBtn, this.btnNext);
            this.btnNext = newBtn;

            this.btnNext.addEventListener('click', () => {
                this.currentStage = 3;
                this.modalText.style.color = '#ffffff';
                this.btnNext.style.color = '#00ff88';

                // Restaurar listener original
                const originalBtn = this.btnNext.cloneNode(true);
                this.btnNext.parentNode.replaceChild(originalBtn, this.btnNext);
                this.btnNext = originalBtn;
                this.btnNext.addEventListener('click', () => this.nextStage());

                this.nextStage();
            });
        }

        this.stageIndicator.textContent = '6/6';
        this.btnNext.style.display = 'block';
        this.btnSubmit.style.display = 'none';
    }

    showGoalScreen(concept, score, message) {
        // Por ahora simplemente cerramos el modal
        // TODO: Implementar goal screen separado
        alert(`🎯 GOAL ALCANZADO!\n\n${concept}\nScore: ${score}/100\n\n${message}`);
        this.hide();
    }

    hide() {
        // Habilitar controles de Phaser
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = true;
        }

        // Ocultar modal y textarea
        this.modal.classList.remove('active');
        this.textarea.classList.remove('active');
        this.textarea.value = '';

        // Restaurar colores
        this.modalText.style.color = '#ffffff';
        this.btnNext.style.color = '#00ff88';
        this.btnNext.textContent = 'Siguiente >';

        // Reiniciar
        this.currentStage = 0;
        this.isVisible = false;
    }

    destroy() {
        // Cleanup si es necesario
    }
}
