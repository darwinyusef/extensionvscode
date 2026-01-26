import { BaseCommand } from './base-command.js';

export class RmCommand extends BaseCommand {
  async execute(params, flags, env) {
    if (params.length === 0) {
      return 'rm: missing operand';
    }

    const parsedFlags = this.parseFlags(flags);
    const recursive = parsedFlags.r || parsedFlags.R;
    const force = parsedFlags.f;
    const results = [];

    for (const path of params) {
      try {
        this.fs.remove(path, recursive);
      } catch (error) {
        if (!force) {
          results.push(error.message);
        }
      }
    }

    return results.length > 0 ? results.join('\n') : '';
  }

  getHelp() {
    return `Usage: rm [OPTION]... FILE...
Remove files or directories

Options:
  -r, -R    remove directories recursively
  -f        force removal without prompting`;
  }
}
