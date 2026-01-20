# 🎭 Plan: Sistema de Diálogos RPG con NPCs Inteligentes

## 🎯 Objetivo Principal
Crear un sistema donde el jugador pueda interactuar con **100+ NPCs** (amigos) que lo guíen en su aprendizaje. Cada NPC tiene:
- Conversaciones dirigidas (pre-escritas)
- Conversaciones generadas por IA
- Animación de boca sincronizada con diálogo
- Personalidad única
- Objetivos específicos que otorgan al jugador

---

## 📋 Componentes del Sistema

### 1. NPCs Temáticos por Tecnología

```javascript
const npcCategories = {
    html: [
        { id: 'mentor_html', name: 'Elder Tim', role: 'Maestro HTML', personality: 'sabio' },
        { id: 'friend_html_1', name: 'Div', role: 'Especialista en Estructura', personality: 'amigable' },
        { id: 'friend_html_2', name: 'Semantic Sally', role: 'Experta en Semántica', personality: 'perfeccionista' }
    ],
    css: [
        { id: 'mentor_css', name: 'Cascadia', role: 'Maestra de Estilos', personality: 'artística' },
        { id: 'friend_css_1', name: 'Flexbox Fred', role: 'Guru del Layout', personality: 'relajado' },
        { id: 'friend_css_2', name: 'Grid Greta', role: 'Arquitecta de Diseño', personality: 'organizada' }
    ],
    javascript: [
        { id: 'mentor_js', name: 'Script Sensei', role: 'Maestro JavaScript', personality: 'enigmático' },
        { id: 'friend_js_1', name: 'Async Andy', role: 'Especialista en Promesas', personality: 'impaciente' },
        { id: 'friend_js_2', name: 'Loop Lucy', role: 'Reina de Iteraciones', personality: 'repetitiva' }
    ],
    react: [
        { id: 'mentor_react', name: 'Hook Master', role: 'Maestro React', personality: 'moderno' },
        { id: 'friend_react_1', name: 'State Steve', role: 'Gestor de Estados', personality: 'ansioso' },
        { id: 'friend_react_2', name: 'Component Claire', role: 'Diseñadora de Componentes', personality: 'modular' }
    ]
    // ... más categorías para backend, devops, etc.
};
```

### 2. Sistema de Personalidades

Cada NPC tiene una personalidad que afecta su forma de hablar:

```javascript
const personalities = {
    sabio: {
        tone: 'formal, reflexivo, usa metáforas',
        greeting: 'Ah, joven aprendiz...',
        farewell: 'Que la sabiduría te acompañe.',
        aiPrompt: 'Habla como un mentor sabio y antiguo, usa metáforas sobre código y programación'
    },
    amigable: {
        tone: 'casual, alegre, usa emojis',
        greeting: '¡Hey! ¿Qué tal? 😊',
        farewell: '¡Nos vemos pronto!',
        aiPrompt: 'Habla como un amigo cercano y entusiasta del código, usa lenguaje casual'
    },
    perfeccionista: {
        tone: 'técnico, preciso, detallista',
        greeting: 'Saludos. Vayamos al grano.',
        farewell: 'Asegúrate de hacerlo correctamente.',
        aiPrompt: 'Habla como un perfeccionista técnico obsesionado con los detalles'
    },
    enigmático: {
        tone: 'misterioso, críptico, filosófico',
        greeting: '...',
        farewell: 'Todo se revelará a su tiempo.',
        aiPrompt: 'Habla de forma misteriosa usando acertijos sobre programación'
    },
    relajado: {
        tone: 'chill, sin estrés, bromista',
        greeting: 'Ey, tranqui. ¿Qué necesitas?',
        farewell: 'Chill, bro.',
        aiPrompt: 'Habla de forma relajada y con humor sobre programación'
    }
};
```

### 3. Sistema de Relación con NPCs

```javascript
const npcRelationship = {
    id: 'mentor_html',
    name: 'Elder Tim',

    // Nivel de amistad (0-100)
    friendship: 0,

    // Niveles de relación
    relationshipLevel: {
        0: 'Desconocido',
        20: 'Conocido',
        40: 'Amigo',
        60: 'Buen Amigo',
        80: 'Mejor Amigo',
        100: 'Mentor de Vida'
    },

    // Conversaciones desbloqueadas
    unlockedDialogues: ['intro', 'quest_1'],

    // Misiones otorgadas
    questsGiven: ['html_basics', 'first_form'],
    questsCompleted: ['html_basics'],

    // Regalos dados
    giftsReceived: ['coffee', 'book_html'],

    // Veces hablado
    conversationCount: 5,

    // Última conversación
    lastInteraction: Date.now()
};
```

