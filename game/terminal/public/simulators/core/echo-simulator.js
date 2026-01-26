import { BaseCommand } from './base-command.js';

export class EchoCommand extends BaseCommand {
  async execute(params, flags, env) {
    const parsedFlags = this.parseFlags(flags);
    let text = params.join(' ');

    text = text.replace(/\$(\w+)/g, (match, varName) => {
      return env[varName] || '';
    });

    return parsedFlags.n ? text : text + '\n';
  }

  getHelp() {
    return `Usage: echo [OPTION]... [STRING]...
Display a line of text

Options:
  -n    do not output the trailing newline`;
  }
}
