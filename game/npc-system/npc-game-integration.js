// Sistema de integración de NPCs sin modificar game.js original
// Este archivo se carga DESPUÉS de game.js y se integra mediante eventos

let npcManagerInstance = null;
let dialogueUIInstance = null;

// Esperar a que Phaser esté listo
window.addEventListener('load', () => {
    // Dar tiempo a que game.js inicialice Phaser
    setTimeout(() => {
        initNPCSystem();
    }, 100);
});

async function initNPCSystem() {
    if (typeof game === 'undefined') {
        console.error('Game not found. Make sure game.js loaded first.');
        return;
    }

    const scene = game.scene.scenes[0];
    if (!scene) {
        console.error('Scene not found');
        return;
    }

    console.log('🎮 Inicializando sistema de NPCs...');

    // Precargar sprites de NPCs
    scene.load.image('npc_elder_tim', 'assets/characters/elder_tim.svg');
    scene.load.image('npc_flexbox_fred', 'assets/characters/flexbox_fred.svg');
    scene.load.image('npc_async_andy', 'assets/characters/async_andy.svg');

    // Iniciar carga
    scene.load.once('complete', async () => {
        await setupNPCSystem(scene);
    });

    scene.load.start();
}

async function setupNPCSystem(scene) {
    console.log('📦 Cargando NPCs...');

    // Inicializar managers
    npcManagerInstance = new NPCManager(scene);
    dialogueUIInstance = new DialogueUI(scene);
    npcManagerInstance.setDialogueUI(dialogueUIInstance);

    // Cargar NPCs desde JSON
    await npcManagerInstance.loadNPCs('data/npcs/npcs.json');

    // Configurar controles
    setupNPCControls(scene);

    // Agregar al update loop
    const originalUpdate = scene.update;
    scene.update = function(time, delta) {
        if (originalUpdate) {
            originalUpdate.call(this, time, delta);
        }

        // Update de NPCs
        if (npcManagerInstance) {
            npcManagerInstance.update();

            // Mostrar indicadores de proximidad
            if (window.player && !dialogueUIInstance?.isVisible) {
                npcManagerInstance.checkProximity(window.player.x, window.player.y, 120);
            }
        }
    };

    console.log('✅ Sistema de NPCs inicializado con', npcManagerInstance.getAllNPCs().length, 'NPCs');

    // Exportar para debugging
    window.npcManager = npcManagerInstance;
    window.dialogueUI = dialogueUIInstance;
}

function setupNPCControls(scene) {
    // Tecla E para interactuar
    scene.input.keyboard.on('keydown-E', () => {
        if (!dialogueUIInstance?.isVisible) {
            const player = window.player || scene.player;
            if (player && npcManagerInstance) {
                const closestNPC = npcManagerInstance.getClosestNPC(player.x, player.y, 120);
                if (closestNPC) {
                    npcManagerInstance.interact(closestNPC.id);
                }
            }
        }
    });
}
