class TaskManager {
    constructor(scene) {
        this.scene = scene;
        this.tasks = new Map();
        this.completedTasks = [];
        this.currentTask = null;

        this.aiEvaluator = new AIEvaluator();
        this.evaluationUI = new EvaluationUIHTML(scene, this.aiEvaluator);

        this.loadTasks();
    }

    async loadTasks() {
        try {
            const response = await fetch('data/npcs/npc-tasks.json');
            const data = await response.json();

            // Organizar tareas por NPC
            Object.keys(data).forEach(npcId => {
                this.tasks.set(npcId, data[npcId].tasks);
            });

            console.log('📋 Tareas cargadas para', this.tasks.size, 'NPCs');
        } catch (error) {
            console.error('Error cargando tareas:', error);
        }
    }

    setApiKey(apiKey) {
        this.aiEvaluator.setApiKey(apiKey);
    }

    /**
     * Obtiene las tareas de un NPC
     */
    getTasksForNPC(npcId) {
        return this.tasks.get(npcId) || [];
    }

    /**
     * Obtiene la siguiente tarea disponible para un NPC
     */
    getNextTask(npcId) {
        const tasks = this.getTasksForNPC(npcId);
        if (!tasks || tasks.length === 0) return null;

        // Buscar la primera tarea no completada
        for (const task of tasks) {
            if (!this.isTaskCompleted(task.id)) {
                return task;
            }
        }

        return null; // Todas las tareas completadas
    }

    /**
     * Inicia una tarea de evaluación
     */
    startTask(npcData, task) {
        this.currentTask = {
            npc: npcData,
            task: task,
            attempts: 0,
            startTime: Date.now()
        };

        // Mostrar UI de evaluación
        this.evaluationUI.show(
            npcData,
            task.concept,
            task,
            (answer) => this.evaluateAnswer(answer)
        );
    }

    /**
     * Evalúa la respuesta del jugador usando IA
     */
    async evaluateAnswer(playerAnswer) {
        if (!this.currentTask) return;

        this.currentTask.attempts++;

        // Mostrar feedback de "evaluando..."
        this.evaluationUI.showFeedback('🤔 Evaluando tu respuesta...', true);

        try {
            const result = await this.aiEvaluator.evaluateAnswer(
                this.currentTask.npc.id,
                this.currentTask.task.concept,
                playerAnswer,
                {
                    npcData: this.currentTask.npc,
                    playerLevel: this.scene.playerLevel || 1,
                    attempts: this.currentTask.attempts,
                    evaluationContext: this.currentTask.task.evaluation_context
                }
            );

            this.handleEvaluationResult(result);

        } catch (error) {
            console.error('Error evaluando:', error);
            this.evaluationUI.showFeedback(
                'Error al evaluar. Por favor, intenta de nuevo.',
                false
            );
        }
    }

    /**
     * Maneja el resultado de la evaluación
     */
    handleEvaluationResult(result) {
        console.log('📊 Resultado evaluación:', result);

        // Mostrar feedback de la IA
        this.evaluationUI.showFeedback(result.feedback, result.passed);

        if (result.passed) {
            // El jugador aprobó
            this.scene.time.delayedCall(2000, () => {
                this.completeTask(result);
            });
        } else {
            // El jugador no aprobó, puede reintentar
            if (this.currentTask.attempts >= 3) {
                // Después de 3 intentos, mostrar pista
                this.evaluationUI.showFeedback(
                    result.feedback + '\n\n💡 Pista: ' + this.getHint(),
                    false
                );
            }
        }

        // Ejecutar comandos de la IA
        this.executeCommands(result.commands);
    }

    /**
     * Completa una tarea exitosamente
     */
    completeTask(result) {
        if (!this.currentTask) return;

        const task = this.currentTask.task;
        const completedNpcId = this.currentTask.npc.id;

        // Marcar como completada
        this.completedTasks.push({
            taskId: task.id,
            npcId: completedNpcId,
            score: result.score,
            attempts: this.currentTask.attempts,
            completedAt: Date.now(),
            timeTaken: Date.now() - this.currentTask.startTime
        });

        // Guardar progreso
        this.saveProgress();

        // Aplicar recompensas
        this.applyRewards(task.reward);

        // Mostrar pantalla de GOAL ALCANZADO
        this.evaluationUI.showGoalScreen(
            task.concept,
            result.score,
            `¡Has dominado ${task.title}!\n${result.feedback}`
        );

        // Emitir evento para retirar al NPC
        this.scene.events.emit('npc_task_completed', completedNpcId);

        // Limpiar tarea actual
        this.currentTask = null;
    }

