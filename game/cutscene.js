const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    dom: {
        createContainer: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let storyData = [];
let currentSceneIndex = 0;
let titleTextElement;
let subtitleTextElement;
let imageContainer;
let skipBtn;
let audioBtn;
let startScreen;
let startButton;
let autoTimer;
let currentCharacter = null;
let currentBackground = null;
let backgroundAudio = null;
let isAudioPlaying = false;
let audioInitialized = false;
let scene = null;

function preload() {
    this.load.json('story', 'story.json');
}

function create() {
    scene = this;
    const storyJson = this.cache.json.get('story');
    storyData = storyJson.scenes;

    startScreen = document.getElementById('start-screen');
    startButton = document.getElementById('start-button');
    audioBtn = document.getElementById('audio-btn');

    if (storyJson.backgroundAudio) {
        console.log('Loading audio from:', storyJson.backgroundAudio);
        backgroundAudio = new Audio(storyJson.backgroundAudio);
        backgroundAudio.loop = true;
        backgroundAudio.volume = 0.5;
        backgroundAudio.preload = 'auto';

        backgroundAudio.addEventListener('error', (e) => {
            console.error('Audio loading error:', e);
            console.error('Audio src:', backgroundAudio.src);
            if (audioBtn) audioBtn.textContent = '❌';
        });

        backgroundAudio.addEventListener('loadeddata', () => {
            console.log('Audio data loaded');
        });
    }

    startButton.addEventListener('click', () => {
        console.log('Start button clicked, initializing...');

        if (backgroundAudio && backgroundAudio.paused) {
            backgroundAudio.play()
                .then(() => {
                    console.log('✓ Audio playing successfully');
                    isAudioPlaying = true;
                    audioInitialized = true;
                    if (audioBtn) audioBtn.textContent = '⏸';
                })
                .catch(err => {
                    console.error('Error playing audio:', err);
                    if (audioBtn) audioBtn.textContent = '▶';
                });
        }

        startScreen.classList.add('hidden');
        showScene(scene, 0);
    });

    titleTextElement = document.getElementById('title-text');
    subtitleTextElement = document.getElementById('subtitle-text');
    imageContainer = document.getElementById('image-container');

    skipBtn = document.getElementById('skip-btn');
    skipBtn.addEventListener('click', () => skipStory());

    if (audioBtn) {
        audioBtn.addEventListener('click', () => toggleAudio());
    }

    this.input.keyboard.on('keydown-ESC', () => skipStory());
    this.input.keyboard.on('keydown-SPACE', () => skipToNext(scene));
}

function update() {
}

function showScene(scene, index) {
    if (index >= storyData.length) {
        completeStory();
        return;
    }

    currentSceneIndex = index;
    const sceneData = storyData[index];

    if (currentBackground) {
        currentBackground.destroy();
        currentBackground = null;
    }

    if (sceneData.background) {
        loadBackground(scene, sceneData.background);
    } else {
        scene.cameras.main.setBackgroundColor('#000000');
    }

    if (sceneData.character) {
        loadCharacter(scene, sceneData.character);
    } else {
        imageContainer.innerHTML = '';
    }

    titleTextElement.textContent = sceneData.title || '';
    subtitleTextElement.textContent = sceneData.text || '';

    if (autoTimer) {
        autoTimer.remove();
    }

    autoTimer = scene.time.delayedCall(sceneData.duration || 3000, () => {
        showScene(scene, index + 1);
    });
}

function loadBackground(scene, bgConfig) {
    if (bgConfig.type === 'color') {
        scene.cameras.main.setBackgroundColor(bgConfig.value);
    } else if (bgConfig.type === 'gradient') {
        currentBackground = scene.add.graphics();
        currentBackground.fillGradientStyle(
            parseInt(bgConfig.colors[0]),
            parseInt(bgConfig.colors[0]),
            parseInt(bgConfig.colors[1]),
            parseInt(bgConfig.colors[1]),
            1, 1, 1, 1
        );
        currentBackground.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
        currentBackground.setDepth(-10);
    }
}

function loadCharacter(scene, charConfig) {
    imageContainer.innerHTML = '';

    if (charConfig.type === 'emoji') {
        const emoji = document.createElement('div');
        emoji.textContent = charConfig.value;
        emoji.style.fontSize = '120px';
        emoji.style.opacity = '0';
        emoji.style.transition = 'opacity 0.6s ease-out';
        imageContainer.appendChild(emoji);

        setTimeout(() => {
            emoji.style.opacity = '1';
        }, 100);
    } else if (charConfig.type === 'image') {
        const img = document.createElement('img');
        img.src = charConfig.src;

        if (charConfig.css) {
            img.style.cssText = charConfig.css;
        } else {
            img.style.maxWidth = charConfig.width || '400px';
            img.style.maxHeight = charConfig.height || '400px';
            img.style.objectFit = 'contain';
        }

        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s ease-out';

        imageContainer.appendChild(img);

        setTimeout(() => {
            img.style.opacity = '1';
        }, 100);
    } else if (charConfig.type === 'html') {
        const htmlContainer = document.createElement('div');
        htmlContainer.innerHTML = charConfig.content;
        htmlContainer.style.opacity = '0';
        htmlContainer.style.transition = 'opacity 0.6s ease-out';

        if (charConfig.css) {
            htmlContainer.style.cssText = charConfig.css;
        } else {
            htmlContainer.style.textAlign = 'center';
            htmlContainer.style.maxWidth = charConfig.width || '600px';
        }

        imageContainer.appendChild(htmlContainer);

        setTimeout(() => {
            htmlContainer.style.opacity = '1';
        }, 100);
    }
}

function skipToNext(scene) {
    if (autoTimer) {
        autoTimer.remove();
    }
    showScene(scene, currentSceneIndex + 1);
}

function skipStory() {
    completeStory();
}

function toggleAudio() {
    if (!backgroundAudio) return;

    if (!backgroundAudio.paused) {
        backgroundAudio.pause();
        audioBtn.textContent = '▶';
        isAudioPlaying = false;
        console.log('▶ Audio paused by user');
    } else {
        backgroundAudio.play()
            .then(() => {
                audioBtn.textContent = '⏸';
                isAudioPlaying = true;
                audioInitialized = true;
                console.log('⏸ Audio resumed by user');
            })
            .catch(err => {
                console.error('Error playing audio:', err);
                audioBtn.textContent = '▶';
                isAudioPlaying = false;
            });
    }
}

function completeStory() {
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio = null;
    }
    window.location.href = 'index.html';
}