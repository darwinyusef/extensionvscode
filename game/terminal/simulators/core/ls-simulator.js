import { BaseCommand } from './base-command.js';

export class LsCommand extends BaseCommand {
  async execute(params, flags, env) {
    const parsedFlags = this.parseFlags(flags);
    const path = params[0] || null;

    try {
      const items = this.fs.listDirectory(path);

      if (parsedFlags.l) {
        return this.formatLongListing(items);
      }

      const names = items
        .filter(item => parsedFlags.a || !item.name.startsWith('.'))
        .map(item => {
          if (item.type === 'directory') {
            return `\x1b[34m${item.name}\x1b[0m`;
          }
          if (item.permissions && item.permissions.includes('x')) {
            return `\x1b[32m${item.name}\x1b[0m`;
          }
          return item.name;
        });

      return names.join('  ');
    } catch (error) {
      return error.message;
    }
  }

  formatLongListing(items) {
    const lines = items.map(item => {
      const perms = item.permissions || '-rw-r--r--';
      const owner = item.owner || 'student';
      const group = item.group || 'student';
      const size = item.content ? item.content.length : 4096;
      const date = item.modified ? new Date(item.modified).toLocaleDateString() : new Date().toLocaleDateString();
      const name = item.type === 'directory' ? `\x1b[34m${item.name}\x1b[0m` : item.name;

      return `${perms}  1 ${owner} ${group} ${size.toString().padStart(5)} ${date} ${name}`;
    });

    return lines.join('\n');
  }

  getHelp() {
    return `Usage: ls [OPTION]... [FILE]...
List directory contents

Options:
  -a    show all files (including hidden)
  -l    long listing format`;
  }
}
