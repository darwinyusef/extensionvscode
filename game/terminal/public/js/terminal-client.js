import { VirtualFileSystem } from './virtual-fs.js';
import { CommandParser } from './command-parser.js';
import { ExerciseManager } from './exercise-manager.js';
import { StepValidator } from './validators/step-validator.js';
import { LsCommand } from '../simulators/core/ls-simulator.js';
import { CdCommand } from '../simulators/core/cd-simulator.js';
import { MkdirCommand } from '../simulators/core/mkdir-simulator.js';
import { TouchCommand } from '../simulators/core/touch-simulator.js';
import { CatCommand } from '../simulators/core/cat-simulator.js';
import { PwdCommand } from '../simulators/core/pwd-simulator.js';
import { EchoCommand } from '../simulators/core/echo-simulator.js';
import { ClearCommand } from '../simulators/core/clear-simulator.js';
import { NanoCommand } from '../simulators/core/nano-simulator.js';
import { RmCommand } from '../simulators/core/rm-simulator.js';

class TerminalClient {
  constructor() {
    this.term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#4ec9b0',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);

    this.currentLine = '';
    this.cursorPos = 0;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.escapeSequence = '';
    this.sidebarVisible = true;

    this.fs = new VirtualFileSystem();
    this.simulators = this.initializeSimulators();
    this.parser = new CommandParser(this.fs, this.simulators);
    this.validator = new StepValidator();
    this.exerciseManager = new ExerciseManager(this.fs, this.parser, this.validator);

    this.setupEventListeners();
    this.init();
  }

  initializeSimulators() {
    return {
      ls: new LsCommand(this.fs),
      cd: new CdCommand(this.fs),
      mkdir: new MkdirCommand(this.fs),
      touch: new TouchCommand(this.fs),
      cat: new CatCommand(this.fs),
      pwd: new PwdCommand(this.fs),
      echo: new EchoCommand(this.fs),
      clear: new ClearCommand(this.fs),
      nano: new NanoCommand(this.fs),
      rm: new RmCommand(this.fs)
    };
  }

  setupEventListeners() {
    this.exerciseManager.on('exerciseLoaded', (data) => {
      document.getElementById('exercise-title').textContent = data.title;
      this.updateProgressBar(0, data.totalSteps);
      this.renderInstructions();
    });

    this.exerciseManager.on('stepChanged', (step) => {
      if (step) {
        this.updateInstructionState(this.exerciseManager.currentStepIndex);
      }
    });

    this.exerciseManager.on('stepCompleted', (data) => {
      this.updateProgressBar(data.step, this.exerciseManager.currentExercise.steps.length);
      this.updateInstructionState(this.exerciseManager.currentStepIndex - 1, true);
    });

    this.exerciseManager.on('stepFailed', (data) => {
      this.updateInstructionState(this.exerciseManager.currentStepIndex, false, data.feedback);
    });

    this.exerciseManager.on('exerciseCompleted', (data) => {
      this.updateInstructionState(this.exerciseManager.currentStepIndex - 1, true);
    });

    window.addEventListener('resize', () => {
      this.fitAddon.fit();
    });
  }

  async init() {
    this.term.open(document.getElementById('terminal'));
    this.fitAddon.fit();

    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');
    const seed = urlParams.get('seed');
    const level = urlParams.get('level');
    const user = urlParams.get('user');

    if (topic) {
      await this.loadExerciseFromParams(topic, seed, level, user);
      this.showSidebar();
    } else {
      this.hideSidebar();
    }

    this.setupToggleButton();
    this.setupEditorModal();
    this.prompt();

    this.term.onData((data) => {
      this.handleInput(data);
    });
  }

