# Generador de Sitios Web Personales a partir de XML (`PersonalSiteML`)

Este proyecto implementa un **lenguaje de marcado XML** (`PersonalSiteML`) y una **aplicación web accesible según estándares W3C** para generar y empaquetar automáticamente sitios web personales completos en formato **ZIP**, con soporte nativo de **WebAssembly (WASM)**, arquitectura **TypeScript** e **imágenes vectoriales genéricas**.

---

## 1. Requisitos Cumplidos

- **Diseño del lenguaje XML y XML Schema**:
  - Definición formal en [`schema/sitio-personal.xsd`](schema/sitio-personal.xsd) con validaciones de tipos, atributos y cardinalidad.
  - Documentación técnica del vocabulario en [`schema/ESPECIFICACION_XML.md`](schema/ESPECIFICACION_XML.md).
- **Lenguaje de programación y arquitectura TypeScript**:
  - Modelado fuertemente tipado en [`src/ts/types.ts`](src/ts/types.ts), [`src/ts/parser.ts`](src/ts/parser.ts), [`src/ts/validator.ts`](src/ts/validator.ts) y [`src/ts/generator.ts`](src/ts/generator.ts).
  - Configuración formal del compilador en [`tsconfig.json`](tsconfig.json).
  - Motor de ejecución en cliente y servidor mediante [`assets/js/generator.js`](assets/js/generator.js).
- **WebAssembly (WASM) nativo**:
  - Módulo en formato texto [`src/wasm/xml_metrics.wat`](src/wasm/xml_metrics.wat) compilado a [`assets/wasm/xml_metrics.wasm`](assets/wasm/xml_metrics.wasm).
  - Ejecuta a bajo nivel en memoria lineal:
    - `calcular_hash`: Checksum FNV-1a de 32 bits para verificación de integridad ultrarrápida.
    - `contar_etiquetas_xml`: Conteo léxico directo de nodos XML en memoria.
    - `calcular_puntuacion_complejidad`: Índice de complejidad estructural del sitio.
  - Conector universal en [`assets/js/wasm_runner.js`](assets/js/wasm_runner.js) para navegador y Node.js.
- **Empaquetado en ZIP con Fotos Genéricas**:
  - Generación de paquetes ZIP autónomos completos mediante `JSZip`.
  - Catálogo de imágenes vectoriales SVG genéricas (100% responsivas, ligeras y accesibles):
    - `assets/img/avatar-generico.svg` (Perfil profesional neutro)
    - `assets/img/avatar-desarrollador.svg` (Perfil desarrollo y software)
    - `assets/img/avatar-disenador.svg` (Perfil creativo y UX/UI)
    - `assets/img/proyecto-generico.svg` (Mockup de aplicación/dashboard)
    - `assets/img/interes-generico.svg` (Ilustración de aficiones)
  - Al descomprimir el ZIP, cada página HTML carga sus imágenes localmente sin dependencias externas ni imágenes rotas.
- **Accesibilidad y Estándar W3C estricto**:
  - **Cero elementos `<div>`**: sustituidos por elementos estructurales semánticos de HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, `<address>`, `<aside>`, `<p>`, `<table>`, `<dl>`, etc.).
  - **Uso mínimo de `id` y `class`**: selectores estructurales y semánticos sin clases ni IDs en CSS.
  - **Unidades relativas estrictas**: `rem`, `em`, `%`, `vh`, prohibiendo `px`.
- **Pruebas de la aplicación**:
  1. [`ejemplos-xml/raul-antuna.xml`](ejemplos-xml/raul-antuna.xml): Sitio personal de Raúl Antuña (Software Engineer).
  2. [`ejemplos-xml/elena-garcia.xml`](ejemplos-xml/elena-garcia.xml): Sitio de Elena García (Data Scientist & AI Researcher).
  3. [`ejemplos-xml/marcos-sanchez.xml`](ejemplos-xml/marcos-sanchez.xml): Sitio de Marcos Sánchez (Lead UX/UI Architect).
- **Archivos generados y paquetes ZIP**:
  - Sitios estáticos y ficheros `.zip` listos para desplegar en [`sitios-generados/`](sitios-generados/):
    - `sitios-generados/raul-antuna.zip` y carpeta `raul-antuna/`
    - `sitios-generados/elena-garcia.zip` y carpeta `elena-garcia/`
    - `sitios-generados/marcos-sanchez.zip` y carpeta `marcos-sanchez/`

---