---

## 🗣️ Sistema de Diálogos

### Estructura de Diálogos Pre-escritos

```json
{
  "npc_id": "mentor_html",
  "dialogues": [
    {
      "id": "first_meeting",
      "trigger": "first_interaction",
      "nodes": [
        {
          "id": "node_1",
          "speaker": "mentor_html",
          "text": "Ah, un nuevo rostro. Bienvenido a mi humilde taller de estructuras.",
          "emotion": "neutral",
          "next": "node_2"
        },
        {
          "id": "node_2",
          "speaker": "mentor_html",
          "text": "Dime, joven... ¿conoces la diferencia entre un <div> y un <span>?",
          "emotion": "curious",
          "choices": [
            {
              "text": "Claro, uno es block y otro inline",
              "next": "node_correct",
              "friendship": 5,
              "requirements": { "skill_html": 1 }
            },
            {
              "text": "No tengo idea...",
              "next": "node_teach",
              "friendship": 2
            },
            {
              "text": "¿Para qué sirve eso?",
              "next": "node_sarcastic",
              "friendship": -1
            }
          ]
        },
        {
          "id": "node_correct",
          "speaker": "mentor_html",
          "text": "¡Excelente! Veo que has estudiado. Permíteme enseñarte más.",
          "emotion": "happy",
          "reward": { "xp": 10 },
          "next": "end"
        },
        {
          "id": "node_teach",
          "speaker": "mentor_html",
          "text": "No te preocupes, todos empezamos desde cero. Déjame explicarte...",
          "emotion": "teaching",
          "next": "end"
        },
        {
          "id": "node_sarcastic",
          "speaker": "mentor_html",
          "text": "*suspira* Tenemos mucho trabajo por hacer...",
          "emotion": "disappointed",
          "next": "end"
        }
      ]
    },
    {
      "id": "quest_html_basics",
      "trigger": "manual",
      "requirements": { "friendship": 10 },
      "nodes": [
        {
          "id": "quest_start",
          "speaker": "mentor_html",
          "text": "Creo que estás listo para tu primera misión. ¿Aceptas el desafío?",
          "emotion": "serious",
          "choices": [
            {
              "text": "¡Por supuesto!",
              "action": "give_quest",
              "quest_id": "html_basics",
              "next": "quest_accepted"
            },
            {
              "text": "Aún no estoy listo",
              "next": "quest_declined"
            }
          ]
        }
      ]
    }
  ]
}
```

### Sistema de Diálogos Generados por IA

```javascript
class AIDialogueGenerator {
    constructor() {
        this.apiKey = 'YOUR_ANTHROPIC_API_KEY'; // Claude API
        this.conversationHistory = new Map();
    }

    async generateResponse(npcId, npcData, playerMessage, context) {
        const npc = npcData;
        const personality = personalities[npc.personality];
        const history = this.conversationHistory.get(npcId) || [];

        const systemPrompt = `
Eres ${npc.name}, ${npc.role} en un juego educativo de programación.

PERSONALIDAD: ${personality.aiPrompt}
ROL: Ayudar al jugador a aprender ${npc.specialty}
NIVEL DE AMISTAD: ${context.friendship}/100
NIVEL DEL JUGADOR: ${context.playerLevel}
HABILIDADES DEL JUGADOR: ${JSON.stringify(context.playerSkills)}

REGLAS:
1. Mantén respuestas cortas (2-3 oraciones máximo)
2. Si el jugador está confundido, ofrece ayuda
3. Si el jugador domina el tema, propón retos más difíciles
4. Usa el tono de personalidad: ${personality.tone}
5. Si el nivel de amistad es bajo (<20), sé más distante
6. Si el nivel de amistad es alto (>60), sé más personal y bromista
7. Ocasionalmente sugiere misiones o recursos relevantes
8. NUNCA salgas del personaje

