# Roadmap Interactivo - Guía de Uso

## Estructura del JSON

Cada nodo en `roadmap.json` puede contener la siguiente información:

### Campos Obligatorios
- `id`: Identificador único del nodo
- `title`: Nombre de la tecnología
- `icon`: URL del icono SVG
- `x`, `y`: Posición en el canvas
- `level`: Nivel de dificultad/progresión (1-5)
- `color`: Color hexadecimal del nodo
- `connections`: Array de IDs de nodos conectados
- `requires`: Array de IDs de nodos prerequisitos
- `locked`: Boolean indicando si el nodo está bloqueado
- `active`: Boolean indicando si el nodo está activo

### Campos de Información Extendida (Opcionales pero Recomendados)

#### Información Básica
- `description`: Descripción corta (1 línea)
- `what_is`: Explicación detallada de qué es la tecnología
- `why_learn`: Razones para aprender esta tecnología

#### Conceptos y Aplicaciones
- `key_concepts`: Array de conceptos fundamentales a aprender
- `use_cases`: Array de casos de uso prácticos

#### Relaciones
- `relation_with_nodes`: Objeto con relaciones a otros nodos
  ```json
  {
    "node-id": "Explicación de la relación"
  }
  ```

#### Metadatos de Aprendizaje
- `difficulty`: Nivel de dificultad
  - Opciones: "Principiante", "Principiante-Intermedio", "Intermedio", "Intermedio-Avanzado", "Avanzado"
- `estimated_time`: Tiempo estimado de aprendizaje (ej: "2-3 semanas")
- `prerequisites`: Texto describiendo lo que se necesita saber antes
- `rating`: Calificación de 1-5 estrellas

#### Recursos
- `resources`: Array de recursos de aprendizaje
  ```json
  [
    {
      "name": "Nombre del recurso",
      "url": "https://ejemplo.com"
    }
  ]
  ```
- `url`: URL principal de aprendizaje

## Colores para Dificultad

El sistema usa estos colores automáticamente:
- **Principiante**: Verde (#10b981)
- **Principiante-Intermedio**: Azul (#3b82f6)
- **Intermedio**: Naranja (#f59e0b)
- **Intermedio-Avanzado**: Rojo (#ef4444)
- **Avanzado**: Rojo oscuro (#dc2626)

## Plantilla de Nodo

Consulta `template_node.json` para ver un ejemplo completo de todos los campos disponibles.

## Ejemplo Completo

Ver los nodos `html`, `css`, `javascript` y `react` en el archivo `roadmap.json` para ejemplos completos de implementación.

## Nodos Bloqueados

Los nodos bloqueados (`locked: true`) mostrarán:
- Modal en escala de grises
- Mensaje indicando los prerequisitos
- Botones deshabilitados
- Información limitada

## Iconos

Los iconos se obtienen de https://svgl.app/library/
Formato: `https://svgl.app/library/[nombre-tecnologia].svg`
