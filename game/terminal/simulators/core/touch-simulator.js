import { BaseCommand } from './base-command.js';

export class TouchCommand extends BaseCommand {
  async execute(params, flags, env) {
    if (params.length === 0) {
      return 'touch: missing file operand';
    }

    const results = [];

    for (const path of params) {
      try {
        if (!this.fs.exists(path)) {
          this.fs.writeFile(path, '');
        } else {
          const absPath = this.fs.getAbsolutePath(path);
          const node = this.fs.getNode(absPath);
          if (node) {
            node.modified = new Date().toISOString();
          }
        }
      } catch (error) {
        results.push(error.message);
      }
    }

    return results.length > 0 ? results.join('\n') : '';
  }

  getHelp() {
    return `Usage: touch FILE...
Create empty files or update modification time

Arguments:
  FILE    file(s) to create or update`;
  }
}
