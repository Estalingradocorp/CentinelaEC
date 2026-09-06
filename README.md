# Centinela BETA

App de escritorio para Windows que abre **seis plataformas de monitoreo y datos** en ventanas dedicadas, sin necesidad de navegador. Construida con Electron, con temática **azul y negro**, pantalla de carga con logo de Estalingrado Corp y bloqueo de anuncios integrado.

---

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Características](#características)
3. [Plataformas](#plataformas)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Requisitos](#requisitos)
6. [Puesta en marcha (desarrollo)](#puesta-en-marcha-desarrollo)
7. [Generar el instalador](#generar-el-instalador)
8. [Distribución](#distribución)
9. [Solución de problemas](#solución-de-problemas)

---

## Descripción

**Centinela BETA** es un *wrapper* de escritorio construido con [Electron](https://www.electronjs.org/). Su propósito es ofrecer acceso rápido y autónomo a **ocho plataformas** de monitoreo de inteligencia y datos.

Características principales:

- Carga cada web en una ventana dedicada.
- **Pantalla de inicio** con tarjetas para elegir cada plataforma.
- **Menú nativo** para alternar entre webs.
- Muestra una pantalla de carga animada mientras las webs se conectan.
- Reenvía los enlaces externos (que no sean de las webs permitidas) al navegador del sistema.
- Se instala como programa normal de Windows (con acceso directo en escritorio e inicio).

---

## Características

- **Ventana dedicada** (1280×800, tamaño mínimo 800×600) con **marco nativo de Windows** y menú clásico siempre visible (Centinela, Ver, Ayuda).
- **Tema azul y negro** en toda la interfaz (pantalla de inicio y splash), con acentos `#2ea6ff` → `#00b4ff`.
- **Pantalla de inicio**: al arrancar (y con **Inicio** del menú / Ctrl+H) se muestra un lanzador con tarjetas para elegir cada web, tagline descriptivo, reloj en vivo, estado de conexión de cada plataforma (online/offline) e **interruptor "Encriptar la Intra-Net"** (desactivado por defecto; al activarlo un **LED** pasa de rojo a verde y el indicador cambia a *SYS.ENCRYPTION ACTIVE*).
- **Tarjetas con imágenes** propias para Palantir, EC NEWS, EC Terminal Data y EC Send Pro (las demás usan emojis).
- **Opción "Sobre el programa"** en el menú **Ayuda** (F1): modal con la info de Centinela BETA, la descripción y un botón que abre la web de Estalingrado Corp (`estalingradocorp.qzz.io`).
- **Menú nativo** con los módulos **Centinela**, **Ver** y **Ayuda**:
  - **Inicio** (Ctrl+H) y atajos **Ctrl+1 … Ctrl+8** para cambiar de web.
  - Recargar (Ctrl+R), DevTools (F12), Pantalla completa (F11).
  - "Sobre el programa" y accesos a las webs en el navegador.
- **Pantalla de carga (splash)** con logo, título y texto *"Conectando a La Intra-net servicio estalingrado corp…"* con animación de puntos.
- **Carga en paralelo**: la web se carga en segundo plano mientras se muestra el splash, con transición al terminar.
- **Seguridad de navegación**: solo se permiten las plataformas configuradas; el resto de enlaces se abren en el navegador del sistema.
- **Bloqueo de anuncios** (listas EasyList + EasyPrivacy con caché local).
- **Aislamiento de procesos**: `contextIsolation: true` y `nodeIntegration: false`.
- **Instalador NSIS** con asistente, selección de carpeta y accesos directos.

---

## Plataformas

| Atajo | Plataforma | URL |
| --- | --- | --- |
| Ctrl+1 | Palantir Gotham | https://www.palantir.com/platforms/gotham/ |
| Ctrl+2 | Conflict Radar 360 | https://www.conflictradar360.com/ |
| Ctrl+3 | World Monitor | https://www.worldmonitor.app/dashboard?… |
| Ctrl+4 | EC NEWS | https://nicotips27.github.io/ECnews/ |
| Ctrl+5 | EC Terminal Data | https://nicotips27.github.io/Estalingrado-corp-Terminal-data/ |
| Ctrl+6 | Radio Garden | https://radio.garden/ |
| Ctrl+7 | EC Send Pro | https://estalingradocorp.github.io/ECsendpro/ |
| Ctrl+8 | Famelack | https://famelack.com/ |

> World Monitor abre su dashboard en vivo con una configuración concreta (zoom global, últimos 7 días y varias capas de datos).

---

## Estructura del proyecto

```
lucher/
├── package.json        # Configuración del proyecto, scripts y electron-builder
├── package-lock.json   # Bloqueo de dependencias (generado)
├── main.js             # Proceso principal: ventanas, menú nativo, navegación segura e IPC
├── preload.js          # Puente seguro entre el renderizador y Node
├── renderer.html       # Página de respaldo (poco usada)
├── splash.html         # Pantalla de carga con el logo y el texto
├── home.html           # Pantalla de inicio (lanzador)
├── logo.jpg            # Logo de Estalingrado Corp (splash, tarjeta EC Terminal Data)
├── img-ecnews.jpg      # Imagen de la tarjeta EC NEWS
├── img-palantir.png    # Imagen de la tarjeta Palantir
├── img-ecsendpro.png   # Imagen de la tarjeta EC Send Pro
├── icon.png            # Icono de la app (derivado del logo)
├── make-icon.js        # Script que genera icon.png (uso único)
├── adblock.js          # Bloqueo de anuncios con caché local
├── node_modules/       # Dependencias (generado por npm)
└── dist/               # Instaladores generados (resultado del build)
    └── Centinela BETA Setup 1.0.0.exe
```

### Descripción de archivos clave

| Archivo | Rol |
| --- | --- |
| `main.js` | Proceso principal de Electron. Define las webs, construye el menú nativo, crea la ventana del splash y la principal, maneja la navegación segura y el IPC. |
| `home.html` | Pantalla de inicio: tarjetas para elegir cada web, reloj, estado de conexión, interruptor de encriptación y tagline. |
| `splash.html` | Pantalla de carga: logo, título, subtítulo y texto de conexión con animación CSS. |
| `preload.js` | Puente seguro (`window.conflictRadar` y `window.centinela.{selectSite,getCurrent,openExternal}`) entre el renderizador y el proceso principal. |
| `adblock.js` | Inicializa el bloqueo de anuncios (`@cliqz/adblocker`) con listas EasyList/EasyPrivacy y caché local. |
| `package.json` | Define nombre, versión, scripts (`start`, `dist`), archivos empaquetados y configuración de electron-builder. |
| `make-icon.js` | Genera `icon.png` a partir de una imagen (uso único). |

---

## Requisitos

- **Sistema operativo:** Windows 10/11 de 64 bits (para el instalador generado).
- **Node.js** v18 o superior (para desarrollo y compilación). Probado con Node v24.
- **npm** (incluido con Node).

> El instalador generado **no** requiere Node ni Electron instalados en los equipos destino: es un ejecutable autocontenido.

---

## Puesta en marcha (desarrollo)

Desde la carpeta del proyecto:

```powershell
# 1. Instalar dependencias
npm install

# 2. Ejecutar la app en modo desarrollo (ventana de depuración)
npm start
```

Si al instalar dependencias Electron no descarga su binario (política de scripts seguros), asegúrate de que `package.json` contenga:

```json
"allowScripts": {
  "electron": "postinstall"
}
```

y vuelve a ejecutar `npm install`.

---

## Generar el instalador

```powershell
npm run dist
```

O directamente:

```powershell
npx electron-builder --win
```

El resultado queda en `dist/`:

```
dist/
└── Centinela BETA Setup 1.0.0.exe   ← instalador final
```

### Notas sobre el build

- **Icono:** electron-builder convierte `icon.png` (256×256) a `.ico` automáticamente.
- **Primer build:** descarga las herramientas NSIS, así que la primera compilación tarda más.
- **Versión:** el nombre del instalador incluye la `version` de `package.json`. Auméntala (`npm version patch`) antes de publicar una nueva build.

---

## Distribución

El instalador es un **programa de uso interno** que no está firmado digitalmente:

1. Copia `dist\Centinela BETA Setup 1.0.0.exe` al equipo destino.
2. Ejecútalo. Windows mostrará el aviso *"Editor desconocido"*:
   - Pulsa **Más información** → **Ejecutar de todos modos**.
3. Sigue el asistente (elige carpeta y accesos directos).
4. La app queda en Inicio y en el Escritorio.

> **Firma de código:** para eliminar el aviso de Windows necesitas un certificado de firma (coste). No es necesario para uso interno.

---

## Solución de problemas

| Problema | Solución |
| --- | --- |
| Aviso azul "Editor desconocido" al instalar | Normal sin firma: **Más información → Ejecutar de todos modos**. |
| La app no muestra la web (pantalla en blanco) | Verifica la conexión a las plataformas y que el sitio esté en línea. |
| No bloquea anuncios la primera vez | La primera ejecución necesita internet para descargar las listas EasyList/EasyPrivacy y guardarlas en caché. |
| El splash se queda mucho tiempo | Es por red de seguridad; la app fuerza la transición a los ~14,6 s máx. |
| Electron no descarga el binario al `npm install` | Revisa la clave `allowScripts` en `package.json`. |
| La carpeta está en OneDrive y da errores al compilar | OneDrive bloquea archivos en uso. Mueve el proyecto a una ruta local (p. ej. `C:\dev\lucher`). |

---

## Changelog

### v1.0.0
- App inicial *Conflict Radar 360*.
- Renombrado a **Centinela BETA**.
- Pantalla de carga con logo y texto de la Intra-net.
- Icono y empaquetado NSIS.
- Bloqueo de anuncios (EasyList + EasyPrivacy).
- Menú nativo: se añade **World Monitor** y atajos de cambio de web (Ctrl+1 / Ctrl+2).
- **Pantalla de inicio** con tarjetas para elegir cada web (Ctrl+H / menú Centinela).
- Se añaden **EC NEWS**, **EC Terminal Data** y **Radio Garden** (Ctrl+4, Ctrl+5, Ctrl+6).
- **"Sobre el programa"** movido al menú Ayuda con enlace a Estalingrado Corp.
- **Logo de Estalingrado Corp** y tema de interfaz **azul/negro**.
- **Interruptor "Encriptar la Intra-Net"** junto al reloj.
- **Imágenes personalizadas** en las tarjetas de Palantir, EC NEWS y EC Terminal Data.
- Se añaden **EC Send Pro** y **Famelack** (Ctrl+7, Ctrl+8).
- **Ventana nativa de Windows** con menú clásico siempre visible (Centinela, Ver, Ayuda).