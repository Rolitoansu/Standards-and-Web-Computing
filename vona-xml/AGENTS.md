# Convenciones de código — Visualizador VONA XML

Este repositorio implementa el visualizador de avisos volcánicos para la aviación (VONA - Volcano Observatory Notice for Aviation) conforme al estándar OACI/WMO e IWXXM, mapeando la información de posición, columna eruptiva (humo/ceniza) y datos del estándar sobre mapas interactivos.

## Estructura de ficheros

- `index.html` — Documento principal accesible según WCAG 2.1 AA, sin atributos `class` ni `id`.
- `assets/css/base.css` — Reset CSS, tipografía de sistema, skip link y variables en `:root`.
- `assets/css/layout.css` — Estilos de cabecera, navegación, estructura principal y pie de página.
- `assets/css/index.css` — Estilos de la página: mapa, paneles de datos VONA, dropzone, tablas y visualizador.
- `assets/js/nav.js` — Lógica de navegación accesible y control de salto al contenido.
- `assets/js/app.js` — Parser XML del estándar VONA (IWXXM y XML estructurado), cálculo de dispersión de pluma y renderizado en Mapbox.

## Reglas obligatorias de estilo

1. **Se puede usar selectores de clase (solo cuando está muy justificado, para secciones o cosas muy específicas) (.) ni de ID (#) en CSS**: Únicamente selectores estructurales y por atributos.
2. **Unidades relativas estrictas**: Prohibido el uso de `px`. Todas las dimensiones se definen en `rem`, `em`, `%`, `ch` o `vh`.
3. **Se puede usar clases ni IDs en HTML (solo cuando está muy justificado, para secciones o cosas muy específicas)**: La accesibilidad e interacción se resuelven mediante semántica y atributos `data-*` y `aria-*`.
4. **Sin emojis Unicode**: Los iconos son elementos SVG vectoriales con `aria-hidden="true"`.
5. **Tipografía de sistema**: Stack nativo sin peticiones a fuentes externas.
