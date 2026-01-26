import { BaseCommand } from './base-command.js';

export class CatCommand extends BaseCommand {
  async execute(params, flags, env) {
    if (params.length === 0) {
      return 'cat: missing file operand';
    }

    const results = [];

    for (const path of params) {
      try {
        const content = this.fs.readFile(path);
        results.push(content);
      } catch (error) {
        results.push(error.message);
      }
    }

    return results.join('\n');
  }

  getHelp() {
    return `Usage: cat FILE...
Concatenate and display file contents

Arguments:
  FILE    file(s) to display`;
  }
}
