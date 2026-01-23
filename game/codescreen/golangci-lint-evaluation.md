# Evaluación: golangci-lint vs Tree-sitter para Go

## ¿Qué es golangci-lint?

**golangci-lint** es un agregador de linters para Go que ejecuta ~50 linters en paralelo:
- `go vet` - Errores de sintaxis y semántica
- `staticcheck` - Análisis estático avanzado
- `errcheck` - Detección de errores no manejados
- `gosec` - Seguridad
- `gofmt` - Formato
- Y muchos más...

## Problema: No funciona en el navegador

### ❌ Limitaciones de golangci-lint

```bash
# golangci-lint es un binario de Go
golangci-lint run ./...

# Requiere:
1. Sistema de archivos completo
2. Acceso a $GOPATH y módulos
3. Compilador de Go
4. Ejecutarse en servidor/backend
```

**NO existe versión WebAssembly de golangci-lint.**

### Razones técnicas:

1. **Dependencias del sistema:**
   - Necesita acceso al sistema de archivos
   - Lee `go.mod`, descarga dependencias
   - Ejecuta compilador de Go

2. **Peso:**
   - Binary ~50MB
   - Incluye 50+ linters
   - Imposible en navegador

3. **Análisis semántico:**
   - golangci-lint valida tipos, imports, paquetes
   - Necesita contexto completo del proyecto
   - No solo sintaxis

## Comparación: golangci-lint vs Tree-sitter

| Característica          | golangci-lint           | Tree-sitter Go         |
|-------------------------|-------------------------|------------------------|
| **Ubicación**           | Backend/Server          | Navegador (WASM)       |
| **Peso**                | ~50MB                   | ~500KB                 |
| **Validación**          | Sintaxis + Semántica    | Solo sintaxis          |
| **Errores detectados**  | Todos + code quality    | Solo sintaxis          |
| **Latencia**            | 1-3 segundos            | <100ms                 |
| **Setup**               | Backend Go requerido    | CDN, sin backend       |
| **Costo**               | Servidor Go             | Gratis (CDN)           |

## Ejemplos de diferencias

### Tree-sitter (actual) detecta:

```go
func test(        // ❌ Error de sintaxis
    if x {        // ❌ Error de sintaxis
        println(  // ❌ Paréntesis sin cerrar
```

✅ **Errores de sintaxis pura**

### golangci-lint detectaría ADEMÁS:

```go
func test() {
    var unused int       // ⚠️ Variable no usada
    err := doSomething() // ⚠️ Error no manejado
    fmt.Println("test")  // ⚠️ fmt no importado
}
```

✅ **Errores de sintaxis**
✅ **Errores semánticos**
✅ **Code quality**
✅ **Best practices**

## Opciones de implementación

### Opción 1: Tree-sitter (Actual) ✅ Recomendada

**Pros:**
- ✅ Ya implementado
- ✅ Funciona en navegador
- ✅ Sin backend
- ✅ Rápido (<100ms)
- ✅ Suficiente para ejercicios de código

**Contras:**
- ⚠️ Solo valida sintaxis
- ⚠️ No detecta imports faltantes
- ⚠️ No valida tipos

**Uso:** Ejercicios de aprendizaje donde importas están dados.

---

### Opción 2: golangci-lint en Backend

**Arquitectura:**
```
[Monaco Editor]
    ↓ HTTP
[API Backend Go]
    ↓ ejecuta
[golangci-lint]
    ↓ resultado
[Monaco Editor muestra errores]
```

**Pros:**
- ✅ Validación completa
- ✅ Detecta todos los errores
- ✅ Code quality checks

**Contras:**
- ❌ Requiere backend Go
- ❌ Latencia 1-3 segundos
- ❌ Costo de servidor
- ❌ Más complejo

**Implementación:**

```javascript
// Frontend
async function validateGoWithBackend(code) {
    const response = await fetch('/api/lint/go', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const { errors } = await response.json();

    const markers = errors.map(err => ({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: err.endColumn,
        message: err.message
    }));

    monaco.editor.setModelMarkers(editor.getModel(), 'go-lint', markers);
}
```

```go
// Backend (ejemplo)
package main

import (
    "encoding/json"
    "net/http"
    "os/exec"
)

func lintGoCode(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Code string `json:"code"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    // Escribir código a archivo temporal
    tmpFile := writeToTemp(req.Code)
    defer os.Remove(tmpFile)

    // Ejecutar golangci-lint
    cmd := exec.Command("golangci-lint", "run", tmpFile)
    output, _ := cmd.CombinedOutput()

    errors := parseGolangciOutput(output)

    json.NewEncoder(w).Encode(map[string]interface{}{
        "errors": errors,
    })
}
```

---

### Opción 3: Híbrido (Mejor de ambos)

**Tree-sitter en tiempo real + golangci-lint al ejecutar**

```javascript
// Validación sintaxis en tiempo real (Tree-sitter)
editor.onDidChangeModelContent(() => {
    validateGoWithTreeSitter(code); // <100ms
});

// Validación completa al presionar "Ejecutar" (Backend)
runButton.addEventListener('click', async () => {
    await validateGoWithBackend(code); // 1-3s
    if (noErrors) {
        executeCode();
    }
});
```

**Pros:**
- ✅ Feedback instantáneo (sintaxis)
- ✅ Validación profunda (al ejecutar)
- ✅ Mejor UX

**Contras:**
- ⚠️ Requiere backend
- ⚠️ Más complejo

---

## Recomendación Final

### Para tu caso de uso (ejercicios de código):

**✅ Usar Tree-sitter (actual)**

**Razones:**
1. Los ejercicios tienen plantillas con imports correctos
2. Solo necesitas validar sintaxis
3. No requiere backend
4. Feedback instantáneo
5. Suficiente para aprendizaje

### Cuándo usar golangci-lint:

- ✅ Proyectos Go reales (múltiples archivos)
- ✅ Code review automatizado
- ✅ CI/CD pipelines
- ✅ Cuando tienes backend disponible

---

## Conclusión

**Tree-sitter es la mejor opción para tu caso.**

Si más adelante necesitas validación completa:
1. Implementa backend Go
2. Usa golangci-lint en servidor
3. Llama vía API al presionar "Ejecutar"

Pero para ejercicios de sintaxis, Tree-sitter es perfecto.
