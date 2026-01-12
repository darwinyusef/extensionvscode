// Configuración del juego con Phaser
const config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 900,
    parent: 'game-container',
    transparent: true, // Canvas transparente para que los iconos DOM se vean debajo
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Variables globales
let player;
let playerSprite;
let nodes = [];
let connections = [];
let currentNode = null;
let roadmapData;
let graphics;
let isMoving = false;
let connectionLines = [];
let progressText;
let modal;
let camera;
let modalCanClose = false; // Flag para prevenir cierre inmediato del modal

// Variables para gestos del trackpad
let lastTouchDistance = 0;
let lastPinchZoom = 1;
let isTwoFingerScroll = false;

// Variables para drag del mapa
let isDraggingMap = false;
let dragStartX = 0;
let dragStartY = 0;
let canStartDrag = false;

// Constantes de cámara
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.2;
const ZOOM_SPEED = 0.1;
const PAN_SPEED = 2;
const DRAG_THRESHOLD = 3; // Píxeles mínimos para iniciar drag (reducido para mejor respuesta)
let lineDashOffset = 0;
let modalElement = document.getElementById('modal');
const modalTitle = document.querySelector('#modal h2');
const modalBody = document.querySelector('#modal p');
const closeBtn = document.querySelector('.close');

closeBtn.onclick = function () {
    modalElement.style.display = "none";
}

// Cerrar si se hace click fuera del contenido
window.onclick = function (event) {
    if (event.target == modalElement) {
        modalElement.style.display = "none";
    }
}

function preload() {
    // Cargar el sprite del jugador
    this.load.image('vaquero', 'vaquero.gif');

    // Cargar el JSON del roadmap
    this.load.json('roadmap', 'roadmap.json');
}

async function create() {
    const scene = this;
    roadmapData = this.cache.json.get('roadmap');

    this.input.topOnly = false;

    // 1. Forzar que la capa DOM esté detrás (Z-Index bajo)
    // Phaser crea un div llamado '.phaser-dom-element' o similar
    const domContainer = this.game.canvas.nextSibling;
    if (domContainer) {
        domContainer.style.zIndex = '0';
    }
    // 2. Asegurar que el Canvas esté por encima
    this.game.canvas.style.position = 'relative';
    this.game.canvas.style.zIndex = '10';

    camera = this.cameras.main;
    graphics = this.add.graphics();
    graphics.setDepth(-50);

    await drawConnections.call(this);
    await createNodes.call(this);
    createPlayer.call(this); // El vaquero se crea aquí con depth alto

    // Texto de progreso
    progressText = this.add.text(700, 850, '', {
        fontSize: '18px',
        color: '#00ff88',
        backgroundColor: '#000000',
        padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0);

    // Instrucciones
    const instructions = this.add.text(20, 850, 'Click sostenido para arrastrar | Click en nodo para mover | ℹ️ para info | Scroll para zoom', {
        fontSize: '14px',
        color: '#888888',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    // Click en nodos para moverse
    this.input.on('gameobjectdown', (pointer, gameObject) => {
        if (gameObject.isInfoIcon) {
            // Click en icono de información - prevenir drag
            canStartDrag = false;
            isDraggingMap = false;
            showNodeInModal.call(this, gameObject.nodeData);
        } else if (gameObject.nodeData) {
            // Click en el nodo - mover el vaquero a CUALQUIER nodo
            const nodeData = gameObject.nodeData;
            canStartDrag = false;
            isDraggingMap = false;
            movePlayerToNode.call(this, nodeData);
        }
    });

    // Zoom con scroll del mouse (parallax)
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        // Zoom vertical
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            const zoomChange = deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
            let newZoom = camera.zoom + zoomChange;
            newZoom = Phaser.Math.Clamp(newZoom, MIN_ZOOM, MAX_ZOOM);

            this.tweens.add({
                targets: camera,
                zoom: newZoom,
                duration: 100,
                ease: 'Linear'
            });
        }
        // Scroll horizontal (dos dedos izquierda/derecha)
        else if (Math.abs(deltaX) > 0) {
            camera.scrollX += deltaX * PAN_SPEED;
        }
    });

    // Soporte para gestos táctiles (trackpad)
    setupTouchGestures.call(this);

    // Sistema de drag del mapa (tipo Figma/Excalidraw)
    setupMapDrag.call(this);

    // Iniciar en el primer nodo activo (según JSON)
    const startNode = roadmapData.nodes.find(n => n.active);
    if (startNode) {
        player.x = startNode.x;
        player.y = startNode.y;
        currentNode = startNode;

        // Centrar cámara en el nodo inicial con efecto parallax
        centerCameraOnNode(startNode);
    }

    // Configurar visuales iniciales según JSON
    updateNodeVisuals.call(this);
    updateProgress.call(this);
}