CONTEXTO ACTUAL:
- El jugador está aprendiendo: ${context.currentTopic}
- Última misión completada: ${context.lastQuestCompleted}
- Desafío actual: ${context.currentChallenge || 'ninguno'}
`;

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 200,
                    system: systemPrompt,
                    messages: [
                        ...history,
                        { role: 'user', content: playerMessage }
                    ]
                })
            });

            const data = await response.json();
            const npcResponse = data.content[0].text;

            // Guardar en historial
            history.push(
                { role: 'user', content: playerMessage },
                { role: 'assistant', content: npcResponse }
            );
            this.conversationHistory.set(npcId, history);

            return {
                text: npcResponse,
                emotion: this.detectEmotion(npcResponse),
                friendship_change: this.calculateFriendshipChange(playerMessage, npcResponse)
            };

        } catch (error) {
            console.error('Error generando diálogo IA:', error);
            return this.getFallbackResponse(npc);
        }
    }

    detectEmotion(text) {
        // Análisis simple de emociones basado en palabras clave
        if (text.includes('¡') || text.includes('excelente') || text.includes('genial')) {
            return 'happy';
        } else if (text.includes('...') || text.includes('hmm')) {
            return 'thinking';
        } else if (text.includes('¿')) {
            return 'curious';
        }
        return 'neutral';
    }

    calculateFriendshipChange(playerMsg, npcResponse) {
        // Lógica simple para calcular cambio de amistad
        const positivePhrases = ['gracias', 'ayuda', 'entiendo', 'aprendí'];
        const negativePhrases = ['no me importa', 'aburrido', 'whatever'];

        let change = 0;
        positivePhrases.forEach(phrase => {
            if (playerMsg.toLowerCase().includes(phrase)) change += 2;
        });
        negativePhrases.forEach(phrase => {
            if (playerMsg.toLowerCase().includes(phrase)) change -= 2;
        });

        return Math.max(-5, Math.min(5, change));
    }

    clearHistory(npcId) {
        this.conversationHistory.delete(npcId);
    }
}
```

---

## 👄 Sistema de Animación de Boca

### Opción 1: Sprites de Boca (Simple)

```javascript
class MouthAnimator {
    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;

        // Sprites de boca (4 estados)
        this.mouthSprites = {
            closed: 'mouth_closed',
            open_small: 'mouth_open_s',
            open_medium: 'mouth_open_m',
            open_large: 'mouth_open_l'
        };

        this.currentMouth = null;
        this.isAnimating = false;
    }

    startTalking(text, duration) {
        this.isAnimating = true;
        const totalChars = text.length;
        const charDuration = duration / totalChars; // ms por carácter

        let charIndex = 0;
        const interval = setInterval(() => {
            if (charIndex >= totalChars || !this.isAnimating) {
                this.setMouth('closed');
                clearInterval(interval);
                return;
            }

            // Animación basada en vocales y consonantes
            const char = text[charIndex].toLowerCase();
            if ('aeiouáéíóú'.includes(char)) {
                // Vocales abiertas
                this.setMouth(['open_medium', 'open_large'][Math.floor(Math.random() * 2)]);
            } else if (char === ' ') {
                this.setMouth('closed');
            } else {
                // Consonantes
                this.setMouth('open_small');
            }

            charIndex++;
        }, charDuration);
    }

    setMouth(state) {
        if (this.currentMouth) {
            this.currentMouth.destroy();
        }

        const mouthSprite = this.mouthSprites[state];
        this.currentMouth = this.scene.add.image(
            this.npc.x,
            this.npc.y + 20, // Posición de la boca en el sprite
            mouthSprite
        );
    }

    stopTalking() {
        this.isAnimating = false;
        this.setMouth('closed');
    }
}
```

### Opción 2: Animación Procesal (Avanzada)

