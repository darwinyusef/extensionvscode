import { BaseCommand } from './base-command.js';

export class CdCommand extends BaseCommand {
  async execute(params, flags, env) {
    const path = params[0] || env.HOME || '/home/student';

    try {
      this.fs.changeDirectory(path);
      return '';
    } catch (error) {
      return error.message;
    }
  }

  getHelp() {
    return `Usage: cd [DIRECTORY]
Change the current directory

Arguments:
  DIRECTORY    directory to change to (default: $HOME)

Special paths:
  ~     home directory
  -     previous directory
  ..    parent directory
  .     current directory`;
  }
}
