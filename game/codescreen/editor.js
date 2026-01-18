require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

const languageTemplates = {
    javascript: `function factorial(n) {\n    // Escribe tu código aquí\n    \n}\n`,
    python: `def factorial(n):\n    # Escribe tu código aquí\n    pass\n`,
    java: `public class Solution {\n    public static int factorial(int n) {\n        // Escribe tu código aquí\n        return 0;\n    }\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint factorial(int n) {\n    // Escribe tu código aquí\n    return 0;\n}\n`,
    go: `package main\n\nfunc factorial(n int) int {\n    // Escribe tu código aquí\n    return 0\n}\n`,
    kotlin: `fun factorial(n: Int): Int {\n    // Escribe tu código aquí\n    return 0\n}\n`,
    swift: `func factorial(_ n: Int) -> Int {\n    // Escribe tu código aquí\n    return 0\n}\n`,
    php: `<?php\nfunction factorial($n) {\n    // Escribe tu código aquí\n    return 0;\n}\n`,
    html: `<!DOCTYPE html>\n<html>\n<head>\n    <title>Mi Página</title>\n</head>\n<body>\n    <!-- Escribe tu código aquí -->\n</body>\n</html>\n`,
    css: `/* Escribe tus estilos aquí */\n\nbody {\n    margin: 0;\n    padding: 0;\n}\n`
};

const languageNames = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    go: 'Go',
    kotlin: 'Kotlin',
    swift: 'Swift',
    php: 'PHP',
    html: 'HTML',
    css: 'CSS'
};

function getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    return lang && languageTemplates[lang] ? lang : 'javascript';
}

let editor;
let pyodide = null;

async function initPyodide() {
    try {
        pyodide = await loadPyodide();
        console.log('✅ Pyodide cargado - Validación de Python disponible');
    } catch (error) {
        console.warn('⚠️ Pyodide no disponible, usando validación básica');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPyodide();
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
    const progressFill = document.getElementById('progress-fill');
    const currentPointsEl = document.getElementById('current-points');

    const goalPoints = {
        goal1: 10,
        goal2: 20,
        goal3: 15,
        goal4: 25,
        goal5: 15,
        goal6: 20
    };

    function updateProgress() {
        let totalPoints = 0;
        goalCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                totalPoints += goalPoints[checkbox.id];
            }
        });

        const percentage = (totalPoints / 70) * 100;
        progressFill.style.width = percentage + '%';
        currentPointsEl.textContent = totalPoints;
    }

    goalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateProgress);
    });
});