```javascript
class ProceduralMouthAnimator {
    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;

        // Crear gráfico de boca usando Graphics
        this.mouthGraphic = scene.add.graphics();
        this.mouthX = npc.x;
        this.mouthY = npc.y + 20;

        this.openAmount = 0; // 0-1
        this.targetOpen = 0;
    }

    update() {
        // Suavizar apertura (lerp)
        this.openAmount += (this.targetOpen - this.openAmount) * 0.3;
        this.drawMouth();
    }

    drawMouth() {
        this.mouthGraphic.clear();

        const width = 20;
        const maxHeight = 15;
        const height = maxHeight * this.openAmount;

        // Dibujar boca elíptica
        this.mouthGraphic.fillStyle(0x000000);
        this.mouthGraphic.beginPath();
        this.mouthGraphic.ellipse(
            this.mouthX,
            this.mouthY,
            width,
            height / 2
        );
        this.mouthGraphic.fillPath();

        // Lengua (solo si está muy abierta)
        if (this.openAmount > 0.6) {
            this.mouthGraphic.fillStyle(0xff6b6b);
            this.mouthGraphic.fillEllipse(
                this.mouthX,
                this.mouthY + height * 0.3,
                width * 0.6,
                height * 0.3
            );
        }
    }

    talkAnimation(text, duration) {
        const phonemes = this.textToPhonemes(text);
        const phonemeDuration = duration / phonemes.length;

        let index = 0;
        const interval = setInterval(() => {
            if (index >= phonemes.length) {
                this.targetOpen = 0;
                clearInterval(interval);
                return;
            }

            this.targetOpen = phonemes[index].openAmount;
            index++;
        }, phonemeDuration);
    }

    textToPhonemes(text) {
        // Convertir texto a "fonemas" (niveles de apertura)
        return text.split('').map(char => {
            const lower = char.toLowerCase();
            if ('aáeéoó'.includes(lower)) return { openAmount: 0.9 };
            if ('iíuú'.includes(lower)) return { openAmount: 0.4 };
            if ('bcdfg'.includes(lower)) return { openAmount: 0.6 };
            if ('mnñ'.includes(lower)) return { openAmount: 0.3 };
            if (char === ' ') return { openAmount: 0 };
            return { openAmount: 0.5 };
        });
    }
}
```

### Opción 3: Sync con Audio (Profesional)

```javascript
class AudioMouthSync {
    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    async playWithSync(audioUrl, text) {
        // Cargar audio
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        // Crear source
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Play
        source.start(0);

        // Analizar en tiempo real
        const animate = () => {
            if (source.playbackState === 'FINISHED') return;

            this.analyser.getByteFrequencyData(this.dataArray);

            // Calcular volumen promedio
            const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
            const normalized = average / 255; // 0-1

            // Abrir boca según volumen
            this.setMouthOpen(normalized);

            requestAnimationFrame(animate);
        };

        animate();
    }

    setMouthOpen(amount) {
        // Implementar apertura de boca
        this.npc.mouthScale = 0.5 + (amount * 0.5);
    }
}
```

---

## 🎮 Sistema de Misiones por NPC

```javascript
const npcQuests = {
    mentor_html: [
        {
            id: 'html_first_steps',
            title: 'Primeros Pasos en HTML',
            description: 'Elder Tim quiere que demuestres tu conocimiento básico de HTML.',
            objectives: [
                { type: 'complete_lesson', target: 'html_basics', progress: 0, total: 1 },
                { type: 'create_page', target: 'simple_page', progress: 0, total: 1 }
            ],
            rewards: {
                xp: 50,
                friendship: 10,
                item: 'badge_html_basics',
                unlocks: ['dialogue_mentor_html_advanced']
            },
            onComplete: {
                dialogue: 'quest_complete_html_first',
                nextQuest: 'html_semantic'
            }
        }
    ],
    friend_css_1: [
        {
            id: 'flexbox_master',
            title: 'Dominando Flexbox',
            description: 'Flexbox Fred te desafía a crear 3 layouts diferentes usando solo flexbox.',
            objectives: [
                { type: 'create_layout', target: 'flexbox_header', progress: 0, total: 1 },
                { type: 'create_layout', target: 'flexbox_gallery', progress: 0, total: 1 },
                { type: 'create_layout', target: 'flexbox_footer', progress: 0, total: 1 }
            ],
            rewards: {
                xp: 75,
                friendship: 15,
                item: 'title_flexbox_guru',
                skill_points: { css: 5 }
            }
        }
    ]
};
```

---

## 🏗️ Arquitectura de Implementación

### Estructura de Archivos

