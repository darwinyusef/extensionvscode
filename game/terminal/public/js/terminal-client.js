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
      this.writeLine(`\x1b[32mExercise loaded: ${data.title}\x1b[0m`);
      this.writeLine(`Total steps: ${data.totalSteps}\n`);
    });

    this.exerciseManager.on('stepChanged', (step) => {
      if (step) {
        document.getElementById('current-instruction').textContent = step.instruction;
        this.writeLine(`\x1b[33m[Step ${this.exerciseManager.currentStepIndex + 1}] ${step.instruction}\x1b[0m`);
      }
    });

    this.exerciseManager.on('stepCompleted', (data) => {
      this.writeLine(`\x1b[32m✓ ${data.feedback}\x1b[0m`);
      this.writeLine(`\x1b[32m+${data.points} points (Total: ${data.totalPoints})\x1b[0m\n`);
      this.updateProgressBar(data.step, this.exerciseManager.currentExercise.steps.length);
    });

    this.exerciseManager.on('stepFailed', (data) => {
      this.writeLine(`\x1b[31m✗ ${data.feedback}\x1b[0m\n`);
    });

    this.exerciseManager.on('exerciseCompleted', (data) => {
      this.writeLine(`\x1b[32m\n🎉 Exercise completed!\x1b[0m`);
      this.writeLine(`\x1b[32mTotal points: ${data.totalPoints}\x1b[0m\n`);
      document.getElementById('current-instruction').textContent = 'Exercise completed! Select another exercise from the sidebar.';
    });

    window.addEventListener('resize', () => {
      this.fitAddon.fit();
    });
  }

  init() {
    this.term.open(document.getElementById('terminal'));
    this.fitAddon.fit();

    this.writeLine('\x1b[32mWelcome to Terminal Simulator\x1b[0m');
    this.writeLine('Type commands to interact with the virtual Linux system.');
    this.writeLine('Load an exercise from the sidebar to start learning.\n');

    this.loadExerciseList();
    this.setupEditorModal();
    this.prompt();

    this.term.onData((data) => {
      this.handleInput(data);
    });
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

    if (code === 13) {
      this.term.write('\r\n');
      this.executeCommand(this.currentLine);
      this.currentLine = '';
      this.cursorPos = 0;
      return;
    }

    if (code === 127) {
      if (this.cursorPos > 0) {
        this.currentLine = this.currentLine.slice(0, this.cursorPos - 1) + this.currentLine.slice(this.cursorPos);
        this.cursorPos--;
        this.term.write('\b \b');
      }
      return;
    }

    if (code === 27) {
      return;
    }

    if (code < 32) {
      return;
    }

    this.currentLine = this.currentLine.slice(0, this.cursorPos) + data + this.currentLine.slice(this.cursorPos);
    this.cursorPos++;
    this.term.write(data);
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
      modal.style.display = 'none';
      this.prompt();
    });

    content.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        this.saveEditor();
      } else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        modal.style.display = 'none';
        this.prompt();
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

  saveEditor() {
    const content = document.getElementById('editor-content').value;
    const result = this.editorCallback(content);
    this.writeLine(result);
    document.getElementById('editor-modal').style.display = 'none';
    this.prompt();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TerminalClient();
});
