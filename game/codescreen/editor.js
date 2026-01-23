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
let treeSitterParsers = {};
let currentWorkshop = null;
let currentExerciseIndex = 0;

async function loadWorkshop(workshopId) {
    try {
        const response = await fetch(`${workshopId}.json`);
        currentWorkshop = await response.json();
        loadExercise(0);
        console.log('✅ Taller cargado:', currentWorkshop.workshop.title);
    } catch (error) {
        console.warn('⚠️ No se pudo cargar el taller:', error);
    }
}

function loadExercise(index) {
    if (!currentWorkshop) return;

    const exercise = currentWorkshop.workshop.exercises[index];
    if (!exercise) return;

    currentExerciseIndex = index;

    document.getElementById('exercise-number').textContent =
        `Ejercicio ${exercise.id}/${currentWorkshop.workshop.exercises.length}`;

    const instructionsTab = document.getElementById('instructions');
    instructionsTab.innerHTML = `
        <div class="npc-container">
            <img src="${currentWorkshop.workshop.npc.avatar}" alt="NPC" class="npc-avatar">
            <div class="npc-info">
                <h2 class="npc-name">${currentWorkshop.workshop.npc.name}</h2>
                <p class="npc-title">${currentWorkshop.workshop.npc.role}</p>
            </div>
        </div>

        <h1>${exercise.instructions.title}</h1>
        <p>${exercise.instructions.description}</p>

        <h3>Requisitos:</h3>
        <ul>
            ${exercise.instructions.requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>

        <h3>Ejemplo:</h3>
        <pre><code>${exercise.example || exercise.instructions.example}</code></pre>
    `;

    const docTab = document.getElementById('documentation');
    docTab.innerHTML = `
        <h1>${exercise.documentation.title}</h1>
        ${exercise.documentation.sections.map(section => `
            <h2>${section.heading}</h2>
            <p>${section.content.replace(/```python/g, '<pre><code>').replace(/```/g, '</code></pre>')}</p>
        `).join('')}

        ${exercise.documentation.references.length > 0 ? `
            <h3>Referencias:</h3>
            <ul>
                ${exercise.documentation.references.map(ref =>
                    `<li><a href="${ref.url}" class="doc-link" target="_blank">${ref.title}</a></li>`
                ).join('')}
            </ul>
        ` : ''}
    `;

    const goalsTab = document.getElementById('goals');
    goalsTab.innerHTML = `
        <h1>Metas del Ejercicio ${exercise.id}</h1>

        <div class="goals-list">
            ${exercise.goals.map((goal, idx) => `
                <div class="goal-item ${goal.bonus ? 'bonus' : ''}">
                    <input type="checkbox" id="goal_${exercise.id}_${idx}" class="goal-checkbox" data-points="${goal.points}">
                    <label for="goal_${exercise.id}_${idx}">
                        <span class="goal-title">${goal.title}</span>
                        <span class="goal-points">${goal.bonus ? '+' : ''}${goal.points} pts${goal.bonus ? ' (Bonus)' : ''}</span>
                    </label>
                </div>
            `).join('')}
        </div>

        <div class="progress-summary">
            <h3>Progreso del Ejercicio</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <p class="progress-text">
                <span id="current-points">0</span> / <span id="total-points">${exercise.points}</span> pts
            </p>
        </div>

        <div class="main-goal-summary">
            <h3>🎯 Meta Principal del Taller</h3>
            <p>${currentWorkshop.workshop.mainGoal.description}</p>
            <div class="progress-bar">
                <div class="progress-fill" id="main-progress-fill" style="width: ${(index / currentWorkshop.workshop.exercises.length) * 100}%"></div>
            </div>
            <p class="progress-text">
                Ejercicio ${index + 1} / ${currentWorkshop.workshop.exercises.length}
            </p>
        </div>
    `;

    if (editor) {
        editor.setValue(exercise.starterCode || languageTemplates[currentWorkshop.workshop.language]);
    }

    updateNavigationButtons();
    attachGoalListeners();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-exercise');
    const nextBtn = document.getElementById('next-exercise');

    if (currentWorkshop) {
        prevBtn.style.display = currentExerciseIndex > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = currentExerciseIndex < currentWorkshop.workshop.exercises.length - 1 ? 'inline-block' : 'none';
    }
}

