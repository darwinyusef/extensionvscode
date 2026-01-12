import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    public static init() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('AI Goals Tracker V2');
        }
    }

    public static info(message: string) {
        this.log('INFO', message);
    }

    public static error(message: string, error?: any) {
        let msg = message;
        if (error) {
            msg += ` - ${error.message || JSON.stringify(error)}`;
            if (error.stack) {
                this.outputChannel.appendLine(error.stack);
            }
        }
        this.log('ERROR', msg);
    }

    public static warn(message: string) {
        this.log('WARN', message);
    }

    private static log(level: string, message: string) {
        if (!this.outputChannel) this.init();
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }

    public static show() {
        if (this.outputChannel) this.outputChannel.show();
    }
}
