import { BaseCommand } from './base-command.js';

export class ClearCommand extends BaseCommand {
  async execute(params, flags, env) {
    return '\x1b[2J\x1b[H';
  }

  getHelp() {
    return `Usage: clear
Clear the terminal screen`;
  }
}
