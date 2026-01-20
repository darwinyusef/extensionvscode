# 👥 Character Assets

Esta carpeta contiene los sprites/imágenes de los NPCs del juego.

## 📁 Archivos Actuales

- `elder_tim.svg` - Elder Tim (Mentor HTML) 🔵
- `flexbox_fred.svg` - Flexbox Fred (Guru CSS) 🟢
- `async_andy.svg` - Async Andy (Expert JavaScript) 🟡

## 🎨 Agregar Nuevos Personajes

### Opción 1: Usar SVG (Recomendado)

**Ventajas:**
- Se escalan sin perder calidad
- Archivos pequeños
- Fáciles de editar

**Formato:**
```
assets/characters/nombre_personaje.svg
```

**Dimensiones recomendadas:** 100x100px

### Opción 2: Usar PNG/JPG

**Formato:**
```
assets/characters/nombre_personaje.png
```

**Dimensiones recomendadas:** 200x200px (o múltiplos de 100)

## 🔧 Cómo Integrar un Nuevo Personaje

### 1. Agregar la imagen
Coloca tu archivo en esta carpeta:
```
assets/characters/mi_nuevo_npc.svg
```

### 2. Actualizar `data/npcs/npcs.json`
```json
{
  "id": "nuevo_npc",
  "name": "Mi NPC",
  "role": "Especialista en React",
  "personality": "amigable",
  "specialty": "react",
  "sprite": "npc_nuevo",
  "image": "assets/characters/mi_nuevo_npc.svg",
  "x": 400,
  "y": 500,
  "dialogueFile": "data/dialogues/nuevo_npc.json",
  "unlockedDialogues": ["first_meeting"]
}
```

### 3. Actualizar `npc-game-integration.js`
En la función `createNPCSprites()`, agrega:
```javascript
this.load.image('npc_nuevo', 'assets/characters/mi_nuevo_npc.svg');
```

### 4. Crear diálogos
Crea `data/dialogues/nuevo_npc.json` (ver otros ejemplos).

## 🎭 Personalidades Disponibles

Puedes usar estas personalidades predefinidas:

- `sabio` - Formal, reflexivo, usa metáforas
- `amigable` - Casual, alegre
- `perfeccionista` - Técnico, preciso
- `enigmático` - Misterioso, críptico
- `relajado` - Chill, bromista
- `impaciente` - Rápido, directo

O crear nuevas en `data/npcs/personalities.json`.

## 🖼️ Recursos para Crear Personajes

### Generadores Online (SVG)
- [SVG Avatar Generator](https://avatars.dicebear.com/)
- [Boring Avatars](https://boringavatars.com/)
- [Multiavatar](https://multiavatar.com/)

### Herramientas de Diseño
- [Figma](https://figma.com) - Diseño vectorial
- [Inkscape](https://inkscape.org) - Editor SVG gratuito
- [Adobe Illustrator](https://adobe.com/illustrator) - Profesional

### Sprites Pixelart
- [Piskel](https://piskelapp.com) - Editor de pixel art
- [Aseprite](https://aseprite.org) - Animación pixelart

### AI Generators
- [DALL-E](https://openai.com/dall-e)
- [Midjourney](https://midjourney.com)
- [Stable Diffusion](https://stablediffusion.com)

## 📐 Guía de Estilo

Para mantener consistencia visual:

### Colores por Tecnología
- HTML: `#e44d26` (naranja/rojo)
- CSS: `#1572b6` (azul)
- JavaScript: `#f7df1e` (amarillo)
- React: `#61dafb` (cyan)
- Node.js: `#339933` (verde)
- TypeScript: `#3178c6` (azul oscuro)
- Python: `#3776ab` (azul/amarillo)

### Características Visuales
- **Mentor**: Gafas, barba, libro
- **Amigable**: Sonrisa, colores cálidos
- **Técnico**: Formal, colores fríos
- **Energético**: Líneas de movimiento, colores brillantes

## 💡 Tips

1. **Nombres de archivo**: Usa snake_case (ej: `elder_tim.svg`)
2. **ID en JSON**: Debe coincidir con el nombre del archivo
3. **Tamaño en juego**: Los sprites se escalan a 80x80px por defecto
4. **Transparencia**: Usa fondo transparente en PNG
5. **Optimización**: Comprime SVG con [SVGOMG](https://jakearchibald.github.io/svgomg/)

## 🔄 Reemplazar Personajes Existentes

Si quieres cambiar un personaje, solo reemplaza su archivo SVG/PNG manteniendo el mismo nombre:

```bash
# Ejemplo: reemplazar Elder Tim
cp mi_nuevo_elder.svg assets/characters/elder_tim.svg
```

No necesitas modificar código, solo recargar el juego.

---

**¿Necesitas ayuda?** Revisa `NPC_SETUP_GUIDE.md` en la raíz del proyecto.
