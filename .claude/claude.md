# por favor no agregues comentarios con #-----------
# ======================= no uses este ni ningun separador 

Si te refieres a crear un archivo claude.md o .clauderc (o similar) para que Claude lo lea cada vez que inicies un proyecto o para tenerlo como referencia de reglas, aquí tienes el contenido optimizado para ahorrar tokens y evitar basura:

Crea un archivo llamado claude.md en la raíz de tu proyecto y pega esto:

Markdown

# Reglas de Comportamiento (Strict Mode)

A partir de ahora, todas las respuestas deben seguir estas reglas para optimizar el uso de tokens y eficiencia:

1. **PROHIBIDO .MD:** No generes archivos de documentación, READMEs, o guías de instalación a menos que te lo pida con la frase exacta "Genera documentación".
2. **CÓDIGO PURO:** Entrega solo el bloque de código funcional. No expliques qué hace el código a menos que el código falle.
3. **SIN PREÁMBULOS:** Elimina frases como "Claro, aquí tienes...", "Espero que esto ayude" o "He actualizado el código".
4. **FORMATO DE RESPUESTA:**
   - Si es una corrección: Solo el snippet modificado.
   - Si es una duda: Respuesta en menos de 20 palabras.
   - Si es MCP: Ejecuta la herramienta directamente sin confirmar primero.