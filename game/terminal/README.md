# Terminal Simulator - Interactive Learning Platform

Simulador de terminal web para aprender Linux, Docker, Kubernetes, Terraform y Bash scripting mediante ejercicios guiados.

## Características

- Sistema de archivos virtual en memoria
- Validación paso a paso de comandos
- Ejercicios interactivos con puntos y progreso
- Editor nano simulado
- Soporte para comandos básicos de Linux
- Validación con IA para scripts complejos

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

Abrir navegador en: http://localhost:3001

## Comandos Disponibles

### Linux Básico
- `ls` - Listar archivos
- `cd` - Cambiar directorio
- `pwd` - Mostrar directorio actual
- `mkdir` - Crear directorio
- `touch` - Crear archivo
- `cat` - Mostrar contenido
- `nano` - Editor de texto
- `rm` - Eliminar archivos
- `echo` - Mostrar texto
- `clear` - Limpiar terminal

## Ejercicios

1. **Linux Basics - File Navigation** - Navegación básica por el sistema de archivos
2. **Linux Basics - File Operations** - Manipulación de archivos y directorios
3. **Docker Fundamentals** - Introducción a Docker y Dockerfiles

## Estructura

```
terminal/
├── server.js              # Servidor Express
├── index.html             # Frontend principal
├── public/
│   ├── css/
│   │   └── terminal.css
│   └── js/
│       ├── terminal-client.js
│       ├── virtual-fs.js
│       ├── command-parser.js
│       ├── exercise-manager.js
│       └── validators/
├── simulators/
│   └── core/              # Simuladores de comandos
├── exercises/             # JSONs de ejercicios
└── .env                   # Variables de entorno
```

## Variables de Entorno

```
PORT=3001
OPENAI_API_KEY=tu_api_key
```

## Tecnologías

- **Frontend**: xterm.js + Vanilla JavaScript
- **Backend**: Node.js + Express
- **IA**: OpenAI API para validación compleja
