# Convenciones de código — Página Personal ECW

Estas reglas se aplican a todos los ficheros HTML, CSS y JS de este proyecto.
Leerlas antes de escribir o modificar cualquier código.

---

## CSS — Estructura de ficheros

Separar el CSS en archivos con responsabilidad única:

- `base.css` — reset, tipografía de elemento, skip link, clase `.sr-only`
- `layout.css` — cabecera, navegación, pie de página
- `<pagina>.css` — estilos exclusivos de cada página (`index.css`, `about.css`…)

Cada HTML enlaza exactamente tres archivos: `base.css` + `layout.css` + el CSS de su página.
Nunca un CSS monolítico único para todo el sitio.

---

## CSS — Selectores

**Prohibido el uso de selectores de clase (.) y de identificador (#) en CSS.**
Usar exclusivamente **selectores estructurales y de atributos**. El orden de preferencia es:

1. Elemento + descendencia: `body > header nav`
2. Atributos: `[aria-current]`, `[data-estado="completado"]`, `[data-abierto="true"]`, `[href^="mailto"]`
3. Pseudoclases estructurales: `:first-of-type`, `:nth-of-type(2)`, `:last-child`
4. Pseudoclases de estado: `:focus-visible`, `:hover`, `:checked`

```css
/* Correcto */
body > header nav ul li a[aria-current="page"] {
  color: var(--primario);
}
body > main > section:nth-of-type(2) {
  background: var(--superficie);
}
article[data-estado="completado"] > span {
  color: var(--exito);
}
body > header nav ul[data-abierto="true"] {
  display: flex;
}

/* Prohibido — nunca usar selectores de clase ni de id */
.nav-link--active { ... }
.is-open { ... }
.sr-only { ... }
#proyectos-lista { ... }
```

---

## CSS — Unidades

Solo unidades relativas. **Nunca jamás usar `px` bajo ningún concepto**.

| Contexto                        | Unidad                            |
| ------------------------------- | --------------------------------- |
| Tamaño de fuente                | `rem`                             |
| Padding y margin de componentes | `rem` o `em`                      |
| Anchos fluidos                  | `%`, `fr`, `ch`                   |
| Alturas de viewport             | `vh`                              |
| Anchos máximos de layout        | `rem` (p. ej. `68.75rem`)         |
| Breakpoints en `@media`         | `rem`                             |
| Bordes                          | `rem` (p. ej. `0.0625rem`, `0.125rem`, `0.1875rem`) |

Nunca `px`, `pt`, `cm`, ni valores absolutos de ningún tipo.

---

## CSS — Variables y valores de diseño

Se permite y recomienda el uso de variables CSS (`var(--*)`) definidas de forma centralizada en el bloque `:root` de `base.css` (colores de la paleta, anchos de layout, radios de borde y transiciones).
En estilos específicos locales también se pueden combinar valores directos o variables según convenga, manteniendo la coherencia visual.

```css
/* Correcto — variables centralizadas en base.css */
:root {
  --fondo: #ffffff;
  --superficie: #f5f7fb;
  --borde: #dde3ef;
  --primario: #2563eb;
  --ancho-max: 68.75rem;
}

body > header {
  background: var(--superficie);
  border-bottom: 0.0625rem solid var(--borde);
}
```

---

## CSS — Hover y transiciones

Usar `:hover` y `transition` solo donde aporten valor de usabilidad real:

- Permitido: enlaces de navegación, botones de formulario, enlaces de texto
- No usar: tarjetas informativas, secciones de estadísticas, avatares, logos

No añadir `transform: translateY` ni `box-shadow` como único efecto de hover en tarjetas.
Si hay animación de entrada, que sea sutil y no se repita en cada elemento de la página.

---

## CSS — Aspecto humano

- No crear bloques de reglas perfectamente simétricas para cada variante de un componente
- Combinar selectores con propiedades comunes usando coma
- Los gradientes de fondo deben ser sutiles (no oscuros ni muy saturados)
- Comentarios breves y directos, no listas exhaustivas de elementos
- Variar ligeramente tamaños y márgenes; no todo múltiplo de 4

---

## HTML — Prohibición de clases e IDs
 
 **No usar atributos `class` ni `id` en el código HTML.**
 
 - La accesibilidad de secciones se resuelve con `aria-label="..."`.
 - El menú móvil se controla mediante atributos como `data-abierto="true|false"` y `aria-expanded`.
 - El salto al contenido principal se gestiona con el enlace a `#contenido` y se captura por JavaScript sin necesidad de IDs.
 - La ocultación visual para lectores de pantalla se define en CSS sobre elementos semánticos concretos (`table caption`, etc.).

---

## HTML — Emojis

No usar emojis Unicode en el contenido HTML.
Para iconos decorativos, usar SVG descargado de fuente oficial con `aria-hidden="true"`.

Para logos de tecnologías, descargar los SVG de devicons y guardarlos en `assets/img/logos/`:

```bash
BASE="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.15.1/icons"
curl -sL "$BASE/html5/html5-original.svg"          -o assets/img/logos/html5.svg
curl -sL "$BASE/css3/css3-original.svg"            -o assets/img/logos/css3.svg
curl -sL "$BASE/javascript/javascript-original.svg" -o assets/img/logos/javascript.svg
curl -sL "$BASE/react/react-original.svg"          -o assets/img/logos/react.svg
curl -sL "$BASE/python/python-original.svg"        -o assets/img/logos/python.svg
curl -sL "$BASE/postgresql/postgresql-original.svg" -o assets/img/logos/postgresql.svg
curl -sL "$BASE/docker/docker-original.svg"        -o assets/img/logos/docker.svg
```

Usar siempre `alt=""` y `aria-hidden="true"` en imágenes puramente decorativas.

---

## HTML — Fuentes

No usar Google Fonts ni ninguna petición externa de tipografía.
Definir siempre un stack de sistema:

```css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
  sans-serif;
```

---

## HTML — Accesibilidad (WCAG 2.1 AA)

Requisitos mínimos por página:

- Primer hijo de `<body>`: `<a href="#main-content">Saltar al contenido principal</a>`
- `<section>` con `aria-labelledby` apuntando a su heading interno
- `<nav>` siempre con `aria-label` descriptivo
- `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`
- Formularios: `<label for>` explícito en cada campo, `aria-required="true"`, `aria-describedby` para errores, `role="alert"` + `aria-live="polite"` en mensajes de validación
- Tablas: `<caption>` o `aria-label`, `scope="row"` o `scope="col"` en `<th>`
- Barras de progreso: `role="progressbar"` + `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- Vídeo: atributo `controls`, `preload="metadata"`, `poster`, `<track kind="captions">`
- Audio: atributo `controls`, `aria-label`
- Contraste mínimo 4.5:1 en texto normal, 3:1 en texto grande
- Foco visible en todos los elementos interactivos; nunca quitar `outline` sin alternativa visible

---

## HTML — Semántica HTML5

Usar siempre los elementos correctos:

- `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`
- `<figure>` + `<figcaption>` para imágenes con descripción
- `<time datetime="YYYY-MM-DD">` para fechas
- `<ol>` para timelines y pasos ordenados, `<ul>` para listas no ordenadas
- Un único `<h1>` por página; no saltar niveles de heading
- `<table>` con `<thead>`, `<tbody>`, `<th scope="…">`

---

## JavaScript

- Vanilla JS, sin frameworks ni librerías externas
- Los scripts se enlazan en `<head>` con el atributo `defer`
- Encapsular en IIFE con 'use strict' y escuchar el evento `DOMContentLoaded`:
  ```javascript
  (function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
      // manipulación del DOM
    });
  }());
  ```
- Preferir selección por atributo o relación DOM antes que por clase
- Al cerrar un menú o modal, devolver el foco al elemento que lo abrió
- Los mensajes de error de formulario se muestran añadiendo la clase `.visible` al `<span role="alert">`, no manipulando `display` directamente desde CSS dinámico

---

## Estructura de carpetas

```
/
├── AGENTS.md             ← este fichero
├── index.html
├── about.html
├── projects.html
├── cv.html
├── contact.html
└── assets/
    ├── css/
    │   ├── base.css
    │   ├── layout.css
    │   ├── index.css
    │   ├── about.css
    │   ├── projects.css
    │   ├── cv.css
    │   └── contact.css
    ├── img/
    │   └── logos/        (SVG de devicons)
    ├── audio/
    ├── video/
    └── js/
        ├── nav.js
        └── projects.js
```
