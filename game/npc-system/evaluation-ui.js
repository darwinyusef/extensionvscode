class EvaluationUI {
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

        this.createUI();
        this.createGoalScreen();
    }

    createUI() {
        // Cuadro de diálogo compacto tipo videojuego
        const width = 800;
        const height = 160;

        // Guardar dimensiones
        this.modalWidth = width;
        this.modalHeight = height;

        // Container que se posicionará dinámicamente (fixed a la cámara)
        this.container = this.scene.add.container(0, 0);
        this.container.setSize(width, height);
        this.container.setScrollFactor(0);
        this.container.setDepth(2000);
        this.container.setVisible(false);

        // Panel principal del diálogo (centrado en el container)
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(2, 0x00ff88);

        // Retrato del NPC (relativo al container)
        this.npcPortrait = this.scene.add.circle(-width/2 + 55, 0, 45, 0x3b82f6);
        this.npcPortrait.setStrokeStyle(2, 0x00ff88);

        // Nombre del NPC arriba del retrato
        this.npcNameText = this.scene.add.text(-width/2 + 55, -height/2 + 10, 'NPC Name', {
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#00ff88',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Concepto pequeño debajo
        this.conceptText = this.scene.add.text(-width/2 + 55, height/2 - 10, '', {
            fontSize: '11px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5, 1);

        // Indicador de paso/stage
        this.stageIndicator = this.scene.add.text(width/2 - 12, -height/2 + 10, '1/6', {
            fontSize: '12px',
            color: '#64748b',
            align: 'right'
        }).setOrigin(1, 0);

        // Contenido del diálogo (a la derecha del retrato)
        this.contentText = this.scene.add.text(-width/2 + 120, 0, '', {
            fontSize: '15px',
            color: '#ffffff',
            align: 'left',
            wordWrap: { width: width - 150 },
            lineSpacing: 4
        }).setOrigin(0, 0.5);

        // Crear DOM textarea para input
        this.createTextInput();

        // Botón "Siguiente >" con fondo clickeable
        const nextBtnBg = this.scene.add.rectangle(width/2 - 65, height/2 - 15, 120, 30, 0x00000000);
        nextBtnBg.setOrigin(0, 1);
        nextBtnBg.setInteractive({ useHandCursor: true });

        this.nextBtnText = this.scene.add.text(width/2 - 15, height/2 - 15, 'Siguiente >', {
            fontSize: '14px',
            color: '#00ff88',
            fontStyle: 'italic'
        }).setOrigin(1, 1);

        nextBtnBg.on('pointerover', () => {
            this.nextBtnText.setColor('#00cc66');
            this.nextBtnText.setScale(1.1);
        });

        nextBtnBg.on('pointerout', () => {
            this.nextBtnText.setColor('#00ff88');
            this.nextBtnText.setScale(1);
        });

        nextBtnBg.on('pointerdown', () => {
            this.nextStage();
        });

        this.nextBtnBg = nextBtnBg;

        // Botón "Enviar >" con fondo clickeable
        const submitBtnBg = this.scene.add.rectangle(width/2 - 65, height/2 - 15, 120, 30, 0x00000000);
        submitBtnBg.setOrigin(0, 1);
        submitBtnBg.setInteractive({ useHandCursor: true });
        submitBtnBg.setVisible(false);

        this.submitBtnText = this.scene.add.text(width/2 - 15, height/2 - 15, 'Enviar >', {
            fontSize: '14px',
            color: '#fbbf24',
            fontStyle: 'bold'
        }).setOrigin(1, 1);
        this.submitBtnText.setVisible(false);

        submitBtnBg.on('pointerover', () => {
            this.submitBtnText.setColor('#fcd34d');
            this.submitBtnText.setScale(1.1);
        });

        submitBtnBg.on('pointerout', () => {
            this.submitBtnText.setColor('#fbbf24');
            this.submitBtnText.setScale(1);
        });

        submitBtnBg.on('pointerdown', () => {
            this.submitAnswer();
        });

        this.submitBtnBg = submitBtnBg;

        // Botón cerrar pequeño
        const closeBtn = this.scene.add.text(width/2 - 12, -height/2 + 12, '×', {
            fontSize: '24px',
            color: '#64748b'
        }).setOrigin(0.5);

        const closeHitArea = new Phaser.Geom.Rectangle(-15, -15, 30, 30);
        closeBtn.setInteractive({
            hitArea: closeHitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff6b6b'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#64748b'));
        closeBtn.on('pointerdown', () => this.hide());

        this.container.add([
            bg,
            this.npcPortrait,
            this.npcNameText,
            this.conceptText,
            this.stageIndicator,
            this.contentText,
            this.nextBtnBg,
            this.nextBtnText,
            this.submitBtnBg,
            this.submitBtnText,
            closeBtn
        ]);
    }

    createTextInput() {
        // Crear textarea HTML más pequeño
        const textarea = document.createElement('textarea');
        textarea.id = 'evaluation-input';
        textarea.style.cssText = `
            width: 720px;
            height: 100px;
            padding: 10px;
            font-size: 15px;
            font-family: 'Segoe UI', sans-serif;
            background: #2a2a3e;
            color: #ffffff;
            border: 2px solid #00ff88;
            border-radius: 6px;
            resize: none;
            outline: none;
        `;
        textarea.placeholder = 'Escribe tu explicación aquí...';

        // Prevenir que Phaser capture eventos del teclado
        textarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        textarea.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });

        textarea.addEventListener('keypress', (e) => {
            e.stopPropagation();
        });

        // Crear DOM element de Phaser (posición temporal, se actualizará en show())
        this.textInputDOM = this.scene.add.dom(0, 0, textarea);
        this.textInputDOM.setDepth(2001);
        this.textInputDOM.setScrollFactor(0);
        this.textInputDOM.setVisible(false); // Oculto inicialmente
    }

    updateTextInputPosition() {
        if (this.textInputDOM && this.modalX && this.modalY) {
            this.textInputDOM.setPosition(this.modalX, this.modalY);
        }
    }


    createGoalScreen() {
        const width = 1000;
        const height = 700;

        this.goalContainer = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2
        );
        this.goalContainer.setScrollFactor(0);
        this.goalContainer.setDepth(3000);
        this.goalContainer.setVisible(false);
        this.goalContainer.setAlpha(0);

        // Overlay
        const overlay = this.scene.add.rectangle(0, 0, 2000, 2000, 0x000000, 0.9);

        // Panel
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 1);
        bg.setStrokeStyle(6, 0x00ff88);

        // Título gigante
        const title = this.scene.add.text(0, -200, '🎯 GOAL ALCANZADO 🎯', {
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Concepto aprendido
        this.goalConceptText = this.scene.add.text(0, -50, '', {
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5);

        // Score
        this.goalScoreText = this.scene.add.text(0, 50, '', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Mensaje
        this.goalMessageText = this.scene.add.text(0, 150, '', {
            fontSize: '24px',
            color: '#cbd5e1',
            align: 'center',
            wordWrap: { width: width - 150 }
        }).setOrigin(0.5);

        // Botón continuar
        const btnBg = this.scene.add.rectangle(0, 280, 250, 60, 0x00ff88);
        btnBg.setInteractive({ useHandCursor: true });

        const btnText = this.scene.add.text(0, 280, 'CONTINUAR', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#000000'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => btnBg.setScale(1.1));
        btnBg.on('pointerout', () => btnBg.setScale(1));
        btnBg.on('pointerdown', () => this.hideGoalScreen());

        this.goalContainer.add([
            overlay,
            bg,
            title,
            this.goalConceptText,
            this.goalScoreText,
            this.goalMessageText,
            btnBg,
            btnText
        ]);
    }

    async show(npcData, concept, taskData, onSubmit) {
        this.isVisible = true;
        this.currentNPC = npcData;
        this.currentConcept = concept;
        this.taskData = taskData;
        this.taskQuestion = taskData.question;
        this.onSubmitCallback = onSubmit;
        this.currentStage = 0;

        // Calcular y posicionar el modal dinámicamente
        const camWidth = this.scene.cameras.main.width;
        const camHeight = this.scene.cameras.main.height;
        const modalX = camWidth / 2;
        const modalY = camHeight - this.modalHeight/2 - 10;

        this.container.setPosition(modalX, modalY);

        // Guardar para textarea
        this.modalX = modalX;
        this.modalY = modalY;

        // Actualizar posición del textarea
        this.updateTextInputPosition();

        // Actualizar header
        this.npcNameText.setText(npcData.name);
        this.conceptText.setText(`Tema: ${concept}`);

        // Deshabilitar controles de Phaser
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = false;
        }

        // Ocultar textarea inicialmente
        if (this.textInputDOM) {
            this.textInputDOM.setVisible(false);
        }

        // Mostrar con animación
        this.container.setVisible(true);
        this.container.setAlpha(0);

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        // Generar saludo con IA (async)
        this.contentText.setText('💭 El NPC está preparando su saludo...');
        if (this.aiEvaluator) {
            this.aiEvaluator.generateGreeting(npcData).then(greeting => {
                this.generatedGreeting = greeting;
                this.updateStageContent();
            }).catch(error => {
                console.error('Error generando saludo:', error);
                this.generatedGreeting = `Soy ${npcData.name}, ${npcData.role}.`;
                this.updateStageContent();
            });
        } else {
            this.generatedGreeting = `Soy ${npcData.name}, ${npcData.role}.`;
            this.updateStageContent();
        }
    }

    updateStageContent() {
        // Stage 0: Presentación del NPC
        // Stage 1: Introducción al tópico (qué es)
        // Stage 2: Por qué es importante
        // Stage 3: La tarea/pregunta específica
        // Stage 4: Input del usuario
        // Stage 5: Feedback del NPC

        const totalStages = 6;

        switch (this.currentStage) {
            case 0: // Presentación del NPC
                this.stageIndicator.setText(`1/${totalStages}`);
                this.contentText.setText(`${this.generatedGreeting}`);
                this.nextBtnText.setText('Siguiente >');
                this.nextBtnText.setVisible(true);
                this.nextBtnBg.setVisible(true);
                this.submitBtnText.setVisible(false);
                this.submitBtnBg.setVisible(false);
                if (this.textInputDOM) this.textInputDOM.setVisible(false);
                break;

            case 1: // Introducción al tópico
                this.stageIndicator.setText(`2/${totalStages}`);
                const topicIntro = `${this.getTopicIntroduction()}`;
                this.contentText.setText(topicIntro);
                this.nextBtnText.setText('Siguiente >');
                this.nextBtnText.setVisible(true);
                this.nextBtnBg.setVisible(true);
                this.submitBtnText.setVisible(false);
                this.submitBtnBg.setVisible(false);
                if (this.textInputDOM) this.textInputDOM.setVisible(false);
                break;

            case 2: // Por qué es importante
                this.stageIndicator.setText(`3/${totalStages}`);
                const importance = `${this.getTopicImportance()}`;
                this.contentText.setText(importance);
                this.nextBtnText.setText('Siguiente >');
                this.nextBtnText.setVisible(true);
                this.nextBtnBg.setVisible(true);
                this.submitBtnText.setVisible(false);
                this.submitBtnBg.setVisible(false);
                if (this.textInputDOM) this.textInputDOM.setVisible(false);
                break;

            case 3: // La tarea/pregunta
                this.stageIndicator.setText(`4/${totalStages}`);
                this.contentText.setText(`${this.taskQuestion}`);
                this.nextBtnText.setText('Comenzar >');
                this.nextBtnText.setVisible(true);
                this.nextBtnBg.setVisible(true);
                this.submitBtnText.setVisible(false);
                this.submitBtnBg.setVisible(false);
                if (this.textInputDOM) this.textInputDOM.setVisible(false);
                break;

            case 4: // Input del usuario
                this.stageIndicator.setText(`5/${totalStages}`);
                this.contentText.setText('Explica el concepto con tus propias palabras:');
                this.nextBtnText.setVisible(false);
                this.nextBtnBg.setVisible(false);
                this.submitBtnText.setVisible(true);
                this.submitBtnBg.setVisible(true);
                if (this.textInputDOM) {
                    this.textInputDOM.setVisible(true);
                    const textarea = document.getElementById('evaluation-input');
                    if (textarea) {
                        textarea.value = '';
                        setTimeout(() => textarea.focus(), 100);
                    }
                }
                break;

            case 5: // Feedback
                this.stageIndicator.setText(`6/${totalStages}`);
                // El contenido se actualiza en showFeedback()
                this.nextBtnText.setText('Continuar >');
                this.nextBtnText.setVisible(true);
                this.nextBtnBg.setVisible(true);
                this.submitBtnText.setVisible(false);
                this.submitBtnBg.setVisible(false);
                if (this.textInputDOM) this.textInputDOM.setVisible(false);
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
            // Si ya pasó el stage 5 (feedback), cerrar
            this.hide();
        }
    }

    submitAnswer() {
        const textarea = document.getElementById('evaluation-input');
        if (!textarea) return;

        const answer = textarea.value.trim();

        if (answer.length < 10) {
            this.showFeedback('Por favor, escribe una explicación más completa (mínimo 10 caracteres)', false);
            return;
        }

        if (this.onSubmitCallback) {
            this.onSubmitCallback(answer);
        }
    }

    showFeedback(feedback, isPositive = true) {
        // Mover al stage 5 (feedback)
        this.currentStage = 5;

        // Ocultar textarea
        if (this.textInputDOM) {
            this.textInputDOM.setVisible(false);
        }

        // Configurar el contenido del feedback con color
        const icon = isPositive ? '✅' : '❌';
        const color = isPositive ? '#00ff88' : '#ff6b6b';

        // Mostrar feedback del NPC en formato narrativo
        this.contentText.setText(`${icon} ${this.currentNPC.name}:\n\n"${feedback}"`);
        this.contentText.setColor(color);

        // Si aprobó, el botón dirá "Ver recompensa >", sino "Reintentar >"
        if (isPositive) {
            this.nextBtnText.setText('Ver recompensa >');
            this.nextBtnText.setColor('#fbbf24'); // Dorado
        } else {
            this.nextBtnText.setText('Reintentar >');
            this.nextBtnText.setColor('#ff6b6b'); // Rojo
            // Si falla, volver al stage 3 (la pregunta) cuando hace click
            this.nextBtnBg.off('pointerdown');
            this.nextBtnBg.on('pointerdown', () => {
                this.currentStage = 3; // Volver al stage de la pregunta
                this.contentText.setColor('#ffffff'); // Restaurar color
                this.nextBtnText.setColor('#00ff88'); // Restaurar color del botón
                this.nextBtnBg.off('pointerdown');
                this.nextBtnBg.on('pointerdown', () => this.nextStage());
                this.nextStage();
            });
        }

        // Actualizar visibilidad de botones
        this.stageIndicator.setText('6/6');
        this.nextBtnText.setVisible(true);
        this.nextBtnBg.setVisible(true);
        this.submitBtnText.setVisible(false);
        this.submitBtnBg.setVisible(false);
    }

    showGoalScreen(concept, score, message) {
        this.goalConceptText.setText(`Has dominado:\n"${concept}"`);
        this.goalScoreText.setText(`Score: ${score}/100`);
        this.goalMessageText.setText(message);

        // Ocultar el modal de evaluación y textarea
        this.container.setVisible(false);
        if (this.textInputDOM) {
            this.textInputDOM.setVisible(false);
        }

        this.goalContainer.setVisible(true);
        this.goalContainer.setScale(0.5);
        this.goalContainer.setAlpha(0);

        // Animación de entrada explosiva
        this.scene.tweens.add({
            targets: this.goalContainer,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Partículas de celebración
        this.createCelebrationParticles();
    }

    createCelebrationParticles() {
        const emitter = this.scene.add.particles(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            'player', // Reusa alguna textura existente
            {
                speed: { min: 200, max: 400 },
                scale: { start: 0.5, end: 0 },
                rotate: { start: 0, end: 360 },
                lifespan: 2000,
                quantity: 3,
                frequency: 100,
                blendMode: 'ADD'
            }
        );

        emitter.setDepth(3001);

        this.scene.time.delayedCall(3000, () => {
            emitter.stop();
            this.scene.time.delayedCall(2000, () => emitter.destroy());
        });
    }

    hideGoalScreen() {
        // Habilitar controles de Phaser nuevamente
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = true;
        }

        this.scene.tweens.add({
            targets: this.goalContainer,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.goalContainer.setVisible(false);
                this.hide();
            }
        });
    }

    hide() {
        // Habilitar controles de Phaser nuevamente
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = true;
        }

        // Ocultar textarea
        if (this.textInputDOM) {
            this.textInputDOM.setVisible(false);
        }

        // Restaurar colores
        this.contentText.setColor('#ffffff');
        this.nextBtnText.setColor('#00ff88');

        // Restaurar evento del botón siguiente
        this.nextBtnBg.off('pointerdown');
        this.nextBtnBg.on('pointerdown', () => this.nextStage());
        this.nextBtnText.setText('Siguiente >');

        // Reiniciar stage
        this.currentStage = 0;

        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.container.setVisible(false);
                this.isVisible = false;
            }
        });
    }

    destroy() {
        if (this.textInputDOM) {
            this.textInputDOM.destroy();
        }
        this.container.destroy();
        this.goalContainer.destroy();
    }
}
