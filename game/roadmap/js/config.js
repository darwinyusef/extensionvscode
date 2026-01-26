const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: 0xffffff,
    transparent: true,
    dom: {
        createContainer: true
    },
    scene: RoadmapScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        mouse: {
            preventDefaultWheel: true
        },
        touch: {
            capture: true
        }
    }
};
