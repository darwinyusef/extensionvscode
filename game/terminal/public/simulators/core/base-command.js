export class BaseCommand {
  constructor(virtualFS) {
    this.fs = virtualFS;
  }

  async execute(params, flags, env) {
    throw new Error('execute() must be implemented by subclass');
  }

  getHelp() {
    return 'No help available for this command';
  }

  hasFlag(flags, flag) {
    return flags.includes(flag) || flags.includes(flag.replace('-', ''));
  }

  parseFlags(flags) {
    const parsed = {};
    flags.forEach(flag => {
      if (flag.startsWith('--')) {
        const [key, value] = flag.slice(2).split('=');
        parsed[key] = value || true;
      } else if (flag.startsWith('-')) {
        flag.slice(1).split('').forEach(char => {
          parsed[char] = true;
        });
      }
    });
    return parsed;
  }
}