function setupTouchGestures() {
    const scene = this;

    // Detectar gestos de pinch (zoom) y scroll de dos dedos
    this.input.on('pointermove', (pointer) => {
        if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
            const pointer1 = this.input.pointer1;
            const pointer2 = this.input.pointer2;

            // Calcular distancia entre dos dedos
            const distance = Phaser.Math.Distance.Between(
                pointer1.x, pointer1.y,
                pointer2.x, pointer2.y
            );

            if (lastTouchDistance > 0) {
                // Pinch zoom
                const delta = distance - lastTouchDistance;
                const zoomChange = delta * 0.005;

                let newZoom = camera.zoom + zoomChange;
                newZoom = Phaser.Math.Clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
                camera.setZoom(newZoom);

                // Scroll horizontal con dos dedos
                const midX = (pointer1.x + pointer2.x) / 2;
                const midY = (pointer1.y + pointer2.y) / 2;

                if (pointer1.prevPosition && pointer2.prevPosition) {
                    const prevMidX = (pointer1.prevPosition.x + pointer2.prevPosition.x) / 2;
                    const deltaX = midX - prevMidX;

                    camera.scrollX -= deltaX / camera.zoom;
                }
            }

            lastTouchDistance = distance;
            isTwoFingerScroll = true;
        }
    });

    this.input.on('pointerup', () => {
        lastTouchDistance = 0;
        isTwoFingerScroll = false;
    });
}

function setupMapDrag() {
    const scene = this;
    const canvas = this.game.canvas;

    // Pointerdown - Iniciar posible drag
    this.input.on('pointerdown', (pointer) => {
        // Solo permitir drag con click izquierdo y si no es en un nodo
        if (pointer.leftButtonDown()) {
            canStartDrag = true;
            dragStartX = pointer.x;
            dragStartY = pointer.y;

            // Cambiar cursor a grab (manito abierta)
            canvas.style.cursor = 'grab';
        }
    });

    // Pointermove - Arrastrar el mapa
    this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && canStartDrag && !isDraggingMap) {
            // Verificar si se movió lo suficiente para iniciar drag
            const distance = Phaser.Math.Distance.Between(
                dragStartX, dragStartY,
                pointer.x, pointer.y
            );

            if (distance > DRAG_THRESHOLD) {
                isDraggingMap = true;
                // Cambiar cursor a grabbing (manito cerrada)
                canvas.style.cursor = 'grabbing';
            }
        }

        if (isDraggingMap && pointer.isDown) {
            // Calcular delta del movimiento
            const deltaX = pointer.x - pointer.prevPosition.x;
            const deltaY = pointer.y - pointer.prevPosition.y;

            // Mover la cámara en dirección opuesta (para que el mapa siga el cursor)
            camera.scrollX -= deltaX / camera.zoom;
            camera.scrollY -= deltaY / camera.zoom;
        }
    });

    // Pointerup - Terminar drag
    this.input.on('pointerup', (pointer) => {
        if (isDraggingMap) {
            isDraggingMap = false;
        }
        canStartDrag = false;

        // Restaurar cursor normal
        canvas.style.cursor = 'default';
    });

    // Pointerout - Si el puntero sale del canvas
    this.input.on('pointerout', () => {
        if (isDraggingMap) {
            isDraggingMap = false;
        }
        canStartDrag = false;
        canvas.style.cursor = 'default';
    });
}

function centerCameraOnNode(node) {
    camera.pan(node.x, node.y, 800, 'Power2');
}

function drawConnections() {
    // Aseguramos que el objeto graphics esté muy por debajo de todo
    graphics.setDepth(-100);

    roadmapData.nodes.forEach(node => {
        node.connections.forEach(connId => {
            const targetNode = roadmapData.nodes.find(n => n.id === connId);
            if (targetNode) {
                const exists = connectionLines.find(c =>
                    (c.from.id === node.id && c.to.id === targetNode.id) ||
                    (c.from.id === targetNode.id && c.to.id === node.id)
                );

                if (!exists) {
                    // Línea ultra fina y clara
                    graphics.lineStyle(1, 0xffffff, 0.2);
                    graphics.beginPath();
                    graphics.moveTo(node.x, node.y);
                    graphics.lineTo(targetNode.x, targetNode.y);
                    graphics.strokePath();

                    // Quitamos o reducimos el punto medio para máxima limpieza
                    connectionLines.push({ from: node, to: targetNode });
                }
            }
        });
    });
}