```
game/
├── npc-system/
│   ├── npc-manager.js              # Gestor principal de NPCs
│   ├── dialogue-engine.js          # Motor de diálogos
│   ├── ai-dialogue-generator.js    # Generación con IA
│   ├── mouth-animator.js           # Animación de boca
│   ├── relationship-manager.js     # Sistema de amistad
│   └── quest-giver.js              # Sistema de misiones
├── data/
│   ├── npcs/
│   │   ├── npcs.json               # Lista de todos los NPCs
│   │   ├── personalities.json      # Definición de personalidades
│   │   └── npc-locations.json      # Posiciones en el mundo
│   ├── dialogues/
│   │   ├── mentor_html.json        # Diálogos de cada NPC
│   │   ├── friend_css_1.json
│   │   └── ...
│   └── quests/
│       ├── html-quests.json
│       ├── css-quests.json
│       └── ...
├── assets/
│   ├── npcs/
│   │   ├── portraits/              # Retratos para diálogos
│   │   ├── sprites/                # Sprites animados
│   │   └── mouths/                 # Sprites de bocas
│   ├── audio/
│   │   ├── voices/                 # Audio de voces (opcional)
│   │   └── sfx/
│   │       ├── dialogue_beep.mp3
│   │       └── dialogue_end.mp3
│   └── ui/
│       ├── dialogue_box.png
│       ├── choice_button.png
│       └── friendship_bar.png
└── scenes/
    └── dialogue-scene.js           # Escena dedicada a diálogos
```

---

## 📝 Plan de Implementación (8 Semanas)

### **Semana 1-2: Fundación del Sistema**

#### Día 1-3: NPCs Básicos
- [ ] Crear clase `NPC` base
- [ ] Sistema de carga de NPCs desde JSON
- [ ] Posicionamiento en el mundo
- [ ] Indicador de interacción (tecla E)

#### Día 4-7: Diálogos Pre-escritos
- [ ] Crear `DialogueEngine` class
- [ ] Parser de JSON de diálogos
- [ ] Sistema de nodos y ramificaciones
- [ ] Caja de diálogo UI básica

#### Día 8-10: Sistema de Elecciones
- [ ] Botones de opciones
- [ ] Sistema de condiciones (requirements)
- [ ] Saltos entre nodos
- [ ] Efectos de elecciones (XP, friendship)

#### Día 11-14: UI del Diálogo
- [ ] Diseño de caja de diálogo estilo RPG
- [ ] Portrait del NPC
- [ ] Efecto typewriter
- [ ] Animación de entrada/salida

---

### **Semana 3-4: Sistema de Relaciones**

#### Día 15-17: Friendship System
- [ ] Clase `RelationshipManager`
- [ ] Barra de amistad visual
- [ ] Niveles de relación
- [ ] Persistencia en LocalStorage

#### Día 18-21: Desbloqueo de Contenido
- [ ] Diálogos bloqueados por nivel de amistad
- [ ] Sistema de "regalos" para NPCs
- [ ] Eventos especiales por nivel de amistad
- [ ] Indicador visual de nuevo contenido

#### Día 22-24: NPC Status Panel
- [ ] Panel de "Amigos" (lista de NPCs)
- [ ] Ver stats de cada NPC
- [ ] Historial de conversaciones
- [ ] Quest log por NPC

#### Día 25-28: Encuentros Aleatorios
- [ ] Sistema de spawn aleatorio de NPCs
- [ ] "Encuentros especiales" en el mapa
- [ ] Mini-eventos con NPCs
- [ ] Recompensas por encuentros

---

### **Semana 5-6: Integración con IA**

#### Día 29-32: Setup de IA
- [ ] Integración con API de Claude/GPT
- [ ] Clase `AIDialogueGenerator`
- [ ] Sistema de prompts por personalidad
- [ ] Manejo de contexto y memoria

#### Día 33-36: Conversaciones Inteligentes
- [ ] Toggle entre diálogo dirigido vs IA
- [ ] Input de texto libre del jugador
- [ ] Análisis de respuestas (emociones)
- [ ] Actualización dinámica de relación

#### Día 37-39: Sistema Híbrido
- [ ] Diálogos dirigidos con "salidas" a IA
- [ ] IA sugiere misiones basadas en progreso
- [ ] Respuestas contextuales según habilidades
- [ ] Fallback a respuestas pre-escritas

