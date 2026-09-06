# Reglas del proyecto

## Actualizar el instalador tras cada cambio de código

Cada vez que se modifique código de la app (main.js, preload.js, renderer.html, home.html, splash.html, adblock.js, etc.), se debe regenerar el instalador ejecutando:

```
npm run dist
```

Esto produce el instalador actualizado en `dist\Centinela BETA Setup 1.0.0.exe`. No consideres una tarea terminada hasta que el instalador esté regenerado con los últimos cambios.
