import { BaseCommand } from './base-command.js';

export class PwdCommand extends BaseCommand {
  async execute(params, flags, env) {
    return this.fs.getCurrentPath();
  }

  getHelp() {
    return `Usage: pwd
Print the current working directory`;
  }
}