  setupToggleButton() {
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.getElementById('instructions-sidebar');

    toggleBtn.addEventListener('click', () => {
      this.sidebarVisible = !this.sidebarVisible;

      if (this.sidebarVisible) {
        this.showSidebar();
      } else {
        this.hideSidebar();
      }
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
      });
    });
  }

  showSidebar() {
    console.log('showSidebar called');
    const sidebar = document.getElementById('instructions-sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');

    console.log('Sidebar element:', sidebar);
    console.log('Toggle button element:', toggleBtn);

    if (sidebar) {
      sidebar.classList.remove('hidden');
      console.log('Sidebar classes after remove hidden:', sidebar.className);
    }

    if (toggleBtn) {
      toggleBtn.classList.add('active');
      toggleBtn.classList.add('visible');
    }

    this.sidebarVisible = true;

    setTimeout(() => {
      this.fitAddon.fit();
    }, 300);
  }

  hideSidebar() {
    const sidebar = document.getElementById('instructions-sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');

    sidebar.classList.add('hidden');
    toggleBtn.classList.remove('active');
    this.sidebarVisible = false;

    setTimeout(() => {
      this.fitAddon.fit();
    }, 300);
  }

  async loadExerciseFromParams(topic, seed, level, user) {
    try {
      const params = new URLSearchParams({ topic });
      if (seed) params.append('seed', seed);
      if (level) params.append('level', level);
      if (user) params.append('user', user);

      console.log('Loading exercise with params:', params.toString());
      const response = await fetch(`/api/exercise?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Exercise not found');
      }

      const data = await response.json();
      console.log('Exercise data loaded:', data);

      this.currentExercise = data.exercise;
      this.exerciseManager.currentExercise = data.exercise;
      this.exerciseManager.currentStepIndex = 0;
      this.exerciseManager.totalPoints = 0;

      if (data.exercise.initial_state) {
        if (data.exercise.initial_state.filesystem) {
          this.fs.root = data.exercise.initial_state.filesystem;
        }
        if (data.exercise.initial_state.current_directory) {
          this.fs.currentPath = data.exercise.initial_state.current_directory;
        }
        if (data.exercise.initial_state.env) {
          Object.assign(this.parser.env, data.exercise.initial_state.env);
        }
      }

      document.getElementById('exercise-title').textContent = data.exercise.title;
      this.updateProgressBar(0, data.exercise.steps.length);
      this.renderInstructions();
      this.renderDocumentation(data.exercise);
      this.renderGoals(data.exercise);
      console.log('Exercise content rendered');
    } catch (error) {
      console.error('Error loading exercise:', error);
    }
  }

  renderInstructions() {
    console.log('renderInstructions called');
    if (!this.exerciseManager.currentExercise) {
      console.log('No current exercise');
      return;
    }

    const instructionsList = document.getElementById('instructions-list');
    if (!instructionsList) {
      console.error('instructions-list element not found');
      return;
    }

    instructionsList.innerHTML = '';
    console.log('Steps:', this.exerciseManager.currentExercise.steps);

    this.exerciseManager.currentExercise.steps.forEach((step, index) => {
      const item = document.createElement('div');
      item.className = 'instruction-item';
      item.id = `step-${index}`;
      item.innerHTML = `
        <div class="step-number">${index + 1}</div>
        <div class="step-content">
          <div class="step-instruction">${step.instruction}</div>
          <div class="step-feedback" style="display: none;"></div>
        </div>
      `;

      if (index === 0) {
        item.classList.add('active');
      }

      instructionsList.appendChild(item);
    });

    console.log('Instructions rendered:', instructionsList.children.length, 'items');
  }

  renderDocumentation(exercise) {
    const docContent = document.getElementById('documentation-content');
    if (!docContent) return;

    if (!exercise.documentation) {
      docContent.innerHTML = '<p style="color: #858585; padding: 2rem;">No hay documentación disponible para este ejercicio.</p>';
      return;
    }

    const doc = exercise.documentation;
    let html = `<h1>${doc.title}</h1>`;

    if (doc.sections && doc.sections.length > 0) {
      doc.sections.forEach(section => {
        html += `<h2>${section.heading}</h2>`;

        if (section.code) {
          html += `
            <div class="code-block-wrapper">
              <div class="code-block-header">Sintaxis</div>
              <pre class="syntax-example"><code>${this.escapeHtml(section.code)}</code></pre>
            </div>
          `;
        }

        if (section.content) {
          const formattedContent = this.formatDocContent(section.content);
          html += `<p>${formattedContent}</p>`;
        }
      });
    }

    if (doc.references && doc.references.length > 0) {
      html += '<h3>Referencias:</h3><ul>';
      doc.references.forEach(ref => {
        html += `<li><a href="${ref.url}" target="_blank" style="color: #569cd6; text-decoration: none;">${ref.title}</a></li>`;
      });
      html += '</ul>';
    }

    docContent.innerHTML = html;
  }

  formatDocContent(content) {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderGoals(exercise) {
    const goalsContent = document.getElementById('goals-content');
    if (!goalsContent) return;

    if (!exercise.goals || exercise.goals.length === 0) {
      goalsContent.innerHTML = '<p style="color: #858585; padding: 2rem;">No hay metas definidas para este ejercicio.</p>';
      return;
    }

    const totalPoints = exercise.goals.reduce((sum, goal) => sum + goal.points, 0);

    let html = `
      <h1>Metas del Ejercicio</h1>
      <div class="goals-list">
    `;

    exercise.goals.forEach((goal, index) => {
      html += `
        <div class="goal-item ${goal.bonus ? 'bonus' : ''}">
          <input type="checkbox" id="goal_${goal.id}" class="goal-checkbox" data-points="${goal.points}">
          <label for="goal_${goal.id}">
            <span class="goal-title">${goal.title}</span>
            <span class="goal-points">${goal.bonus ? '+' : ''}${goal.points} pts${goal.bonus ? ' (Bonus)' : ''}</span>
          </label>
        </div>
      `;
    });

    html += `
      </div>
      <div class="progress-summary">
        <h3>Progreso de Metas</h3>
        <div id="progress-bar">
          <div class="progress-fill" id="goals-progress-fill"></div>
        </div>
        <p class="progress-text">
          <span id="current-goal-points">0</span> / <span id="total-goal-points">${totalPoints}</span> pts
        </p>
      </div>
    `;

    goalsContent.innerHTML = html;
    this.attachGoalListeners();
  }

  attachGoalListeners() {
    const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
    const progressFill = document.getElementById('goals-progress-fill');
    const currentPointsEl = document.getElementById('current-goal-points');
    const totalPointsEl = document.getElementById('total-goal-points');

    if (!progressFill || !currentPointsEl) return;

    const updateProgress = () => {
      let totalPoints = 0;
      let maxPoints = 0;

      goalCheckboxes.forEach(checkbox => {
        const points = parseInt(checkbox.dataset.points);
        maxPoints += points;
        if (checkbox.checked) {
          totalPoints += points;
        }
      });

      const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
      progressFill.style.width = percentage + '%';
      currentPointsEl.textContent = totalPoints;
    };

    goalCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateProgress);
    });
  }

  updateInstructionState(stepIndex, completed = false, feedback = null) {
    const stepElement = document.getElementById(`step-${stepIndex}`);
    if (!stepElement) return;

    if (completed) {
      stepElement.classList.add('completed');
      stepElement.classList.remove('active', 'error');

      const nextStep = document.getElementById(`step-${stepIndex + 1}`);
      if (nextStep) {
        nextStep.classList.add('active');
      }
    } else if (feedback) {
      stepElement.classList.add('error');
      const feedbackEl = stepElement.querySelector('.step-feedback');
      if (feedbackEl) {
        feedbackEl.textContent = feedback;
        feedbackEl.style.display = 'block';
      }
      setTimeout(() => {
        stepElement.classList.remove('error');
        if (feedbackEl) {
          feedbackEl.style.display = 'none';
        }
      }, 3000);
    } else {
      stepElement.classList.add('active');
      stepElement.classList.remove('completed', 'error');
    }
  }

  async loadExerciseList() {
    try {
      const response = await fetch('/api/exercises');
      const exercises = await response.json();

      const listElement = document.getElementById('exercise-list');
      listElement.innerHTML = '';

      exercises.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'exercise-item';
        item.innerHTML = `
          <div style="font-weight: bold">${ex.title}</div>
          <div style="font-size: 11px; color: #858585">${ex.category} • ${ex.difficulty}</div>
        `;
        item.addEventListener('click', () => {
          document.querySelectorAll('.exercise-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          this.exerciseManager.loadExercise(ex.id);
        });
        listElement.appendChild(item);
      });
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  }

  handleInput(data) {
    const code = data.charCodeAt(0);

    if (this.escapeSequence.length > 0 || code === 27) {
      this.escapeSequence += data;

      if (this.escapeSequence === '\x1b[A') {
        this.navigateHistory(-1);
        this.escapeSequence = '';
      } else if (this.escapeSequence === '\x1b[B') {
        this.navigateHistory(1);
        this.escapeSequence = '';
      } else if (this.escapeSequence === '\x1b[C') {
        this.moveCursor(1);
        this.escapeSequence = '';
      } else if (this.escapeSequence === '\x1b[D') {
        this.moveCursor(-1);
        this.escapeSequence = '';
      } else if (this.escapeSequence.length > 3) {
        this.escapeSequence = '';
      }
      return;
    }

    if (code === 13) {
      this.term.write('\r\n');
      if (this.currentLine.trim() &&
          (this.commandHistory.length === 0 || this.commandHistory[this.commandHistory.length - 1] !== this.currentLine)) {
        this.commandHistory.push(this.currentLine);
      }
      this.historyIndex = this.commandHistory.length;
      this.executeCommand(this.currentLine);
      this.currentLine = '';
      this.cursorPos = 0;
      return;
    }

    if (code === 127) {
      if (this.cursorPos > 0) {
        this.currentLine = this.currentLine.slice(0, this.cursorPos - 1) + this.currentLine.slice(this.cursorPos);
        this.cursorPos--;
        this.redrawLine();
      }
      return;
    }

    if (code === 9) {
      this.handleTab();
      return;
    }

    if (code < 32) {
      return;
    }

    this.currentLine = this.currentLine.slice(0, this.cursorPos) + data + this.currentLine.slice(this.cursorPos);
    this.cursorPos++;
    this.redrawLine();
  }

  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;

    const newIndex = this.historyIndex + direction;
    if (newIndex < 0 || newIndex > this.commandHistory.length) return;

    this.clearCurrentLine();

    if (newIndex === this.commandHistory.length) {
      this.currentLine = '';
      this.historyIndex = newIndex;
    } else {
      this.currentLine = this.commandHistory[newIndex];
      this.historyIndex = newIndex;
    }

    this.cursorPos = this.currentLine.length;
    this.term.write(this.currentLine);
  }

  moveCursor(direction) {
    const newPos = this.cursorPos + direction;
    if (newPos < 0 || newPos > this.currentLine.length) return;

    this.cursorPos = newPos;
    if (direction > 0) {
      this.term.write('\x1b[C');
    } else {
      this.term.write('\x1b[D');
    }
  }

  clearCurrentLine() {
    this.term.write('\r\x1b[K');
    this.prompt();
  }

  redrawLine() {
    const savedPos = this.cursorPos;
    this.clearCurrentLine();
    this.term.write(this.currentLine);

    const diff = this.currentLine.length - savedPos;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.term.write('\x1b[D');
      }
    }
  }

  handleTab() {
    const parts = this.currentLine.slice(0, this.cursorPos).split(' ');
    const lastPart = parts[parts.length - 1];

    if (parts.length === 1) {
      const commands = Object.keys(this.simulators);
      const matches = commands.filter(cmd => cmd.startsWith(lastPart));

      if (matches.length === 1) {
        this.currentLine = matches[0] + this.currentLine.slice(this.cursorPos);
        this.cursorPos = matches[0].length;
        this.redrawLine();
      } else if (matches.length > 1) {
        this.term.write('\r\n');
        this.writeLine(matches.join('  '));
        this.prompt();
        this.term.write(this.currentLine);
      }
    } else {
      const files = this.getFileCompletions(lastPart);
      if (files.length === 1) {
        const completion = files[0];
        const beforeCursor = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '');
        this.currentLine = beforeCursor + completion + this.currentLine.slice(this.cursorPos);
        this.cursorPos = (beforeCursor + completion).length;
        this.redrawLine();
      } else if (files.length > 1) {
        this.term.write('\r\n');
        this.writeLine(files.join('  '));
        this.prompt();
        this.term.write(this.currentLine);
      }
    }
  }

  getFileCompletions(prefix) {
    try {
      const isAbsolute = prefix.startsWith('/');
      const parts = prefix.split('/');
      const searchName = parts[parts.length - 1];
      const basePath = parts.slice(0, -1).join('/') || (isAbsolute ? '/' : '.');

      const dir = this.fs.getNode(basePath);
      if (!dir || dir.type !== 'directory') return [];

      return Object.keys(dir.children)
        .filter(name => name.startsWith(searchName))
        .map(name => {
          const fullPath = parts.slice(0, -1).concat(name).join('/');
          return dir.children[name].type === 'directory' ? name + '/' : name;
        })
        .sort();
    } catch {
      return [];
    }
  }

  async executeCommand(input) {
    if (!input.trim()) {
      this.prompt();
      return;
    }

    try {
      const output = await this.parser.execute(input);

      if (typeof output === 'object' && output.type === 'editor') {
        this.openEditor(output.filename, output.content, output.callback);
        return;
      }

      if (output === '\x1b[2J\x1b[H') {
        this.term.clear();
      } else if (output) {
        this.writeLine(output);
      }

      if (this.exerciseManager.currentExercise) {
        await this.exerciseManager.validateCommand(input);
      }
    } catch (error) {
      this.writeLine(`\x1b[31mError: ${error.message}\x1b[0m`);
    }

    this.prompt();
  }

  prompt() {
    const cwd = this.fs.getCurrentPath();
    const user = this.parser.env.USER;
    const promptText = `\x1b[32m${user}\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
    this.term.write(promptText);
  }

  writeLine(text) {
    this.term.write(text + '\r\n');
  }

  updateProgressBar(current, total) {
    const percent = Math.round((current / total) * 100);
    const bar = document.getElementById('progress-bar');
    bar.innerHTML = `<div class="progress-fill" style="width: ${percent}%"></div>`;
  }

  setupEditorModal() {
    const modal = document.getElementById('editor-modal');
    const closeBtn = document.getElementById('editor-close');
    const content = document.getElementById('editor-content');

    closeBtn.addEventListener('click', () => {
      this.saveEditor(true);
    });

    content.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        this.saveEditor(false);
      } else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        this.saveEditor(true);
      }
    });
  }

  openEditor(filename, content, callback) {
    const modal = document.getElementById('editor-modal');
    const filenameEl = document.getElementById('editor-filename');
    const contentEl = document.getElementById('editor-content');

    filenameEl.textContent = filename;
    contentEl.value = content;
    modal.style.display = 'flex';
    contentEl.focus();

    this.editorCallback = callback;
  }

  async saveEditor(closeAfter = false) {
    const content = document.getElementById('editor-content').value;
    const filename = document.getElementById('editor-filename').textContent;
    const result = this.editorCallback(content);

    this.writeLine(result);

    if (filename.toLowerCase() === 'dockerfile' && this.exerciseManager.currentExercise) {
      await this.validateDockerfileWithAI(content, filename);

      const step = this.exerciseManager.getCurrentStep();
      if (step && step.validation && step.validation.type === 'ai_validation') {
        await this.exerciseManager.validateCommand(`nano ${filename}`);
      }
    }

    if (closeAfter) {
      document.getElementById('editor-modal').style.display = 'none';
      this.prompt();
    }
  }

  async validateDockerfileWithAI(content, filename) {
    this.showNotification('⏳ Validando Dockerfile con IA...', 'info');

    try {
      const step = this.exerciseManager.getCurrentStep();
      const aiPrompt = step?.validation?.ai_prompt || 'Validate this Dockerfile for best practices and correctness';

      const response = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: content,
          expected: aiPrompt,
          context: {
            exercise: this.exerciseManager.currentExercise.title,
            type: 'dockerfile',
            file_path: filename
          }
        })
      });

      const validation = await response.json();

      if (validation.correct) {
        this.showNotification(`✅ ${validation.feedback}`, 'success');
      } else {
        this.showNotification(`⚠️ ${validation.feedback}`, 'warning');
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.showNotification('❌ Error al validar con IA', 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TerminalClient();
});
