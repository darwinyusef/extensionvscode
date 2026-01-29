# 📖 Comic Interactivo

Sistema de narrativa visual con timeline automático, efectos parallax y audio multicanal.

## 🚀 Inicio Rápido

Abre **`index-nav.html`** en tu navegador para acceder a la navegación principal.

## 📁 Estructura Organizada

### 📂 v1/ - Demos y Herramientas
- **START-HERE.html** - Portal de inicio con todas las demos
- **demo.html** - Demo funcional (sin necesidad de assets)
- **check-setup.html** - Verificador de archivos

### 📂 layouts/ - Layouts de Referencia
4 layouts basados en las imágenes de /comic:
- **layout-01.html** - Grid 66/33 con subdivisiones (5 paneles)
- **layout-02.html** - Fondo completo + panel central flotante
- **layout-03.html** - Fondo completo + 2 paneles flotantes
- **layout-04.html** - Grid complejo con 9 paneles

### 📂 Producción
- **index.html** - Página 1: Inicio (6 paneles)
- **page2.html** - Página 2: Intermedio (4 paneles + Lottie)
- **page3.html** - Página 3: Clímax (panel interactivo)

## ✨ Características

- ⏱️ Timeline automático con duraciones configurables
- 🎨 Efectos parallax (capas background/character)
- 🎵 Audio multicanal (banda sonora, ambiente, efectos, diálogos)
- ⌨️ Controles de teclado completos
- 🎭 Integración animaciones Lottie
- 📱 Diseño 100% responsivo
- 🎯 Estados activo/inactivo con transiciones

## 🎮 Controles de Teclado

- `Espacio` / `K` - Play/Pausa
- `←` / `J` - Panel anterior
- `→` / `L` - Siguiente panel
- `↑` / `↓` - Volumen
- `M` - Mute
- `F` - Pantalla completa
- `?` / `H` - Ayuda
- `ESC` - Cerrar

## 📋 Preparación de Assets

### Imágenes (/assets/panels/)
- bg1.jpg ... bg10.jpg (fondos)
- char1.png ... char10.png (personajes transparentes)
- bg-main.jpg, char-main.png
- detail1.jpg, detail2.jpg

### Audio (/assets/audio/)
- banda-sonora.mp3
- ambiente.mp3
- efectos.mp3
- dialogos.mp3

## 🛠️ Desarrollo

1. **Pruebas sin assets**: `v1/demo.html`
2. **Ver layouts**: `layouts/layouts-index.html`
3. **Producción**: Agregar assets → abrir `index.html`

## 📖 Documentación

- **ESTRUCTURA.md** - Árbol completo del proyecto
- **INSTRUCCIONES.md** - Guía detallada de uso
- **README-SETUP.txt** - Setup paso a paso

## 🎯 Puntos de Entrada

1. **index-nav.html** ⭐ - Navegación principal
2. **v1/START-HERE.html** - Demos
3. **layouts/layouts-index.html** - Layouts
4. **index.html** - Producción

---

## ⚠️ IMPORTANTE: Sin Espacios Negros

**Sistema V2 implementado:**
- ✅ **CERO espacios negros** (teselación perfecta)
- ✅ **Límites: 2 filas (h) x 3 columnas (w)**
- ✅ **Bordes compartidos** entre paneles
- ✅ **Formas trapezoidales** con perspectiva

Ver: **SIN-ESPACIOS.md** para detalles técnicos

**Nota adicional:**
- ✅ `overflow: hidden` al 100%
- ✅ `background-size: cover`
- ✅ Sin borders visibles