## 2. Aplicación Web del Generador

La aplicación web principal se encuentra en [`index.html`](index.html).

### Funcionamiento:
1. El usuario accede a la página y encuentra un formulario accesible.
2. Puede cargar un ejemplo predefinido con un solo clic o subir un archivo XML local.
3. Permite configurar el **estilo de foto/avatar genérico** deseado (neutro, desarrollador, diseñador o respetar XML).
4. Al pulsar **"Generar y Descargar Sitio Web Completo (ZIP)"**:
   - WebAssembly analiza el documento XML en milisegundos (hash, nodos, tamaño, complejidad).
   - El motor semántico genera los 5 documentos HTML5 W3C.
   - Se empaquetan en el ZIP los HTMLs, CSS, JS e imágenes vectoriales genéricas.
   - El navegador inicia la descarga automática del archivo `.zip`.
   - Se muestran las métricas de rendimiento WASM en un panel accesible `<dl>`.

---

## 3. Ejecución por Línea de Comandos (CLI)

Es posible regenerar los sitios estáticos y sus paquetes ZIP directamente desde la terminal mediante el script Node.js:

```bash
# Regenerar todos los sitios de prueba y sus paquetes ZIP
node cli/generate.js --all

# Generar un sitio específico con avatar personalizado
node cli/generate.js --input ejemplos-xml/raul-antuna.xml --output sitios-generados/raul-antuna --avatar avatar-desarrollador.svg
```

---

## 4. Estructura de Ficheros

```
generador-sitios-xml/
├── index.html                   ← Aplicación web con formulario accesible y métricas WASM
├── README.md                    ← Documentación completa del proyecto
├── tsconfig.json                ← Configuración del compilador TypeScript
├── schema/
│   ├── sitio-personal.xsd       ← Definición formal XML Schema (XSD)
│   └── ESPECIFICACION_XML.md   ← Especificación técnica del vocabulario XML
├── ejemplos-xml/
│   ├── raul-antuna.xml          ← XML del estudiante (Trabajo II)
│   ├── elena-garcia.xml         ← XML de prueba 2 (Data Science)
│   └── marcos-sanchez.xml       ← XML de prueba 3 (UX/UI Architect)
├── src/
│   ├── ts/                      ← Lógica fuertemente tipada en TypeScript
│   │   ├── types.ts             ← Interfaces y tipos del modelo de datos
│   │   ├── parser.ts            ← Parser DOM con soporte de opciones de fotos
│   │   ├── validator.ts         ← Validador de reglas de negocio
│   │   └── generator.ts         ← Motor de plantillas HTML5 semántico
│   ├── wasm/                    ← Código fuente WebAssembly
│   │   ├── xml_metrics.wat      ← Código fuente en WebAssembly Text Format
│   │   └── build_wasm.js        ← Script de compilación WAT -> WASM (wabt)
│   └── js/
│       ├── generator_engine.js  ← Motor unificado
│       └── wasm_runner.js       ← Ejecutor de WebAssembly con fallback
├── assets/
│   ├── wasm/
│   │   └── xml_metrics.wasm     ← Binario WebAssembly nativo
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
│   │   ├── generator.js         ← Motor semántico para cliente y CLI
│   │   ├── wasm_runner.js       ← Módulo cliente de WebAssembly
│   │   ├── app.js               ← Controlador accesible y empaquetador ZIP
│   │   ├── jszip.min.js         ← Biblioteca de compresión ZIP
│   │   ├── templates_bundle.js  ← Bundle en memoria de CSS, JS y SVGs
│   │   ├── nav.js               ← Navegación accesible
│   │   └── projects.js          ← Filtro de proyectos
│   └── img/                     ← Imágenes vectoriales genéricas y logotipos
│       ├── avatar-generico.svg
│       ├── avatar-desarrollador.svg
│       ├── avatar-disenador.svg
│       ├── proyecto-generico.svg
│       ├── interes-generico.svg
│       └── logos/               ← Logotipos SVG de tecnologías
├── templates/                   ← Plantillas CSS y JS originales
├── sitios-generados/            ← Sitios HTML y archivos ZIP generados
│   ├── raul-antuna/ & .zip
│   ├── elena-garcia/ & .zip
│   └── marcos-sanchez/ & .zip
├── scripts/
│   └── bundle_templates.js      ← Script para empaquetar templates y assets
└── cli/
    └── generate.js              ← Script CLI automatizado con WASM y ZIP
```