#### Día 40-42: Optimización
- [ ] Caché de respuestas comunes
- [ ] Rate limiting de API
- [ ] Modo offline con respuestas básicas
- [ ] Costos y límites de tokens

---

### **Semana 7: Animación de Boca**

#### Día 43-45: Sprites de Boca
- [ ] Crear sprites (closed, open_s, open_m, open_l)
- [ ] Clase `MouthAnimator`
- [ ] Sincronización con texto
- [ ] Análisis de fonemas básico

#### Día 46-48: Animación Procesal
- [ ] Boca dibujada con Graphics
- [ ] Interpolación suave (lerp)
- [ ] Variación según vocal/consonante
- [ ] Lengua y dientes opcionales

#### Día 49: Audio Sync (Opcional)
- [ ] Web Audio API integration
- [ ] Análisis de frecuencia
- [ ] Apertura basada en volumen
- [ ] TTS integration (opcional)

---

### **Semana 8: Sistema de Misiones + Polish**

#### Día 50-52: Quest Giver System
- [ ] NPCs otorgan misiones específicas
- [ ] UI de aceptar/rechazar quest
- [ ] Tracking de progreso
- [ ] Recompensas al completar

#### Día 53-55: 100 Amigos Achievement
- [ ] Contador de NPCs conocidos
- [ ] Achievement "Conocer 10/25/50/100 amigos"
- [ ] Bonus por coleccionar todos
- [ ] Galería de NPCs

#### Día 56-58: Polish y Testing
- [ ] Sonidos de diálogo (beeps)
- [ ] Partículas al subir amistad
- [ ] Notificaciones de nuevo diálogo
- [ ] Testing completo

---

## 🎨 Ejemplo de UI del Sistema

```
┌──────────────────────────────────────────────────────────┐
│  [PORTRAIT]    ELDER TIM                    ♥♥♥♥♡ (80)  │
│   ╔════════╗   Maestro HTML - Nivel Mentor              │
│   ║ [o_o]  ║                                             │
│   ║   ▼    ║   "Ah, veo que has completado la misión.  │
│   ╚════════╝    Tu progreso es admirable..."            │
│                                                           │
│                 ╔═════════════════════════════════════╗ │
│                 ║ > ¡Muchas gracias por enseñarme!    ║ │
│                 ║   Preguntarle sobre HTML avanzado   ║ │
│                 ║   [IA] Escribir mi propia respuesta ║ │
│                 ╚═════════════════════════════════════╝ │
│                                                           │
│  [ESC] Salir   [SPACE] Continuar   [TAB] Lista Amigos  │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Código de Ejemplo: Integración Completa

### npc-manager.js

```javascript
class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.dialogueEngine = new DialogueEngine(scene);
        this.aiGenerator = new AIDialogueGenerator();
        this.relationshipManager = new RelationshipManager();

        this.loadNPCs();
    }

    async loadNPCs() {
        const npcData = await fetch('data/npcs/npcs.json').then(r => r.json());

        npcData.forEach(data => {
            const npc = new NPC(this.scene, data);
            this.npcs.set(data.id, npc);

            // Cargar relación guardada
            const relationship = this.relationshipManager.load(data.id);
            npc.setRelationship(relationship);
        });
    }

    getNPC(id) {
        return this.npcs.get(id);
    }

    async interact(npcId, playerData) {
        const npc = this.getNPC(npcId);
        if (!npc) return;

        // Verificar si tiene diálogo dirigido disponible
        const scriptedDialogue = this.dialogueEngine.getAvailableDialogue(npcId, playerData);

        if (scriptedDialogue) {
            // Usar diálogo pre-escrito
            this.dialogueEngine.start(scriptedDialogue, npc);
        } else {
            // Usar IA para generar conversación
            this.startAIConversation(npc, playerData);
        }
    }

    async startAIConversation(npc, playerData) {
        // Abrir UI de input de texto
        const playerInput = await this.scene.showTextInput('¿Qué quieres decir?');

        // Generar respuesta con IA
        const context = {
            friendship: npc.friendship,
            playerLevel: playerData.level,
            playerSkills: playerData.skills,
            currentTopic: playerData.currentLearningTopic,
            lastQuestCompleted: playerData.lastQuestCompleted
        };

        const response = await this.aiGenerator.generateResponse(
            npc.id,
            npc.data,
            playerInput,
            context
        );

        // Mostrar respuesta con animación de boca
        npc.mouthAnimator.startTalking(response.text, response.text.length * 50);
        await this.scene.showDialogue(npc, response.text, response.emotion);

        // Actualizar relación
        npc.addFriendship(response.friendship_change);
        this.relationshipManager.save(npc.id, npc.getRelationship());
    }
}
```

### npc.js

```javascript
class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, data) {
        super(scene, data.x, data.y, data.sprite);
        scene.add.existing(this);

