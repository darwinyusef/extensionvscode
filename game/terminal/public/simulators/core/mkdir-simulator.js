import { BaseCommand } from './base-command.js';

export class MkdirCommand extends BaseCommand {
  async execute(params, flags, env) {
    if (params.length === 0) {
      return 'mkdir: missing operand';
    }

    const parsedFlags = this.parseFlags(flags);
    const results = [];

    for (const path of params) {
      try {
        if (parsedFlags.p) {
          this.createParentDirs(path);
        } else {
          this.fs.createDirectory(path);
        }
      } catch (error) {
        results.push(error.message);
      }
    }

    return results.join('\n');
  }

  createParentDirs(path) {
    const absPath = this.fs.getAbsolutePath(path);
    const parts = absPath.split('/').filter(p => p);
    let current = '/';

    for (const part of parts) {
      const nextPath = current === '/' ? `/${part}` : `${current}/${part}`;
      if (!this.fs.exists(nextPath)) {
        this.fs.createDirectory(nextPath);
      }
      current = nextPath;
    }
  }

  getHelp() {
    return `Usage: mkdir [OPTION]... DIRECTORY...
Create directories

Options:
  -p    create parent directories as needed`;
  }
}