require(['vs/editor/editor.main'], function () {
    const currentLanguage = getLanguageFromURL();

    const languageDisplay = document.getElementById('language-display');
    languageDisplay.textContent = languageNames[currentLanguage];

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
        diagnosticCodesToIgnore: [2304, 2307, 2552, 2580, 1005, 1128]
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
        diagnosticCodesToIgnore: [2304, 2307, 2552, 2580]
    });

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: languageTemplates[currentLanguage],
        language: currentLanguage,
        theme: 'vs-dark',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        minimap: {
            enabled: true
        },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        renderWhitespace: 'selection',
        lineNumbers: 'on',
        roundedSelection: true,
        cursorStyle: 'line',
        cursorBlinking: 'smooth',
        bracketPairColorization: {
            enabled: true
        },
        guides: {
            indentation: true,
            bracketPairs: true
        },
        quickSuggestions: {
            other: true,
            comments: false,
            strings: false
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: true,
        parameterHints: {
            enabled: true
        },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoClosingOvertype: 'always',
        autoSurround: 'languageDefined',
        formatOnPaste: true,
        formatOnType: true
    });

    let validationTimeout;
    editor.onDidChangeModelContent(() => {
        clearTimeout(validationTimeout);

        validationTimeout = setTimeout(() => {
            const model = editor.getModel();
            const markers = monaco.editor.getModelMarkers({ resource: model.uri });
            const code = editor.getValue();

            if (markers.length > 0) {
                markers.forEach(marker => {
                    if (marker.severity === monaco.MarkerSeverity.Error) {
                        console.log(`❌ Error en línea ${marker.startLineNumber}: ${marker.message}`);
                    }
                });
            }

            if (currentLanguage === 'python') {
                validatePython(code);
            } else if (currentLanguage === 'java') {
                validateJava(code);
            } else if (currentLanguage === 'javascript') {
                validateJavaScript(code);
            } else if (currentLanguage === 'go') {
                validateGo(code);
            } else if (currentLanguage === 'kotlin') {
                validateKotlin(code);
            } else if (currentLanguage === 'swift') {
                validateSwift(code);
            } else if (currentLanguage === 'php') {
                validatePHP(code);
            } else if (currentLanguage === 'cpp') {
                validateCpp(code);
            }
        }, 300);
    });

    async function validatePython(code) {
        if (!pyodide) {
            validatePythonBasic(code);
            return;
        }

        try {
            const result = pyodide.runPython(`
import ast
import sys
from io import StringIO

errors = []
code = """${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""

try:
    ast.parse(code)
except SyntaxError as e:
    errors.append({
        'line': e.lineno,
        'column': e.offset or 1,
        'msg': e.msg,
        'text': e.text or ''
    })
except IndentationError as e:
    errors.append({
        'line': e.lineno,
        'column': e.offset or 1,
        'msg': 'Error de indentación',
        'text': e.text or ''
    })

errors
            `);

            const errors = result.toJs();

            if (errors.length > 0) {
                console.log('🐍 Python - Errores de sintaxis:');
                const monacoMarkers = [];

                errors.forEach(err => {
                    const error = Object.fromEntries(err);
                    console.log(`  Línea ${error.line}, Col ${error.column}: ${error.msg}`);

                    monacoMarkers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: error.line,
                        startColumn: error.column,
                        endLineNumber: error.line,
                        endColumn: editor.getModel().getLineMaxColumn(error.line),
                        message: error.msg
                    });
                });

                monaco.editor.setModelMarkers(editor.getModel(), 'python-validator', monacoMarkers);
            } else {
                monaco.editor.setModelMarkers(editor.getModel(), 'python-validator', []);
            }
        } catch (error) {
            console.warn('Error en validación Python:', error);
            validatePythonBasic(code);
        }
    }

    function validatePythonBasic(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('def ') && !line.trim().endsWith(':')) {
                errors.push({ line: index + 1, col: 1, msg: 'Falta ":" al final de la definición de función' });
            }
            if (line.trim().startsWith('if ') && !line.includes(':')) {
                errors.push({ line: index + 1, col: 1, msg: 'Falta ":" en la declaración if' });
            }
            if (line.trim().startsWith('for ') && !line.includes(':')) {
                errors.push({ line: index + 1, col: 1, msg: 'Falta ":" en el bucle for' });
            }
            if (line.trim().startsWith('while ') && !line.includes(':')) {
                errors.push({ line: index + 1, col: 1, msg: 'Falta ":" en el bucle while' });
            }
            if (line.trim().startsWith('class ') && !line.trim().endsWith(':')) {
                errors.push({ line: index + 1, col: 1, msg: 'Falta ":" al final de la definición de clase' });
            }
        });

        if (errors.length > 0) {
            console.log('🐍 Python - Errores básicos detectados:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: err.line,
                startColumn: err.col,
                endLineNumber: err.line,
                endColumn: editor.getModel().getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(editor.getModel(), 'python-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'python-validator', []);
        }
    }

    function validateJava(code) {
        try {
            if (typeof JavaParser !== 'undefined') {
                const parser = new JavaParser();
                const cst = parser.parse(code);

                if (cst.lexErrors && cst.lexErrors.length > 0) {
                    const errors = cst.lexErrors.map(err => ({
                        line: err.line,
                        column: err.column,
                        msg: err.message
                    }));

                    console.log('☕ Java - Errores léxicos:');
                    errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                    const monacoMarkers = errors.map(err => ({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: err.line,
                        startColumn: err.column,
                        endLineNumber: err.line,
                        endColumn: editor.getModel().getLineMaxColumn(err.line),
                        message: err.msg
                    }));
                    monaco.editor.setModelMarkers(editor.getModel(), 'java-validator', monacoMarkers);
                    return;
                }

                if (cst.parseErrors && cst.parseErrors.length > 0) {
                    const errors = cst.parseErrors.map(err => ({
                        line: err.token.startLine,
                        column: err.token.startColumn,
                        msg: err.message
                    }));

                    console.log('☕ Java - Errores de sintaxis:');
                    errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                    const monacoMarkers = errors.map(err => ({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: err.line,
                        startColumn: err.column,
                        endLineNumber: err.line,
                        endColumn: editor.getModel().getLineMaxColumn(err.line),
                        message: err.msg
                    }));
                    monaco.editor.setModelMarkers(editor.getModel(), 'java-validator', monacoMarkers);
                } else {
                    monaco.editor.setModelMarkers(editor.getModel(), 'java-validator', []);
                }
            }
        } catch (error) {
            console.warn('Error en validación Java:', error);
        }
    }

    function validateJavaScript(code) {
        try {
            if (typeof acorn !== 'undefined') {
                acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
                monaco.editor.setModelMarkers(editor.getModel(), 'js-validator', []);
            }
        } catch (error) {
            if (error.loc) {
                console.log(`📜 JavaScript - Error: Línea ${error.loc.line}, Col ${error.loc.column}: ${error.message}`);

                monaco.editor.setModelMarkers(editor.getModel(), 'js-validator', [{
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: error.loc.line,
                    startColumn: error.loc.column,
                    endLineNumber: error.loc.line,
                    endColumn: editor.getModel().getLineMaxColumn(error.loc.line),
                    message: error.message
                }]);
            }
        }
    }

    function validateGo(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('func ') && !line.includes('{') && !lines[index + 1]?.includes('{')) {
                errors.push({ line: index + 1, msg: 'Falta "{" después de la declaración de función' });
            }
            if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
                errors.push({ line: index + 1, msg: 'Paréntesis sin cerrar' });
            }
        });

        if (errors.length > 0) {
            console.log('🐹 Go - Errores básicos:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: editor.getModel().getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(editor.getModel(), 'go-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'go-validator', []);
        }
    }

    function validateKotlin(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('fun ') && !line.includes('{') && !lines[index + 1]?.includes('{')) {
                errors.push({ line: index + 1, msg: 'Falta "{" después de la declaración de función' });
            }
            if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
                errors.push({ line: index + 1, msg: 'Paréntesis sin cerrar' });
            }
        });

        if (errors.length > 0) {
            console.log('🟣 Kotlin - Errores básicos:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: editor.getModel().getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(editor.getModel(), 'kotlin-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'kotlin-validator', []);
        }
    }

    function validateSwift(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('func ') && !line.includes('{') && !lines[index + 1]?.includes('{')) {
                errors.push({ line: index + 1, msg: 'Falta "{" después de la declaración de función' });
            }
            if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
                errors.push({ line: index + 1, msg: 'Paréntesis sin cerrar' });
            }
        });

        if (errors.length > 0) {
            console.log('🍎 Swift - Errores básicos:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: editor.getModel().getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(editor.getModel(), 'swift-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'swift-validator', []);
        }
    }

    function validatePHP(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.includes('function ') && !line.includes('{') && !lines[index + 1]?.includes('{')) {
                errors.push({ line: index + 1, msg: 'Falta "{" después de la declaración de función' });
            }
            if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
                errors.push({ line: index + 1, msg: 'Paréntesis sin cerrar' });
            }
            if (!line.trim().startsWith('//') && line.trim() && !line.includes(';') &&
                !line.includes('{') && !line.includes('}') && !line.trim().startsWith('<?') &&
                !line.trim().startsWith('*') && line.trim() !== '') {
                errors.push({ line: index + 1, msg: 'Posible falta de ";" al final de la línea' });
            }
        });

        if (errors.length > 0) {
            console.log('🐘 PHP - Errores básicos:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: editor.getModel().getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(editor.getModel(), 'php-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'php-validator', []);
        }
    }

    function validateCpp(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;

                const openParens = (line.match(/\(/g) || []).length;
                const closeParens = (line.match(/\)/g) || []).length;

                if (openParens > closeParens && line.trim().endsWith('{')) {
                    errors.push({ line: index + 1, msg: 'Falta cerrar paréntesis' });
                }
            }
        });

        if (errors.length > 0) {
            console.log('⚙️ C++ - Errores detectados:');
            errors.forEach(err => console.log(`  Línea ${err.line}: ${err.msg}`));

            const model = editor.getModel();
            const monacoMarkers = errors.map(err => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: model.getLineMaxColumn(err.line),
                message: err.msg
            }));
            monaco.editor.setModelMarkers(model, 'cpp-validator', monacoMarkers);
        } else {
            monaco.editor.setModelMarkers(editor.getModel(), 'cpp-validator', []);
        }
    }

    const runBtn = document.getElementById('run-code');
    runBtn.addEventListener('click', () => {
        const code = editor.getValue();
        const model = editor.getModel();
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);

        console.log(`Ejecutando código en ${currentLanguage}:`);
        console.log(code);

        if (errors.length > 0) {
            console.error(`✗ ${errors.length} error(es) de sintaxis encontrado(s)`);
            errors.forEach(err => {
                console.error(`  Línea ${err.startLineNumber}: ${err.message}`);
            });
            return;
        }

        if (currentLanguage === 'javascript') {
            try {
                eval(code);
                console.log('✓ Código ejecutado');
            } catch (error) {
                console.error('✗ Error:', error.message);
            }
        } else {
            console.log(`⚠ La ejecución de ${languageNames[currentLanguage]} solo está disponible con backend`);
        }
    });

    window.addEventListener('resize', () => {
        editor.layout();
    });
});
