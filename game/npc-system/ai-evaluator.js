class AIEvaluator {
    constructor() {
        this.apiKey = null;
        this.conversationHistory = new Map();
        this.provider = 'openai'; // 'openai' o 'claude'
        this.model = 'gpt-4o-mini';
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    setProvider(provider) {
        this.provider = provider;
        if (provider === 'openai') {
            this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
            this.model = 'gpt-4o-mini';
        } else if (provider === 'claude') {
            this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
            this.model = 'claude-3-5-sonnet-20241022';
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            const config = await response.json();

            // Usar OpenAI por defecto
            this.setProvider('openai');

            if (config.OPENAI_API_KEY) {
                this.setApiKey(config.OPENAI_API_KEY);
            }

            if (config.OPENAI_MODEL) {
                this.model = config.OPENAI_MODEL;
            }

            console.log('✅ Config AI cargada: OpenAI', this.model);
            return true;
        } catch (error) {
            console.warn('⚠️ No se pudo cargar config.json');
            return false;
        }
    }

    /**
     * Evalúa la respuesta del jugador sobre un concepto
     * @param {string} npcId - ID del NPC evaluador
     * @param {string} concept - Concepto a evaluar (ej: "regresión lineal")
     * @param {string} playerAnswer - Respuesta del jugador en sus propias palabras
     * @param {object} context - Contexto adicional (nivel del jugador, historial, etc.)
     * @returns {object} Resultado de la evaluación
     */
    async evaluateAnswer(npcId, concept, playerAnswer, context = {}) {
        if (!this.apiKey) {
            console.error('API Key no configurada');
            return this.getFallbackEvaluation(false);
        }

        const systemPrompt = this.buildEvaluationPrompt(npcId, concept, context);
        const history = this.conversationHistory.get(npcId) || [];

        try {
            let data;

            if (this.provider === 'openai') {
                // OpenAI API
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...history,
                            {
                                role: 'user',
                                content: `El estudiante explica "${concept}" así:\n\n"${playerAnswer}"\n\nEvalúa esta respuesta.`
                            }
                        ],
                        max_tokens: 500,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`OpenAI Error ${response.status}: ${error}`);
                }

                data = await response.json();
                var aiResponse = data.choices[0].message.content;

            } else {
                // Claude API (mantener compatibilidad)
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        max_tokens: 500,
                        system: systemPrompt,
                        messages: [
                            ...history,
                            {
                                role: 'user',
                                content: `El estudiante explica "${concept}" así:\n\n"${playerAnswer}"\n\nEvalúa esta respuesta.`
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                data = await response.json();
                var aiResponse = data.content[0].text;
            }

            // Guardar en historial
            history.push(
                { role: 'user', content: playerAnswer },
                { role: 'assistant', content: aiResponse }
            );
            this.conversationHistory.set(npcId, history);

            // Parsear respuesta de IA
            return this.parseEvaluation(aiResponse);

        } catch (error) {
            console.error('Error evaluando con IA:', error);
            return this.getFallbackEvaluation(false, 'Error de conexión. Intenta de nuevo.');
        }
    }

    /**
     * Conversación libre con el NPC (modo exploración)
     */
    async freeConversation(npcId, npcData, playerMessage, context = {}) {
        if (!this.apiKey) {
            return {
                text: 'Lo siento, necesito configurar mi conexión para hablar libremente.',
                commands: []
            };
        }

        const systemPrompt = this.buildConversationPrompt(npcId, npcData, context);
        const history = this.conversationHistory.get(npcId) || [];

        try {
            let data;

            if (this.provider === 'openai') {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...history,
                            { role: 'user', content: playerMessage }
                        ],
                        max_tokens: 300,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`OpenAI Error ${response.status}: ${error}`);
                }

                data = await response.json();
                var aiResponse = data.choices[0].message.content;

            } else {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        max_tokens: 300,
                        system: systemPrompt,
                        messages: [
                            ...history,
                            { role: 'user', content: playerMessage }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                data = await response.json();
                var aiResponse = data.content[0].text;
            }

            history.push(
                { role: 'user', content: playerMessage },
                { role: 'assistant', content: aiResponse }
            );
            this.conversationHistory.set(npcId, history);

            return this.parseResponse(aiResponse);

        } catch (error) {
            console.error('Error en conversación:', error);
            return {
                text: 'Hmm, parece que tengo problemas para pensar ahora. Intenta de nuevo.',
                commands: []
            };
        }
    }

    buildEvaluationPrompt(npcId, concept, context) {
        const npcData = context.npcData || {};
        const personality = npcData.personality || 'sabio y amable';
        const name = npcData.name || 'Tutor';
        const role = npcData.role || 'tutor de programación';

        return `Eres ${name}, ${role}. Tu personalidad es: ${personality}.

IMPORTANTE: Habla siempre en primera persona como ${name}. Mantén tu personalidad en todo momento.
Ejemplo: Si eres un dragón sabio, di "Yo, el dragón sabio de las montañas..." en lugar de hablar genéricamente.

CONCEPTO A EVALUAR: "${concept}"

TU TAREA:
1. Evaluar si el estudiante entiende correctamente el concepto
2. Dar feedback constructivo EN TU ESTILO DE PERSONAJE
3. Usar comandos especiales para controlar la UI del juego

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder en este formato exacto:

[EVALUATION: PASS/FAIL]
[SCORE: 0-100]
[FEEDBACK: Tu feedback aquí EN TU PERSONALIDAD]
[COMMAND: nombre_comando]

COMANDOS DISPONIBLES:
- SHOW_GOAL: Muestra pantalla de objetivo alcanzado (solo si PASS)
- SHOW_HINT: Muestra una pista
- NEXT_TOPIC: Avanza al siguiente tema
- RETRY: Permite otro intento

CRITERIOS DE EVALUACIÓN:
- ¿Menciona los conceptos clave?
- ¿La explicación es correcta aunque use palabras simples?
- ¿Demuestra comprensión real o solo memorización?
- No exijas perfección, valora el entendimiento genuino

NIVEL DEL ESTUDIANTE: ${context.playerLevel || 'Principiante'}

IMPORTANTE: Responde como ${name} con personalidad ${personality}. Sé fiel a tu personaje pero mantén el formato requerido.`;
    }

    buildConversationPrompt(npcId, npcData, context) {
        return `Eres ${npcData.name}, ${npcData.role} en un juego educativo.

PERSONALIDAD: ${npcData.personality}
ESPECIALIDAD: ${npcData.specialty}
NIVEL DE AMISTAD: ${context.friendship}/100

REGLAS:
1. Responde en 2-3 oraciones máximo
2. Mantén tu personalidad (${npcData.personality})
3. Puedes usar comandos especiales en tus respuestas
4. Si el jugador te pregunta algo de tu especialidad, enséñale
5. Sé natural y conversacional

COMANDOS DISPONIBLES (úsalos cuando sea apropiado):
[COMMAND: GIVE_QUEST] - Ofreces una misión
[COMMAND: INCREASE_FRIENDSHIP] - Aumentas amistad
[COMMAND: SHOW_HINT] - Das una pista

Ejemplo de respuesta con comando:
"¡Excelente pregunta! Déjame explicarte... [COMMAND: INCREASE_FRIENDSHIP]"`;
    }

    parseEvaluation(aiResponse) {
        const result = {
            passed: false,
            score: 0,
            feedback: '',
            commands: [],
            rawResponse: aiResponse
        };

        // Parsear [EVALUATION: PASS/FAIL]
        const evalMatch = aiResponse.match(/\[EVALUATION:\s*(PASS|FAIL)\]/i);
        if (evalMatch) {
            result.passed = evalMatch[1].toUpperCase() === 'PASS';
        }

        // Parsear [SCORE: 0-100]
        const scoreMatch = aiResponse.match(/\[SCORE:\s*(\d+)\]/i);
        if (scoreMatch) {
            result.score = parseInt(scoreMatch[1]);
        }

        // Parsear [FEEDBACK: ...]
        const feedbackMatch = aiResponse.match(/\[FEEDBACK:\s*(.+?)(?:\[|$)/is);
        if (feedbackMatch) {
            result.feedback = feedbackMatch[1].trim();
        } else {
            // Si no hay formato, usar toda la respuesta
            result.feedback = aiResponse.replace(/\[.*?\]/g, '').trim();
        }

        // Parsear comandos
        const commandMatches = aiResponse.matchAll(/\[COMMAND:\s*(\w+)\]/gi);
        for (const match of commandMatches) {
            result.commands.push(match[1].toUpperCase());
        }

        return result;
    }

    parseResponse(aiResponse) {
        const result = {
            text: '',
            commands: []
        };

        // Extraer comandos
        const commandMatches = aiResponse.matchAll(/\[COMMAND:\s*(\w+)\]/gi);
        for (const match of commandMatches) {
            result.commands.push(match[1].toUpperCase());
        }

        // Texto limpio (sin comandos)
        result.text = aiResponse.replace(/\[COMMAND:.*?\]/gi, '').trim();

        return result;
    }

    getFallbackEvaluation(passed, customFeedback = null) {
        return {
            passed: passed,
            score: passed ? 70 : 30,
            feedback: customFeedback || (passed
                ? '¡Bien hecho! Tu explicación muestra comprensión del concepto.'
                : 'Tu respuesta está incompleta. Intenta explicar con más detalle.'),
            commands: passed ? ['SHOW_GOAL'] : ['RETRY'],
            rawResponse: 'Fallback response'
        };
    }

    clearHistory(npcId) {
        this.conversationHistory.delete(npcId);
    }

    clearAllHistory() {
        this.conversationHistory.clear();
    }

    /**
     * Genera un saludo personalizado del NPC usando IA
     */
    async generateGreeting(npcData) {
        if (!this.apiKey) {
            return `Soy ${npcData.name}, ${npcData.role}. ¡Empecemos!`;
        }

        const prompt = `Eres ${npcData.name}, ${npcData.role}.
Tu personalidad es: ${npcData.personality}

Genera un saludo corto (1-2 oraciones) en primera persona que muestre tu personalidad única.
El saludo debe:
- Reflejar tu personalidad (${npcData.personality})
- Ser amistoso pero fiel a tu carácter
- Mostrar quién eres de forma memorable
- NO exceder 2 oraciones

Ejemplo para un dragón sabio: "*rugido bajo* Soy Erick, dragón ancestral. Mi sabiduría es vasta, aunque mi apariencia pueda intimidarte."

Genera SOLO el saludo, sin explicaciones adicionales.`;

        try {
            let data;

            if (this.provider === 'openai') {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 100,
                        temperature: 0.8
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenAI Error ${response.status}`);
                }

                data = await response.json();
                return data.choices[0].message.content.trim();

            } else {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        max_tokens: 100,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                data = await response.json();
                return data.content[0].text.trim();
            }

        } catch (error) {
            console.error('Error generando saludo:', error);
            return `Soy ${npcData.name}, ${npcData.role}. ¡Empecemos!`;
        }
    }
}