async function createNodes() {
    const scene = this;

    for (let nodeData of roadmapData.nodes) {
        // Contenedor para el nodo
        const nodeContainer = this.add.container(nodeData.x, nodeData.y);

        // Fondo cuadrado TRANSPARENTE - solo área interactiva
        const bgRect = this.add.rectangle(0, 0, 90, 90, 0x1a1a2e, 0); // Alpha 0 = invisible
        bgRect.setStrokeStyle(3, parseInt(nodeData.color), 0.5); // Borde semi-transparente

        // Crear elemento DOM para el icono SVG
        const iconElement = document.createElement('img');
        iconElement.src = nodeData.icon;
        iconElement.style.width = '50px';
        iconElement.style.height = '50px';
        iconElement.style.pointerEvents = 'none';
        iconElement.style.userSelect = 'none';
        iconElement.style.position = 'relative';
        iconElement.style.zIndex = '0'; // Asegurar que esté detrás
        iconElement.draggable = false;

        const iconDOM = this.add.dom(nodeData.x, nodeData.y, iconElement);
        iconDOM.setOrigin(0.5, 0.5);
        iconDOM.setScrollFactor(1, 1);
        iconDOM.setDepth(5); // Debajo del vaquero (100) pero visible

        // Configurar z-index del wrapper DOM también
        if (iconDOM.node) {
            iconDOM.node.style.zIndex = '0';
            iconDOM.node.style.isolation = 'auto';
        }

        // Texto del título - SIN FONDO para que sea más limpio
        const nodeText = this.add.text(0, 60, nodeData.title, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Badge de nivel más sutil
        const levelBadge = this.add.text(40, -40, `L${nodeData.level}`, {
            fontSize: '10px',
            color: '#ffffff',
            backgroundColor: parseInt(nodeData.color),
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Icono de información - MÁS GRANDE Y VISIBLE
        const infoBg = this.add.circle(40, 40, 15, 0x00aaff, 0.8);
        const infoIcon = this.add.text(40, 40, 'ℹ️', {
            fontSize: '20px'
        }).setOrigin(0.5);

        // Hacer el fondo también interactivo
        infoBg.setInteractive({ useHandCursor: true });
        infoBg.isInfoIcon = true;
        infoBg.nodeData = nodeData;

        infoIcon.setInteractive({ useHandCursor: true });
        infoIcon.isInfoIcon = true;
        infoIcon.nodeData = nodeData;

        infoIcon.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            showNodeInModal.call(this, nodeData);
        });

        // Efectos Hover (Mantener los que ya tenías pero optimizados)
        const hoverIn = () => {
            infoBg.setScale(1.2);
            infoIcon.setScale(1.2);
            infoBg.setFillStyle(0x00ccff, 1);
            // Cambiamos el cursor a puntero para indicar que es clickeable
            this.game.canvas.style.cursor = 'pointer';
        };

        const hoverOut = () => {
            infoBg.setScale(1);
            infoIcon.setScale(1);
            infoBg.setFillStyle(0x00aaff, 0.8);
            this.game.canvas.style.cursor = 'default';
        };

        infoBg.on('pointerover', hoverIn);
        infoBg.on('pointerout', hoverOut);
        infoIcon.on('pointerover', hoverIn);
        infoIcon.on('pointerout', hoverOut);

        nodeContainer.add([bgRect, nodeText, levelBadge, infoBg, infoIcon]);
        nodeContainer.setSize(100, 100);
        nodeContainer.setDepth(10); // Por debajo del vaquero (100)
        nodeContainer.setInteractive({ useHandCursor: true });
        nodeContainer.nodeData = nodeData;

        nodes.push({
            container: nodeContainer,
            bgRect: bgRect,
            text: nodeText,
            infoIcon: infoIcon,
            iconDOM: iconDOM,
            data: nodeData
        });
    }
}

function createPlayer() {
    // Crear sprite del vaquero MÁS GRANDE
    playerSprite = this.add.sprite(0, 0, 'vaquero');
    playerSprite.setDisplaySize(100, 100); // Aumentado de 60 a 100

    // Añadir sombra debajo del jugador (más grande)
    const shadow = this.add.ellipse(0, 25, 70, 25, 0x000000, 0.5);

    // Contenedor del jugador
    player = this.add.container(0, 0, [shadow, playerSprite]);
    // NO setSize ni setInteractive para que no bloquee eventos
    player.setDepth(100); // MUY por encima de nodos e iconos para estar siempre visible

    // IMPORTANTE: El player NO debe bloquear eventos del mouse
    // No hacemos setInteractive() ni setSize() para que los clicks pasen a través del player

    // Animación de flotación
    this.tweens.add({
        targets: playerSprite,
        y: -8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Efecto de rotación sutil
    this.tweens.add({
        targets: playerSprite,
        angle: -5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}


function showNodeInModal(nodeData) {
    // Actualizar contenido del HTML
    modalTitle.innerText = nodeData.title.toUpperCase();
    document.getElementById('modal-icon').src = nodeData.icon;
    // Construir el cuerpo con la info del nodo
    let statusColor = nodeData.active ? '#00ff88' : (isNodeUnlocked(nodeData) ? '#00aaff' : '#f43f5e');
    let statusLabel = nodeData.active ? 'COMPLETADO' : (isNodeUnlocked(nodeData) ? 'DISPONIBLE' : 'BLOQUEADO');

    modalBody.innerHTML = `
        <div style="margin-bottom: 5px;">
        <span style="color: ${statusColor}; font-weight: bold;">● ${statusLabel}</span>
        </div>
        <div style="margin-bottom: 15px; padding: 10px; overflow-y: scroll; max-height: 5%;">
            <p style="color: #ccc; line-height: 1.6;">${nodeData.description}</p>

            ${nodeData.detail_info ? `<p style="color: #ccc; line-height: 1.6;">${nodeData.detail_info}</p>` : ''}
        </div>
        ${nodeData.url ? `<br><a href="${nodeData.url}" target="_blank" style="display: inline-block; margin-top: 15px; color: #00ffff; text-decoration: none; border: 1px solid #00ffff; padding: 5px 15px; border-radius: 4px;">VER RECURSO</a>` : ''}
    `;

    // Mostrar el modal
    modalElement.style.display = "block";
}

function hideModal() {
    modalElement.style.display = "none";
}

function update() {
    // 1. Mantener el tamaño de los iconos DOM (tu código actual)
    if (nodes && camera) {
        nodes.forEach(nodeObj => {
            if (nodeObj.iconDOM && nodeObj.iconDOM.node) {
                const scale = camera.zoom;
                const iconSize = 50 * scale;
                nodeObj.iconDOM.node.style.width = iconSize + 'px';
                nodeObj.iconDOM.node.style.height = iconSize + 'px';
            }
        });
    }

    // 2. Animar el offset de las líneas
    lineDashOffset += 0.4; // Velocidad del flujo
    if (lineDashOffset > 12) lineDashOffset = 0; // Reset según dashLength + gapLength

    // 3. Redibujar las conexiones con el nuevo offset
    if (currentNode) {
        highlightConnections.call(this, currentNode);
    }
}

function isNodeUnlocked(nodeData) {
    // Si no está bloqueado desde el inicio, está desbloqueado
    if (!nodeData.locked) return true;

    // Si no tiene requisitos, está desbloqueado
    if (!nodeData.requires || nodeData.requires.length === 0) return true;

    // Verificar si todos los nodos requeridos están activos
    return nodeData.requires.every(reqId => {
        const reqNode = roadmapData.nodes.find(n => n.id === reqId);
        return reqNode && reqNode.active;
    });
}

// Función updateLockedStates eliminada - no es necesaria, updateNodeVisuals hace todo

function movePlayerToNode(targetNode) {
    if (isMoving) return;

    isMoving = true;
    const scene = this;

    // Cerrar modal si está abierto
    hideModal.call(scene);

    // Animar movimiento del jugador
    this.tweens.add({
        targets: player,
        x: targetNode.x,
        y: targetNode.y,
        duration: 800,
        ease: 'Power2',
        onUpdate: () => {
            // Rotar sprite en dirección del movimiento
            const angle = Phaser.Math.Angle.Between(
                player.x, player.y,
                targetNode.x, targetNode.y
            );
            playerSprite.rotation = angle + Math.PI / 2;
        },
        onComplete: () => {
            currentNode = targetNode;
            isMoving = false;

            // NO activar nodo - el estado solo viene del JSON
            // Solo actualizar la posición actual

            updateProgress.call(scene);

            // Centrar cámara suavemente en el nuevo nodo con parallax
            centerCameraOnNode(targetNode);
        }
    });
}

// Función activateNode eliminada - los nodos solo cambian por JSON, no por eventos

function highlightConnections(nodeData) {
    graphics.clear();
    graphics.setDepth(-100);

    roadmapData.nodes.forEach(node => {
        node.connections.forEach(connId => {
            const targetNode = roadmapData.nodes.find(n => n.id === connId);
            if (targetNode) {
                // Estilo minimalista
                let lineColor = 0x444444; // Gris por defecto
                let lineAlpha = 0.2;
                let lineWidth = 6;

                if (node.active && targetNode.active) {
                    lineColor = 0xcccccc; // Gris claro para caminos completados
                    lineAlpha = 0.4;
                    lineWidth = 3;
                }

                const startPoint = new Phaser.Math.Vector2(node.x, node.y);
                const endPoint = new Phaser.Math.Vector2(targetNode.x, targetNode.y);
                const distance = Phaser.Math.Distance.BetweenPoints(startPoint, endPoint);

                const dashLength = 6;
                const gapLength = 6;
                const segmentLength = dashLength + gapLength;

                graphics.lineStyle(lineWidth, lineColor, lineAlpha);

                // El offset hace que parezca que los puntos viajan de A a B
                for (let d = lineDashOffset; d < distance; d += segmentLength) {
                    const tStart = d / distance;
                    const tEnd = Math.min((d + dashLength) / distance, 1);

                    if (tStart > 1) break;

                    const p1x = Phaser.Math.Linear(startPoint.x, endPoint.x, tStart);
                    const p1y = Phaser.Math.Linear(startPoint.y, endPoint.y, tStart);
                    const p2x = Phaser.Math.Linear(startPoint.x, endPoint.x, tEnd);
                    const p2y = Phaser.Math.Linear(startPoint.y, endPoint.y, tEnd);

                    graphics.lineBetween(p1x, p1y, p2x, p2y);
                }
            }
        });
    });
}

function updateNodeVisuals() {
    const scene = game.scene.scenes[0];

    nodes.forEach(nodeObj => {
        if (nodeObj.data.active) {
            // Nodos activos - borde verde brillante, fondo transparente
            nodeObj.bgRect.setFillStyle(0x00ff88, 0); // Transparente
            nodeObj.bgRect.setStrokeStyle(4, 0x00ff88, 0.9); // Borde verde brillante
            // Icono a color normal y brillante
            if (nodeObj.iconDOM && nodeObj.iconDOM.node) {
                nodeObj.iconDOM.node.style.filter = 'grayscale(0%) brightness(1.2) drop-shadow(0 0 8px #00ff88)';
                nodeObj.iconDOM.node.style.opacity = '1';
            }
        } else if (isNodeUnlocked(nodeObj.data)) {
            // Nodos desbloqueados - borde color original, fondo transparente
            nodeObj.bgRect.setFillStyle(0x1a1a2e, 0); // Transparente
            nodeObj.bgRect.setStrokeStyle(3, parseInt(nodeObj.data.color), 0.7);
            // Icono a color normal
            if (nodeObj.iconDOM && nodeObj.iconDOM.node) {
                nodeObj.iconDOM.node.style.filter = 'grayscale(0%) brightness(1)';
                nodeObj.iconDOM.node.style.opacity = '1';
            }
        } else {
            // Nodos bloqueados - borde gris, fondo transparente
            nodeObj.bgRect.setFillStyle(0x0a0a0a, 0); // Transparente
            nodeObj.bgRect.setStrokeStyle(2, 0x444444, 0.5);
            // Icono en escala de grises y oscurecido
            if (nodeObj.iconDOM && nodeObj.iconDOM.node) {
                nodeObj.iconDOM.node.style.filter = 'grayscale(100%) brightness(0.5)';
                nodeObj.iconDOM.node.style.opacity = '0.4';
            }
        }
    });

    // Actualizar conexiones
    if (currentNode) {
        highlightConnections.call(scene, currentNode);
    }
}

function updateProgress() {
    const totalNodes = roadmapData.nodes.length;
    const completedNodes = roadmapData.nodes.filter(n => n.active).length;
    const unlockedNodes = roadmapData.nodes.filter(n => isNodeUnlocked(n)).length;
    const percentage = Math.round((completedNodes / totalNodes) * 100);

    progressText.setText(
        `Progreso: ${completedNodes}/${totalNodes} (${percentage}%) | ` +
        `Desbloqueados: ${unlockedNodes} | ` +
        `Posición: ${currentNode ? currentNode.title : 'Ninguna'}`
    );
}
