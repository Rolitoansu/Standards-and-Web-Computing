# Generador de Sitios Web Personales a partir de XML (`PersonalSiteML`)

Este proyecto implementa un **lenguaje de marcado XML** (`PersonalSiteML`) y una **aplicación web accesible según estándares W3C** para generar automáticamente sitios web personales completos a partir de un único archivo XML.

---

## 1. Requisitos Cumplidos

- **Diseño del lenguaje XML y XML Schema**:
  - Definición formal en [`schema/sitio-personal.xsd`](file:///var/www/html/generador-sitios-xml/schema/sitio-personal.xsd) con validaciones de tipos, atributos y cardinalidad.
  - Documentación técnica del vocabulario en [`schema/ESPECIFICACION_XML.md`](file:///var/www/html/generador-sitios-xml/schema/ESPECIFICACION_XML.md).
- **Lenguaje de programación**:
  - Implementado en **JavaScript / TypeScript** estándar mediante el motor [`assets/js/generator.js`](file:///var/www/html/generador-sitios-xml/assets/js/generator.js) ejecutable tanto en navegador web (con `DOMParser`) como en entorno Node.js CLI.
- **Plantillas HTML y CSS existentes**:
  - Reutiliza directamente las plantillas y hojas de estilo CSS de la entrega anterior ([`web-personal`](file:///var/www/html/web-personal/)).
  - El CSS es el mismo para todos los sitios y no se altera dinámicamente; las imágenes se definen mediante atributos XML (`src`, `alt`, `ancho`, `alto`).
- **Accesibilidad y Estándar W3C estricto**:
  - **Cero elementos `<div>`**: sustituidos por elementos estructurales semánticos de HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, `<address>`, `<aside>`, `<p>`, `<table>`, etc.).
  - **Uso mínimo de `id` y `class`**: únicamente los `id` imprescindibles para vincular `<label for="...">` con `<input id="...">` en formularios y atributos semánticos `data-*` y `aria-*` para interacción accesible.
  - **Unidades relativas estrictas**: `rem`, `em`, `%`, `vh`, prohibiendo `px`.
- **Pruebas de la aplicación**:
  1. [`ejemplos-xml/raul-antuna.xml`](file:///var/www/html/generador-sitios-xml/ejemplos-xml/raul-antuna.xml): Sitio personal completo del estudiante Raúl Antuña (reproduce fielmente las 5 páginas de Trabajo II).
  2. [`ejemplos-xml/elena-garcia.xml`](file:///var/www/html/generador-sitios-xml/ejemplos-xml/elena-garcia.xml): Sitio de prueba de Elena García (Data Scientist & AI Researcher).
  3. [`ejemplos-xml/marcos-sanchez.xml`](file:///var/www/html/generador-sitios-xml/ejemplos-xml/marcos-sanchez.xml): Sitio de prueba de Marcos Sánchez (Lead UX/UI Architect).
- **Archivos generados**:
  - Disponibles en [`sitios-generados/`](file:///var/www/html/generador-sitios-xml/sitios-generados/):
    - `sitios-generados/raul-antuna/` (`index.html`, `about.html`, `projects.html`, `cv.html`, `contact.html` + `assets/`)
    - `sitios-generados/elena-garcia/` (`index.html`, `about.html`, `projects.html`, `cv.html`, `contact.html` + `assets/`)
    - `sitios-generados/marcos-sanchez/` (`index.html`, `about.html`, `projects.html`, `cv.html`, `contact.html` + `assets/`)

---

## 2. Aplicación Web del Generador

La aplicación web principal se encuentra en [`index.html`](file:///var/www/html/generador-sitios-xml/index.html).

### Funcionamiento:
1. El usuario accede a la página y encuentra un formulario accesible.
2. Puede subir cualquier archivo `.xml` desde su equipo o seleccionar uno de los ejemplos predefinidos.
3. Elige qué página desea obtener (`index.html`, `about.html`, `projects.html`, `cv.html`, `contact.html` o todas).
4. Al enviar el formulario con **"Generar y Descargar HTML"**, la aplicación:
   - Procesa el documento XML en JavaScript del lado del cliente.
   - Dispara automáticamente la descarga en el navegador del fichero HTML generado.
   - Muestra en tiempo real una vista previa interactiva en el elemento `<iframe>`.

---

## 3. Ejecución por Línea de Comandos (CLI)

También es posible regenerar los sitios estáticos directamente desde la terminal mediante el script Node.js:

```bash
# Regenerar todos los sitios de prueba
node cli/generate.js --all

# Generar un sitio específico
node cli/generate.js --input ejemplos-xml/raul-antuna.xml --output sitios-generados/raul-antuna
```

---

## 4. Estructura de Ficheros

```
generador-sitios-xml/
├── index.html                   ← Aplicación web con formulario de carga y descarga HTML
├── README.md                    ← Documentación del proyecto
├── schema/
│   ├── sitio-personal.xsd       ← Definición formal XML Schema (XSD)
│   └── ESPECIFICACION_XML.md   ← Especificación técnica del vocabulario XML
├── ejemplos-xml/
│   ├── raul-antuna.xml          ← XML del estudiante (Trabajo II)
│   ├── elena-garcia.xml         ← XML de prueba 2 (Data Science)
│   └── marcos-sanchez.xml       ← XML de prueba 3 (UX/UI Architect)
├── assets/
│   ├── css/
│   │   ├── app.css              ← Estilos de la app sin clases ni IDs
│   │   ├── base.css             ← Plantilla base de Trabajo II
│   │   ├── layout.css           ← Plantilla layout de Trabajo II
│   │   ├── index.css            ← Plantilla index de Trabajo II
│   │   ├── about.css            ← Plantilla about de Trabajo II
│   │   ├── projects.css         ← Plantilla projects de Trabajo II
│   │   ├── cv.css               ← Plantilla cv de Trabajo II
│   │   └── contact.css          ← Plantilla contact de Trabajo II
│   ├── js/
│   │   ├── generator.js         ← Motor semántico de generación HTML (DOMParser)
│   │   ├── app.js               ← Controlador del formulario y descargas
│   │   ├── nav.js               ← Navegación accesible
│   │   └── projects.js          ← Filtro de proyectos
│   └── img/                     ← Imágenes y logotipos vectoriales
├── templates/                   ← Plantillas CSS y JS originales
├── sitios-generados/            ← Sitios HTML y CSS generados para cada prueba
│   ├── raul-antuna/
│   ├── elena-garcia/
│   └── marcos-sanchez/
└── cli/
    └── generate.js              ← Script CLI para generación automatizada
```
