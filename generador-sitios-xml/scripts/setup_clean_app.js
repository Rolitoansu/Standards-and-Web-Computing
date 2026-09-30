const fs = require('fs');
const path = require('path');

const srcDir = '/var/www/html/generador-sitios-xml';
const dstDir = '/var/www/html/generador-sitios-web';

// 1. Adaptar generator.js para generador-sitios-web
let generatorJs = fs.readFileSync(path.join(srcDir, 'assets/js/generator.js'), 'utf8');

// Reemplazar generarHead para usar etiquetas <link> y <script> en lugar de inline styles/bundle
const oldGenerarHead = `  function generarHead(datos, titulo, cssFile) {
    const autor = datos.autor;
    const cssMin = obtenerCssMinificado(cssFile);
    const navJs = obtenerJsMinificado('nav.js');
    const projectsJs = cssFile === 'projects.css' ? ('\\n' + obtenerJsMinificado('projects.js')) : '';

    return \`  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="\${escapeHtml(autor.descripcion)}">
  <meta name="keywords" content="\${escapeHtml(autor.palabrasClave)}">
  <meta name="author" content="\${escapeHtml(autor.nombreCompleto)}">
  <title>\${escapeHtml(titulo)} — \${escapeHtml(autor.nombreCompleto)}</title>
  <style>
\${cssMin}
  </style>
  <script>
\${navJs}\${projectsJs}
  </script>\`;
  }`;

const newGenerarHead = `  function generarHead(datos, titulo, cssFile) {
    const autor = datos.autor;

    return \`  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="\${escapeHtml(autor.descripcion)}">
  <meta name="keywords" content="\${escapeHtml(autor.palabrasClave)}">
  <meta name="author" content="\${escapeHtml(autor.nombreCompleto)}">
  <title>\${escapeHtml(titulo)} — \${escapeHtml(autor.nombreCompleto)}</title>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/layout.css">
  <link rel="stylesheet" href="assets/css/\${cssFile}">
  <script src="assets/js/nav.js" defer></script>\`;
  }`;

if (generatorJs.includes('const cssMin = obtenerCssMinificado(cssFile);')) {
  generatorJs = generatorJs.replace(oldGenerarHead, newGenerarHead);
}

// En generarProjects, añadir script projects.js en head si no está
generatorJs = generatorJs.replace(
  `\${generarHead(datos, 'Proyectos', 'projects.css')}\n</head>`,
  `\${generarHead(datos, 'Proyectos', 'projects.css')}\n  <script src="assets/js/projects.js" defer></script>\n</head>`
);

fs.writeFileSync(path.join(dstDir, 'assets/js/generator.js'), generatorJs, 'utf8');

// 2. Adaptar app.js para generador-sitios-web
let appJs = fs.readFileSync(path.join(srcDir, 'assets/js/app.js'), 'utf8');

const bundleBlock = `        // 5.2 Agregar recursos estáticos (CSS, JS, imágenes genéricas y logos)
        if (typeof TEMPLATES_BUNDLE !== 'undefined') {
          for (const [rutaArchivo, contenido] of Object.entries(TEMPLATES_BUNDLE)) {
            zip.file(rutaArchivo, contenido);
          }
        }`;

const fetchBlock = `        // 5.2 Agregar recursos estáticos (CSS, JS, imágenes genéricas y logos) directamente mediante fetch
        const recursosEstaticos = [
          'assets/css/base.css',
          'assets/css/layout.css',
          'assets/css/index.css',
          'assets/css/about.css',
          'assets/css/projects.css',
          'assets/css/cv.css',
          'assets/css/contact.css',
          'assets/js/nav.js',
          'assets/js/projects.js',
          'assets/img/avatar-desarrollador.svg',
          'assets/img/avatar-disenador.svg',
          'assets/img/avatar-generico.svg',
          'assets/img/logos/c.svg',
          'assets/img/logos/css3.svg',
          'assets/img/logos/docker.svg',
          'assets/img/logos/go.svg',
          'assets/img/logos/html5.svg',
          'assets/img/logos/java.svg',
          'assets/img/logos/javascript.svg',
          'assets/img/logos/postgresql.svg',
          'assets/img/logos/python.svg',
          'assets/img/logos/react.svg',
          'assets/img/logos/svelte.svg',
          'assets/img/logos/typescript.svg'
        ];

        await Promise.all(recursosEstaticos.map(async (ruta) => {
          try {
            const resp = await fetch(ruta);
            if (resp.ok) {
              const contenido = await resp.text();
              zip.file(ruta, contenido);
            }
          } catch (err) {
            console.warn('Recurso estático no empaquetado:', ruta, err);
          }
        }));`;

appJs = appJs.replace(bundleBlock, fetchBlock);
fs.writeFileSync(path.join(dstDir, 'assets/js/app.js'), appJs, 'utf8');

console.log('✅ generator.js y app.js configurados sin templates_bundle.js en', dstDir);