function attachGoalListeners() {
    const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
    const progressFill = document.getElementById('progress-fill');
    const currentPointsEl = document.getElementById('current-points');
    const totalPointsEl = document.getElementById('total-points');

    function updateProgress() {
        let totalPoints = 0;
        let maxPoints = 0;

        goalCheckboxes.forEach(checkbox => {
            const points = parseInt(checkbox.dataset.points);
            maxPoints += points;
            if (checkbox.checked) {
                totalPoints += points;
            }
        });

        const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
        progressFill.style.width = percentage + '%';
        currentPointsEl.textContent = totalPoints;
    }

    goalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateProgress);
    });
}

async function initPyodide() {
    try {
        pyodide = await loadPyodide();
        console.log('✅ Pyodide cargado - Validación de Python disponible');
    } catch (error) {
        console.warn('⚠️ Pyodide no disponible, usando validación básica');
    }
}

async function initTreeSitter() {
    try {
        await TreeSitter.init();

        const languages = {
            go: 'https://cdn.jsdelivr.net/npm/tree-sitter-go@0.20.0/tree-sitter-go.wasm',
            php: 'https://cdn.jsdelivr.net/npm/tree-sitter-php@0.21.1/tree-sitter-php.wasm',
            cpp: 'https://cdn.jsdelivr.net/npm/tree-sitter-cpp@0.20.0/tree-sitter-cpp.wasm',
            swift: 'https://cdn.jsdelivr.net/npm/tree-sitter-swift@0.6.0/tree-sitter-swift.wasm'
        };

        for (const [lang, url] of Object.entries(languages)) {
            try {
                const parser = new TreeSitter();
                const langModule = await TreeSitter.Language.load(url);
                parser.setLanguage(langModule);
                treeSitterParsers[lang] = parser;
                console.log(`✅ Tree-sitter ${lang} cargado`);
            } catch (err) {
                console.warn(`⚠️ No se pudo cargar tree-sitter ${lang}:`, err);
            }
        }
    } catch (error) {
        console.warn('⚠️ Tree-sitter no disponible:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPyodide();
    initTreeSitter();

    const urlParams = new URLSearchParams(window.location.search);
    const workshopId = urlParams.get('workshop');

    if (workshopId) {
        loadWorkshop(workshopId);
    }

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

    document.getElementById('prev-exercise')?.addEventListener('click', () => {
        if (currentExerciseIndex > 0) {
            loadExercise(currentExerciseIndex - 1);
        }
    });

    document.getElementById('next-exercise')?.addEventListener('click', () => {
        if (currentWorkshop && currentExerciseIndex < currentWorkshop.workshop.exercises.length - 1) {
            loadExercise(currentExerciseIndex + 1);
        }
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
        if (treeSitterParsers.go) {
            const tree = treeSitterParsers.go.parse(code);
            const errors = [];

            function findErrors(node) {
                if (node.hasError() || node.type === 'ERROR') {
                    errors.push({
                        line: node.startPosition.row + 1,
                        column: node.startPosition.column + 1,
                        msg: 'Error de sintaxis'
                    });
                }
                for (const child of node.children) {
                    findErrors(child);
                }
            }

            findErrors(tree.rootNode);

            if (errors.length > 0) {
                console.log('🐹 Go - Errores de sintaxis (Tree-sitter):');
                errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                const monacoMarkers = errors.map(err => ({
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: err.line,
                    startColumn: err.column,
                    endLineNumber: err.line,
                    endColumn: editor.getModel().getLineMaxColumn(err.line),
                    message: err.msg
                }));
                monaco.editor.setModelMarkers(editor.getModel(), 'go-validator', monacoMarkers);
            } else {
                monaco.editor.setModelMarkers(editor.getModel(), 'go-validator', []);
            }
        } else {
            validateGoBasic(code);
        }
    }

    function validateGoBasic(code) {
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
        if (treeSitterParsers.swift) {
            const tree = treeSitterParsers.swift.parse(code);
            const errors = [];

            function findErrors(node) {
                if (node.hasError() || node.type === 'ERROR') {
                    errors.push({
                        line: node.startPosition.row + 1,
                        column: node.startPosition.column + 1,
                        msg: 'Error de sintaxis'
                    });
                }
                for (const child of node.children) {
                    findErrors(child);
                }
            }

            findErrors(tree.rootNode);

            if (errors.length > 0) {
                console.log('🍎 Swift - Errores de sintaxis (Tree-sitter):');
                errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                const monacoMarkers = errors.map(err => ({
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: err.line,
                    startColumn: err.column,
                    endLineNumber: err.line,
                    endColumn: editor.getModel().getLineMaxColumn(err.line),
                    message: err.msg
                }));
                monaco.editor.setModelMarkers(editor.getModel(), 'swift-validator', monacoMarkers);
            } else {
                monaco.editor.setModelMarkers(editor.getModel(), 'swift-validator', []);
            }
        } else {
            validateSwiftBasic(code);
        }
    }

    function validateSwiftBasic(code) {
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
        if (treeSitterParsers.php) {
            const tree = treeSitterParsers.php.parse(code);
            const errors = [];

            function findErrors(node) {
                if (node.hasError() || node.type === 'ERROR') {
                    errors.push({
                        line: node.startPosition.row + 1,
                        column: node.startPosition.column + 1,
                        msg: 'Error de sintaxis'
                    });
                }
                for (const child of node.children) {
                    findErrors(child);
                }
            }

            findErrors(tree.rootNode);

            if (errors.length > 0) {
                console.log('🐘 PHP - Errores de sintaxis (Tree-sitter):');
                errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                const monacoMarkers = errors.map(err => ({
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: err.line,
                    startColumn: err.column,
                    endLineNumber: err.line,
                    endColumn: editor.getModel().getLineMaxColumn(err.line),
                    message: err.msg
                }));
                monaco.editor.setModelMarkers(editor.getModel(), 'php-validator', monacoMarkers);
            } else {
                monaco.editor.setModelMarkers(editor.getModel(), 'php-validator', []);
            }
        } else {
            validatePHPBasic(code);
        }
    }

    function validatePHPBasic(code) {
        const lines = code.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            if (line.includes('function ') && !line.includes('{') && !lines[index + 1]?.includes('{')) {
                errors.push({ line: index + 1, msg: 'Falta "{" después de la declaración de función' });
            }
            if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
                errors.push({ line: index + 1, msg: 'Paréntesis sin cerrar' });
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
        if (treeSitterParsers.cpp) {
            const tree = treeSitterParsers.cpp.parse(code);
            const errors = [];

            function findErrors(node) {
                if (node.hasError() || node.type === 'ERROR') {
                    errors.push({
                        line: node.startPosition.row + 1,
                        column: node.startPosition.column + 1,
                        msg: 'Error de sintaxis'
                    });
                }
                for (const child of node.children) {
                    findErrors(child);
                }
            }

            findErrors(tree.rootNode);

            if (errors.length > 0) {
                console.log('⚙️ C++ - Errores de sintaxis (Tree-sitter):');
                errors.forEach(err => console.log(`  Línea ${err.line}, Col ${err.column}: ${err.msg}`));

                const monacoMarkers = errors.map(err => ({
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: err.line,
                    startColumn: err.column,
                    endLineNumber: err.line,
                    endColumn: editor.getModel().getLineMaxColumn(err.line),
                    message: err.msg
                }));
                monaco.editor.setModelMarkers(editor.getModel(), 'cpp-validator', monacoMarkers);
            } else {
                monaco.editor.setModelMarkers(editor.getModel(), 'cpp-validator', []);
            }
        } else {
            validateCppBasic(code);
        }
    }

    function validateCppBasic(code) {
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
