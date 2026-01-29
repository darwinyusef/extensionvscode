class ComicPlayer {
  constructor() {
    this.panels = Array.from(document.querySelectorAll('.panel[data-panel]'));
    this.currentIndex = 0;
    this.isPlaying = false;
    this.timeElapsed = 0;
    this.totalDuration = 0;
    this.interval = null;

    this.calculateTotalDuration();
    this.init();
  }

  calculateTotalDuration() {
    this.totalDuration = this.panels.reduce((sum, panel) => {
      return sum + parseInt(panel.dataset.duration || 30);
    }, 0);
  }

  init() {
    this.setupTimeline();
    this.setupControls();
    this.setupAudioPanel();
    this.setupPanelClicks();
    this.updateDisplay();
    this.activatePanel(0);
  }

  setupTimeline() {
    const markers = document.querySelector('.timeline-markers');
    let accumulatedTime = 0;

    this.panels.forEach((panel, index) => {
      const duration = parseInt(panel.dataset.duration || 30);
      const percentage = (accumulatedTime / this.totalDuration) * 100;

      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      marker.style.left = `${percentage}%`;
      marker.dataset.index = index;
      marker.addEventListener('click', () => this.jumpToPanel(index));

      markers.appendChild(marker);

      accumulatedTime += duration;
    });

    document.querySelector('.timeline-bar').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetTime = percentage * this.totalDuration;
      this.jumpToTime(targetTime);
    });
  }

  setupControls() {
    const playPauseBtn = document.getElementById('playPause');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    playPauseBtn.addEventListener('click', () => this.togglePlay());
    prevBtn.addEventListener('click', () => this.previousPanel());
    nextBtn.addEventListener('click', () => this.nextPanel());
  }

  setupAudioPanel() {
    const audioToggle = document.getElementById('audioToggle');
    const audioControls = document.getElementById('audioControls');

    audioToggle.addEventListener('click', () => {
      audioControls.classList.toggle('show');
    });

    const audioElements = {
      masterVolume: null,
      soundtrackVolume: document.getElementById('soundtrack'),
      ambientVolume: document.getElementById('ambient'),
      effectsVolume: document.getElementById('effects'),
      dialoguesVolume: document.getElementById('dialogues')
    };

    Object.keys(audioElements).forEach(key => {
      const slider = document.getElementById(key);
      const valueDisplay = slider.nextElementSibling;

      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        valueDisplay.textContent = value;

        if (key === 'masterVolume') {
          Object.values(audioElements).forEach(audio => {
            if (audio && audio.tagName === 'AUDIO') {
              audio.volume = (value / 100) * (parseInt(document.getElementById(
                audio.id.replace(/^(soundtrack|ambient|effects|dialogues)$/, '$1Volume')
              ).value) / 100);
            }
          });
        } else {
          const audio = audioElements[key];
          if (audio) {
            const masterVol = parseInt(document.getElementById('masterVolume').value) / 100;
            audio.volume = (value / 100) * masterVol;
          }
        }
      });
    });
  }

  setupPanelClicks() {
    this.panels.forEach((panel, index) => {
      panel.addEventListener('click', () => {
        this.jumpToPanel(index);
      });
    });
  }

  togglePlay() {
    const btn = document.getElementById('playPause');
    if (this.isPlaying) {
      this.pause();
      btn.textContent = '▶';
      btn.classList.remove('playing');
    } else {
      this.play();
      btn.textContent = '⏸';
      btn.classList.add('playing');
    }
  }

  play() {
    this.isPlaying = true;
    this.startAudio();

    this.interval = setInterval(() => {
      this.timeElapsed++;
      this.updateDisplay();

      let accumulatedTime = 0;
      for (let i = 0; i < this.panels.length; i++) {
        const duration = parseInt(this.panels[i].dataset.duration || 30);
        if (this.timeElapsed < accumulatedTime + duration) {
          if (this.currentIndex !== i) {
            this.activatePanel(i);
          }
          break;
        }
        accumulatedTime += duration;
      }

      if (this.timeElapsed >= this.totalDuration) {
        this.reset();
      }
    }, 1000);
  }

  pause() {
    this.isPlaying = false;
    clearInterval(this.interval);
    this.pauseAudio();
  }

  reset() {
    this.pause();
    this.timeElapsed = 0;
    this.currentIndex = 0;
    this.activatePanel(0);
    this.updateDisplay();
    document.getElementById('playPause').textContent = '▶';
    document.getElementById('playPause').classList.remove('playing');
  }

  previousPanel() {
    const newIndex = Math.max(0, this.currentIndex - 1);
    this.jumpToPanel(newIndex);
  }

  nextPanel() {
    const newIndex = Math.min(this.panels.length - 1, this.currentIndex + 1);
    this.jumpToPanel(newIndex);
  }

  jumpToPanel(index) {
    let accumulatedTime = 0;
    for (let i = 0; i < index; i++) {
      accumulatedTime += parseInt(this.panels[i].dataset.duration || 30);
    }
    this.timeElapsed = accumulatedTime;
    this.activatePanel(index);
    this.updateDisplay();
  }

  jumpToTime(targetTime) {
    this.timeElapsed = Math.floor(targetTime);
    let accumulatedTime = 0;
    for (let i = 0; i < this.panels.length; i++) {
      const duration = parseInt(this.panels[i].dataset.duration || 30);
      if (this.timeElapsed < accumulatedTime + duration) {
        this.activatePanel(i);
        break;
      }
      accumulatedTime += duration;
    }
    this.updateDisplay();
  }

  activatePanel(index) {
    this.panels.forEach(p => p.classList.remove('active'));
    this.panels[index].classList.add('active');
    this.currentIndex = index;

    const lottiePlayer = this.panels[index].querySelector('dotlottie-player');
    if (lottiePlayer) {
      lottiePlayer.play();
    }
  }

  updateDisplay() {
    const progress = (this.timeElapsed / this.totalDuration) * 100;
    document.querySelector('.timeline-progress').style.width = `${progress}%`;

    document.getElementById('currentTime').textContent = this.formatTime(this.timeElapsed);
    document.getElementById('totalTime').textContent = this.formatTime(this.totalDuration);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  startAudio() {
    const audios = ['soundtrack', 'ambient'].map(id => document.getElementById(id));
    audios.forEach(audio => {
      if (audio) audio.play().catch(e => console.log('Audio play prevented:', e));
    });
  }

  pauseAudio() {
    const audios = ['soundtrack', 'ambient', 'effects', 'dialogues'].map(id => document.getElementById(id));
    audios.forEach(audio => {
      if (audio) audio.pause();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const player = new ComicPlayer();

  if (typeof KeyboardControls !== 'undefined') {
    new KeyboardControls(player);
  }

  const helpButton = document.createElement('button');
  helpButton.className = 'help-button';
  helpButton.innerHTML = '?';
  helpButton.title = 'Atajos de teclado (?)';
  helpButton.addEventListener('click', () => {
    if (typeof KeyboardControls !== 'undefined') {
      const kb = new KeyboardControls(player);
      kb.showHelp();
    }
  });
  document.body.appendChild(helpButton);

  window.comicPlayer = player;
});
