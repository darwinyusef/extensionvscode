class KeyboardControls {
  constructor(comicPlayer) {
    this.player = comicPlayer;
    this.enabled = true;
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          this.player.togglePlay();
          break;

        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          this.player.nextPanel();
          break;

        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          this.player.previousPanel();
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.adjustMasterVolume(5);
          break;

        case 'ArrowDown':
          e.preventDefault();
          this.adjustMasterVolume(-5);
          break;

        case '0':
          e.preventDefault();
          this.player.reset();
          break;

        case 'm':
          e.preventDefault();
          this.toggleMute();
          break;

        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;

        case '?':
        case 'h':
          e.preventDefault();
          this.showHelp();
          break;

        case 'Escape':
          const detailPanels = document.querySelectorAll('.detail-panel.show');
          detailPanels.forEach(panel => panel.classList.remove('show'));
          this.hideHelp();
          break;
      }
    });
  }

  adjustMasterVolume(delta) {
    const slider = document.getElementById('masterVolume');
    if (!slider) return;

    let newValue = parseInt(slider.value) + delta;
    newValue = Math.max(0, Math.min(100, newValue));
    slider.value = newValue;

    const event = new Event('input', { bubbles: true });
    slider.dispatchEvent(event);
  }

  toggleMute() {
    const masterSlider = document.getElementById('masterVolume');
    if (!masterSlider) return;

    if (parseInt(masterSlider.value) > 0) {
      this.lastVolume = masterSlider.value;
      masterSlider.value = 0;
    } else {
      masterSlider.value = this.lastVolume || 75;
    }

    const event = new Event('input', { bubbles: true });
    masterSlider.dispatchEvent(event);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  showHelp() {
    let helpModal = document.getElementById('keyboardHelp');

    if (!helpModal) {
      helpModal = document.createElement('div');
      helpModal.id = 'keyboardHelp';
      helpModal.className = 'keyboard-help-modal';
      helpModal.innerHTML = `
        <div class="help-content">
          <h2>Atajos de Teclado</h2>
          <div class="help-grid">
            <div class="help-item">
              <kbd>Espacio</kbd> / <kbd>K</kbd>
              <span>Play / Pausa</span>
            </div>
            <div class="help-item">
              <kbd>→</kbd> / <kbd>L</kbd>
              <span>Siguiente panel</span>
            </div>
            <div class="help-item">
              <kbd>←</kbd> / <kbd>J</kbd>
              <span>Panel anterior</span>
            </div>
            <div class="help-item">
              <kbd>↑</kbd>
              <span>Subir volumen</span>
            </div>
            <div class="help-item">
              <kbd>↓</kbd>
              <span>Bajar volumen</span>
            </div>
            <div class="help-item">
              <kbd>M</kbd>
              <span>Mutear / Desmutear</span>
            </div>
            <div class="help-item">
              <kbd>F</kbd>
              <span>Pantalla completa</span>
            </div>
            <div class="help-item">
              <kbd>0</kbd>
              <span>Reiniciar</span>
            </div>
            <div class="help-item">
              <kbd>?</kbd> / <kbd>H</kbd>
              <span>Mostrar ayuda</span>
            </div>
            <div class="help-item">
              <kbd>ESC</kbd>
              <span>Cerrar/Salir</span>
            </div>
          </div>
          <button class="close-help">Cerrar (ESC)</button>
        </div>
      `;
      document.body.appendChild(helpModal);

      helpModal.querySelector('.close-help').addEventListener('click', () => {
        this.hideHelp();
      });

      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          this.hideHelp();
        }
      });
    }

    helpModal.classList.add('show');
  }

  hideHelp() {
    const helpModal = document.getElementById('keyboardHelp');
    if (helpModal) {
      helpModal.classList.remove('show');
    }
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
