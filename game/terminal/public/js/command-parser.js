export class CommandParser {
  constructor(virtualFS, simulators) {
    this.fs = virtualFS;
    this.simulators = simulators;
    this.history = [];
    this.historyIndex = -1;
    this.env = {
      USER: 'student',
      HOME: '/home/student',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      SHELL: '/bin/bash'
    };
  }

  parse(input) {
    input = input.trim();
    if (!input) return null;

    this.history.push(input);
    this.historyIndex = this.history.length;

    const parts = input.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const flags = args.filter(arg => arg.startsWith('-'));
    const params = args.filter(arg => !arg.startsWith('-'));

    return {
      raw: input,
      command,
      args,
      flags,
      params
    };
  }

  async execute(input) {
    const parsed = this.parse(input);
    if (!parsed) return '';

    const { command, args, flags, params } = parsed;

    if (this.simulators[command]) {
      try {
        return await this.simulators[command].execute(params, flags, this.env);
      } catch (error) {
        return error.message;
      }
    }

    return `bash: ${command}: command not found`;
  }

  getHistory() {
    return this.history;
  }

  getPreviousCommand() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  getNextCommand() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    this.historyIndex = this.history.length;
    return '';
  }
}