    /**
     * Aplica las recompensas de completar una tarea
     */
    applyRewards(reward) {
        if (!reward) return;

        // XP
        if (reward.xp) {
            this.scene.events.emit('add_xp', reward.xp);

            // Actualizar XP en HUD (simulado por ahora)
            const currentXP = (this.scene.playerXP || 0) + reward.xp;
            this.scene.playerXP = currentXP;
            this.evaluationUI.updateXPBar(currentXP % 100, 100);
        }

        // Amistad con NPC
        if (reward.friendship && this.currentTask) {
            const npc = this.scene.npcManager?.getNPC(this.currentTask.npc.id);
            if (npc) {
                npc.addFriendship(reward.friendship);
            }
        }

        // Actualizar skills según el concepto completado
        if (this.currentTask && this.currentTask.task.concept) {
            this.updateSkillProgress(this.currentTask.task.concept);
        }

        // Desbloquear siguiente tarea
        if (reward.unlock_next) {
            console.log('🔓 Desbloqueada tarea:', reward.unlock_next);
        }

        // Items (si existen)
        if (reward.items) {
            reward.items.forEach(item => {
                this.scene.events.emit('add_item', item);
            });
        }
    }

    /**
     * Actualiza el progreso de skills en el HUD
     */
    updateSkillProgress(concept) {
        // Inicializar skills si no existen
        if (!this.scene.playerSkills) {
            this.scene.playerSkills = { html: 0, css: 0, javascript: 0 };
        }

        // Determinar qué skill mejorar según el concepto
        const conceptLower = concept.toLowerCase();
        if (conceptLower.includes('html') || conceptLower.includes('semántic')) {
            this.scene.playerSkills.html = Math.min(5, this.scene.playerSkills.html + 1);
        } else if (conceptLower.includes('css') || conceptLower.includes('flexbox') || conceptLower.includes('grid')) {
            this.scene.playerSkills.css = Math.min(5, this.scene.playerSkills.css + 1);
        } else if (conceptLower.includes('javascript') || conceptLower.includes('js') || conceptLower.includes('async')) {
            this.scene.playerSkills.javascript = Math.min(5, this.scene.playerSkills.javascript + 1);
        }

        // Actualizar HUD
        this.evaluationUI.updateSkills(
            this.scene.playerSkills.html,
            this.scene.playerSkills.css,
            this.scene.playerSkills.javascript
        );
    }

    /**
     * Ejecuta comandos especiales de la IA
     */
    executeCommands(commands) {
        if (!commands || commands.length === 0) return;

        commands.forEach(cmd => {
            switch (cmd) {
                case 'SHOW_GOAL':
                    // Ya se maneja en completeTask
                    break;

                case 'SHOW_HINT':
                    const hint = this.getHint();
                    this.evaluationUI.showFeedback('💡 Pista: ' + hint, true);
                    break;

                case 'RETRY':
                    // Permitir reintentar
                    break;

                case 'INCREASE_FRIENDSHIP':
                    if (this.currentTask) {
                        const npc = this.scene.npcManager?.getNPC(this.currentTask.npc.id);
                        if (npc) npc.addFriendship(5);
                    }
                    break;

                default:
                    console.log('Comando desconocido:', cmd);
            }
        });
    }

    /**
     * Obtiene una pista para la tarea actual
     */
    getHint() {
        if (!this.currentTask) return '';

        const context = this.currentTask.task.evaluation_context;
        if (context && context.key_points && context.key_points.length > 0) {
            const randomIndex = Math.floor(Math.random() * context.key_points.length);
            return context.key_points[randomIndex];
        }

        return 'Intenta explicar el concepto con más detalle.';
    }

    /**
     * Verifica si una tarea está completada
     */
    isTaskCompleted(taskId) {
        return this.completedTasks.some(t => t.taskId === taskId);
    }

    /**
     * Obtiene el progreso del jugador
     */
    getProgress() {
        const totalTasks = Array.from(this.tasks.values()).reduce(
            (sum, tasks) => sum + tasks.length,
            0
        );

        return {
            completed: this.completedTasks.length,
            total: totalTasks,
            percentage: Math.round((this.completedTasks.length / totalTasks) * 100)
        };
    }

    /**
     * Guarda el progreso en LocalStorage
     */
    saveProgress() {
        try {
            localStorage.setItem('task_progress', JSON.stringify(this.completedTasks));
        } catch (error) {
            console.error('Error guardando progreso:', error);
        }
    }

    /**
     * Carga el progreso desde LocalStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('task_progress');
            if (saved) {
                this.completedTasks = JSON.parse(saved);
                console.log('📚 Progreso cargado:', this.completedTasks.length, 'tareas completadas');
            }
        } catch (error) {
            console.error('Error cargando progreso:', error);
        }
    }

    /**
     * Resetea todo el progreso
     */
    resetProgress() {
        this.completedTasks = [];
        localStorage.removeItem('task_progress');
        this.aiEvaluator.clearAllHistory();
    }
}