        this.id = data.id;
        this.name = data.name;
        this.role = data.role;
        this.personality = data.personality;
        this.specialty = data.specialty;

        this.friendship = 0;
        this.conversationCount = 0;
        this.questsGiven = [];
        this.questsCompleted = [];

        // Sistema de animación de boca
        this.mouthAnimator = new MouthAnimator(scene, this);

        // Indicador de interacción
        this.interactIndicator = scene.add.text(data.x, data.y - 50, '[E]', {
            fontSize: '16px',
            color: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 }
        });
        this.interactIndicator.setOrigin(0.5);
        this.interactIndicator.setVisible(false);

        this.setInteractive();
    }

    showInteractIndicator() {
        this.interactIndicator.setVisible(true);
        this.scene.tweens.add({
            targets: this.interactIndicator,
            y: this.y - 60,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    hideInteractIndicator() {
        this.interactIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(this.interactIndicator);
    }

    addFriendship(amount) {
        this.friendship = Math.max(0, Math.min(100, this.friendship + amount));

        // Efecto visual
        if (amount > 0) {
            this.showHeartParticles();
        }
    }

    showHeartParticles() {
        const emitter = this.scene.add.particles(this.x, this.y - 30, '❤️', {
            speed: { min: 50, max: 100 },
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 3
        });

        this.scene.time.delayedCall(1000, () => emitter.destroy());
    }

    getRelationshipLevel() {
        if (this.friendship >= 80) return 'Mejor Amigo';
        if (this.friendship >= 60) return 'Buen Amigo';
        if (this.friendship >= 40) return 'Amigo';
        if (this.friendship >= 20) return 'Conocido';
        return 'Desconocido';
    }
}
```

---

## 🎯 Objetivos del Sistema

### Corto Plazo
- 10 NPCs funcionales con diálogos pre-escritos
- Sistema básico de amistad
- Animación simple de boca

### Mediano Plazo
- 50 NPCs con personalidades únicas
- Integración completa con IA
- Sistema de misiones por NPC

### Largo Plazo
- 100+ NPCs ("100 Amigos")
- Conversaciones dinámicas avanzadas
- Audio sync profesional
- Sistema de eventos especiales con NPCs

---

## 💰 Consideraciones de Costos (API IA)

### Claude API (Anthropic)
- **Modelo recomendado**: Claude 3.5 Sonnet
- **Costo**: ~$3 por 1M tokens de entrada, ~$15 por 1M tokens de salida
- **Tokens por conversación**: ~500 tokens (promedio)
- **Costo por conversación**: ~$0.01
- **100 conversaciones**: ~$1

### Alternativas
1. **OpenAI GPT-4o-mini**: Más barato (~$0.15/$0.60 por 1M tokens)
2. **Local LLM**: Usar Llama 3 o Mistral local (gratis pero requiere hardware)
3. **Hybrid**: Respuestas simples pre-escritas, IA solo para casos complejos

---

## ✅ Checklist Final

### MVP (Mínimo Viable)
- [ ] 5 NPCs con sprites básicos
- [ ] Diálogos pre-escritos funcionando
- [ ] Sistema de amistad básico
- [ ] Animación de boca simple
- [ ] 1 quest por NPC

### Full System
- [ ] 100 NPCs implementados
- [ ] Integración IA completa
- [ ] Input de texto libre
- [ ] Animación procesal de boca
- [ ] Sistema de eventos especiales
- [ ] Galería de amigos
- [ ] Achievements relacionados

---

**¿Por dónde empezamos? Te recomiendo:**
1. **Semana 1-2 primero** (fundación)
2. Crear 3 NPCs de prueba
3. Implementar diálogos pre-escritos
4. Agregar animación de boca básica
5. Luego expandir con IA
