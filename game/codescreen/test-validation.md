# Pruebas de Validación de Sintaxis - Monaco Editor

## JavaScript (`?lang=javascript`)

### ✅ Errores que SÍ detecta:
```javascript
function test(     // ❌ Missing closing parenthesis
const x =          // ❌ Missing value
if (true {         // ❌ Missing closing parenthesis
let y = [1, 2,     // ❌ Missing closing bracket
function foo() {   // ❌ Missing closing brace
```

### ❌ Errores que NO detecta:
```javascript
import React from 'react'     // ✓ OK (módulo no encontrado - ignorado)
require('express')            // ✓ OK (módulo no encontrado - ignorado)
const api = new APIClient()   // ✓ OK (clase no definida - ignorado)
```

**Prueba en navegador:**
1. Abre: `http://localhost:8080/code-exercise.html?lang=javascript`
2. Escribe: `function test(`
3. Deberías ver línea roja debajo

---

## Python (`?lang=python`)

### ⚠️ LIMITACIÓN: Monaco NO valida sintaxis de Python en tiempo real

Monaco Editor no incluye un parser de Python nativo. Solo ofrece:
- ✅ Syntax highlighting (colores)
- ✅ Indentación automática
- ❌ NO valida sintaxis en tiempo real
- ❌ NO muestra errores rojos

**Ejemplos que NO marcarán error:**
```python
def test(          # No marca error
    if x           # No marca error
print("hola"       # No marca error (falta paréntesis)
```

**Solución:** La validación de Python debe hacerse en backend (OpenAI).

---

## Java (`?lang=java`)

### ⚠️ LIMITACIÓN: Monaco NO valida sintaxis de Java en tiempo real

Similar a Python, Monaco no incluye compilador Java.
- ✅ Syntax highlighting
- ❌ NO valida sintaxis

---

## C++ (`?lang=cpp`)

### ⚠️ LIMITACIÓN: Monaco NO valida sintaxis de C++ en tiempo real

- ✅ Syntax highlighting
- ❌ NO valida sintaxis

---

## HTML (`?lang=html`)

### ✅ Errores que SÍ detecta:
```html
<div>             <!-- ❌ Missing closing tag -->
<img src="       <!-- ❌ Unclosed attribute -->
<p class=>       <!-- ❌ Empty attribute -->
```

---

## CSS (`?lang=css`)

### ✅ Errores que SÍ detecta:
```css
.class {          /* ❌ Missing closing brace */
color: red        /* ❌ Missing semicolon (warning) */
background: #     /* ❌ Invalid color */
```

---

## Resumen

| Lenguaje   | Validación en Tiempo Real | Muestra Errores Rojos |
|------------|---------------------------|----------------------|
| JavaScript | ✅ SÍ                     | ✅ SÍ                |
| TypeScript | ✅ SÍ                     | ✅ SÍ                |
| HTML       | ✅ SÍ                     | ✅ SÍ                |
| CSS        | ✅ SÍ                     | ⚠️ Warnings          |
| Python     | ❌ NO                     | ❌ NO                |
| Java       | ❌ NO                     | ❌ NO                |
| C++        | ❌ NO                     | ❌ NO                |

---

## Recomendaciones

### Para JavaScript, HTML, CSS:
- ✅ Usar Monaco como está
- ✅ Los errores se muestran en tiempo real

### Para Python, Java, C++:
- ⚠️ Monaco solo da syntax highlighting
- ✅ Validación debe hacerse con OpenAI al ejecutar
- ✅ Mostrar errores después de presionar "Ejecutar"

### Alternativa: Integrar Language Servers
Para validación real de Python/Java/C++, necesitarías:
- Pyright Language Server (Python)
- Java Language Server
- Clangd (C++)

Esto requiere backend y es más complejo.
