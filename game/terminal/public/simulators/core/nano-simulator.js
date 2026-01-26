import { BaseCommand } from './base-command.js';

export class NanoCommand extends BaseCommand {
  async execute(params, flags, env) {
    if (params.length === 0) {
      return 'nano: missing file operand';
    }

    const filename = params[0];
    let content = '';

    try {
      if (this.fs.exists(filename)) {
        content = this.fs.readFile(filename);
      }
    } catch (error) {
    }

    return {
      type: 'editor',
      filename,
      content,
      callback: (newContent) => {
        try {
          this.fs.writeFile(filename, newContent);
          return `File ${filename} saved`;
        } catch (error) {
          return error.message;
        }
      }
    };
  }

  getHelp() {
    return `Usage: nano FILE
Open file in text editor

Arguments:
  FILE    file to edit

Controls:
  Ctrl+O    save file
  Ctrl+X    exit editor`;
  }
}
