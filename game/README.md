# Tech Roadmap - Interactive Game

Juego interactivo de roadmap tecnológico creado con **Phaser.js** que permite navegar a través de un mapa de aprendizaje de tecnologías web.

## Características Principales

### Sistema de Roadmap
- **20 tecnologías** organizadas en 6 niveles de aprendizaje
- **Iconos reales** cargados desde [svgl.app](https://svgl.app/)
- **Datos en JSON** para fácil personalización
- **Conexiones bidireccionales** entre nodos relacionados

### Mecánicas del Juego
- **Personaje interactivo**: Vaquero animado con efectos de flotación y rotación
- **Sistema de nodos tipo menú**: Click en nodos desbloqueados para navegar
- **Cámara con parallax**: Zoom suave tipo parallax, siempre centrado en el roadmap
- **Activación automática**: Los nodos se completan solo cuando el vaquero los visita
- **Sistema de requisitos**: Nodos bloqueados que se desbloquean al completar sus dependencias
- **Efectos visuales**: Partículas, animaciones y cambios de color dinámicos
- **Progresión guiada**: Sistema de aprendizaje paso a paso con requisitos claros

### Interfaz
- **Modal centrado**: Información de cada nodo en modal cerrable (X o click fuera)
- **Icono ℹ️**: Cada nodo tiene un icono pequeño de información (click para ver detalles)
- **Sin hover automático**: Los modales solo se abren al hacer click en ℹ️
- **Barra de progreso**: Contador de completados, desbloqueados y posición actual
- **Estados visuales**:
  - Verde (completado)
  - Color original (desbloqueado)
  - Gris oscuro (bloqueado)
  - Icono 🔒 en nodos bloqueados
- **Sistema de requisitos**: El modal muestra qué nodos se necesitan para desbloquear
- **Instrucciones integradas**: Guía de controles en pantalla

### Efectos Visuales
- **Fondo con estrellas animadas**
- **Borde con brillo animado**
- **Conexiones dinámicas** que cambian de color según el progreso
- **Partículas de completado**
- **Hover effects** en nodos
- **Animaciones suaves** de transición

## Estructura del Proyecto

```
game/
├── index.html         # Página principal con efectos CSS
├── game.js           # Lógica del juego con Phaser
├── roadmap.json      # Datos del roadmap (tecnologías, conexiones, iconos)
├── vaquero.gif       # Sprite del personaje
└── README.md         # Este archivo
```

## Instalación y Ejecución

### Opción 1: Servidor Local con Python
```bash
cd game
python3 -m http.server 8000
```
Abre tu navegador en `http://localhost:8000`

### Opción 2: Servidor Local con Node.js
```bash
cd game
npx http-server
```

### Opción 3: Live Server (VS Code)
1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

> **Nota importante**: Debes usar un servidor local debido a las políticas CORS para cargar el JSON y las imágenes externas.

## Cómo Jugar

### Controles Principales

1. **Click sostenido + arrastrar**: Mantén presionado el click y arrastra el mapa en cualquier dirección (aparece manito 👋)
2. **Click en nodo**: Haz click en cualquier nodo desbloqueado para mover al vaquero
3. **Click en ℹ️**: Haz click en el icono de información pequeño para ver detalles del nodo
4. **Scroll vertical**: Usa la rueda del mouse para hacer zoom (0.6x - 1.2x) tipo parallax
5. **Scroll horizontal**: Desliza dos dedos izquierda/derecha en trackpad para desplazar
6. **Pinch zoom**: Pellizca con dos dedos en trackpad para zoom
7. **Modal cerrable**: Click en la X o fuera del modal para cerrarlo

### Sistema de Nodos y Restricciones

#### Estados de Nodos
- **🔒 Bloqueados** (gris oscuro): Requieren completar otros nodos primero
- **○ Desbloqueados** (color original): Disponibles para visitar
- **✓ Completados** (verde): Ya visitados por el vaquero

#### Mecánica de Desbloqueo
- **Nodos iniciales**: HTML, CSS y Git están desbloqueados desde el inicio
- **Nodos restringidos**: Se desbloquean automáticamente al completar sus requisitos
- **Ejemplo**: JavaScript requiere completar HTML y CSS primero
- **Progresión natural**: El roadmap guía el aprendizaje paso a paso

#### Activación
- **Automática**: Los nodos se completan cuando el vaquero llega a ellos
- **Sin reversión**: No puedes desactivar un nodo una vez completado
- **Desbloqueo en cadena**: Completar un nodo puede desbloquear múltiples nodos

### Navegación

- **Drag del mapa**: Click sostenido + arrastrar para mover el mapa (tipo Figma/Excalidraw)
- **Cursor dinámico**: Manito abierta (grab) al presionar, cerrada (grabbing) al arrastrar
- **Movimiento libre**: Arrastra en todas las direcciones (arriba, abajo, izquierda, derecha)
- **Cámara centrada**: La cámara sigue al vaquero al moverse entre nodos
- **Scroll tipo parallax**: Zoom suave con límites para mantener todo visible
- **Movimiento inteligente**: Solo puedes ir a nodos desbloqueados
- **Título fijo**: El título siempre permanece arriba, sin importar el scroll

## Roadmap de Tecnologías

### Nivel 1: Fundamentos
- **HTML** → Lenguaje de marcado
- **CSS** → Hojas de estilo
- **Git** → Control de versiones

### Nivel 2: Core
- **JavaScript** → Lenguaje de programación
- **Tailwind** → Framework CSS
- **GitHub** → Plataforma colaborativa

### Nivel 3: Frameworks & Entornos
- **React** → Librería UI
- **Vue** → Framework progresivo
- **TypeScript** → JS con tipos
- **Node.js** → Runtime JavaScript
- **Docker** → Contenedores

### Nivel 4: Avanzado
- **Next.js** → Framework React
- **Redux** → Estado global
- **Nuxt** → Framework Vue
- **NestJS** → Framework Node.js
- **Express** → Framework web
- **Kubernetes** → Orquestación

### Nivel 5: Despliegue
- **MongoDB** → Base de datos NoSQL
- **Vercel** → Plataforma de deploy
- **DevOps** → Prácticas de desarrollo

## Personalización

### Agregar o Modificar Tecnologías

Edita el archivo `roadmap.json`:

```json
{
  "id": "nueva-tech",
  "title": "Nueva Tecnología",
  "icon": "https://svgl.app/library/nombre.svg",
  "x": 500,
  "y": 300,
  "level": 3,
  "color": "0xff0000",
  "description": "Descripción de la tecnología",
  "active": false,
  "locked": true,
  "requires": ["tech-requisito-1", "tech-requisito-2"],
  "connections": ["otra-tech-id"]
}
```

### Campos Explicados

- **id**: Identificador único (sin espacios)
- **title**: Nombre visible de la tecnología
- **icon**: URL del icono (busca en [svgl.app](https://svgl.app/))
- **x, y**: Posición en el canvas (0-1400, 0-900)
- **level**: Nivel de dificultad (1-6)
- **color**: Color en hexadecimal (formato: "0xRRGGBB")
- **description**: Texto descriptivo
- **active**: true si está completado desde el inicio, false si no
- **locked**: true si requiere otros nodos para desbloquearse, false si está disponible
- **requires**: Array de IDs de nodos que deben completarse para desbloquear este nodo
- **connections**: Array de IDs de nodos conectados visualmente (solo para líneas)

### Cambiar el Personaje

Reemplaza `vaquero.gif` con tu propio sprite (formatos: GIF, PNG, JPG)

### Ajustar Tamaño del Canvas

En `game.js`, modifica:

```javascript
const config = {
    // ...
    width: 1400,  // Ancho en píxeles
    height: 900,  // Alto en píxeles
    // ...
};
```

## Características Técnicas

### Tecnologías Utilizadas
- **Phaser 3.70**: Motor de juego HTML5
- **JavaScript ES6+**: Sintaxis moderna
- **JSON**: Almacenamiento de datos
- **CSS3**: Animaciones y efectos
- **SVGL**: Iconos SVG de tecnologías

### Funcionalidades Implementadas

✅ Carga dinámica de datos desde JSON
✅ Carga de iconos externos (CORS-enabled)
✅ Sistema de partículas de Phaser
✅ Tweens y animaciones suaves
✅ Detección de click (sin hover molesto)
✅ **Sistema de nodos restringidos con requisitos**
✅ **Desbloqueo automático al completar requisitos**
✅ **Sistema de cámara con zoom parallax (0.6x - 1.2x)**
✅ **Roadmap centrado sin drag**
✅ **Scroll vertical del mouse para zoom**
✅ **Drag del mapa con click sostenido** (tipo Figma/Excalidraw)
✅ **Cursor dinámico** (grab/grabbing)
✅ **Arrastre en todas las direcciones**
✅ **Scroll horizontal con dos dedos (trackpad)**
✅ **Pinch zoom con dos dedos (trackpad)**
✅ **Icono ℹ️ pequeño en cada nodo**
✅ **Modal solo se abre al click en ℹ️**
✅ **Modal centrado y cerrable (X o click fuera)**
✅ **Título siempre fijo en la parte superior**
✅ **Indicador visual de nodos bloqueados (🔒)**
✅ **Listado de requisitos en el modal**
✅ Activación automática al visitar nodos
✅ Estado persistente durante la sesión
✅ Conexiones visuales dinámicas
✅ Efectos de post-procesamiento CSS
✅ UI fija (no se mueve con la cámara)

### Optimizaciones

- Carga asíncrona de recursos
- Reutilización de texturas
- Destrucción de emisores de partículas
- Canvas rendering acelerado por GPU

## Próximas Mejoras Sugeridas

- [ ] Persistencia de progreso con localStorage
- [ ] Exportar progreso a JSON descargable
- [ ] Modo oscuro/claro
- [ ] Sonidos y música de fondo
- [ ] Mini-juegos o desafíos en cada nodo
- [ ] Sistema de logros/badges
- [ ] Múltiples rutas de aprendizaje
- [ ] Búsqueda de nodos por nombre
- [ ] Zoom y pan en el mapa
- [ ] Modo tutorial interactivo
- [ ] Comparar progreso con otros usuarios
- [ ] Integración con APIs educativas

## Solución de Problemas

### Los iconos no cargan
- Verifica que estés usando un servidor local (no file://)
- Comprueba la conexión a internet
- Revisa las URLs en `roadmap.json`

### El vaquero no aparece
- Verifica que `vaquero.gif` esté en la carpeta correcta
- Comprueba la consola del navegador para errores

### Los nodos no responden
- Asegúrate de que los nodos tengan conexiones definidas
- Verifica que el formato del JSON sea correcto
- Comprueba que el nodo inicial tenga `"active": true`

### Error de CORS
- **Solución**: Usa un servidor local (ver sección Instalación)
- No abras el archivo directamente con `file://`

## Recursos

- [Phaser Documentation](https://phaser.io/docs)
- [SVGL - SVG Logos](https://svgl.app/)
- [JSON Validator](https://jsonlint.com/)
- [Color Picker](https://www.color-hex.com/)

## Contribuciones

Este proyecto es de código abierto y educativo. Siéntete libre de:

- Agregar más tecnologías al roadmap
- Mejorar los efectos visuales
- Optimizar el rendimiento
- Crear temas personalizados
- Implementar nuevas mecánicas

## Licencia

Proyecto educativo de código abierto.

---

**Creado con Phaser.js** | Disfruta aprendiendo mientras juegas
