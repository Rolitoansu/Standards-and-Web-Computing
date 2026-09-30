const fs = require('fs');
const path = require('path');

const srcDir = '/var/www/html/generador-sitios-xml';
const dstDir = '/var/www/html/generador-sitios-web';

// Crear directorios destino
const dirsToCreate = [
  dstDir,
  path.join(dstDir, 'assets/css'),
  path.join(dstDir, 'assets/js'),
  path.join(dstDir, 'assets/wasm'),
  path.join(dstDir, 'assets/img/logos'),
  path.join(dstDir, 'ejemplos-xml'),
  path.join(dstDir, 'schema')
];

for (const d of dirsToCreate) {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

// 1. Copiar index.html adaptado (sin templates_bundle.js)
let indexHtml = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
indexHtml = indexHtml.replace(/\s*<script src="assets\/js\/templates_bundle\.js" defer><\/script>/g, '');
fs.writeFileSync(path.join(dstDir, 'index.html'), indexHtml, 'utf8');

// 2. Copiar assets/css
fs.copyFileSync(path.join(srcDir, 'assets/css/app.css'), path.join(dstDir, 'assets/css/app.css'));

const templateCssFiles = ['base.css', 'layout.css', 'index.css', 'about.css', 'projects.css', 'cv.css', 'contact.css'];
for (const f of templateCssFiles) {
  fs.copyFileSync(path.join(srcDir, 'templates', f), path.join(dstDir, 'assets/css', f));
}

// 3. Copiar assets/js (JSZip y wasm_runner)
fs.copyFileSync(path.join(srcDir, 'assets/js/jszip.min.js'), path.join(dstDir, 'assets/js/jszip.min.js'));
fs.copyFileSync(path.join(srcDir, 'assets/js/wasm_runner.js'), path.join(dstDir, 'assets/js/wasm_runner.js'));
fs.copyFileSync(path.join(srcDir, 'templates/nav.js'), path.join(dstDir, 'assets/js/nav.js'));
fs.copyFileSync(path.join(srcDir, 'templates/projects.js'), path.join(dstDir, 'assets/js/projects.js'));

// 4. Copiar assets/wasm
fs.copyFileSync(path.join(srcDir, 'assets/wasm/xml_metrics.wasm'), path.join(dstDir, 'assets/wasm/xml_metrics.wasm'));
fs.copyFileSync(path.join(srcDir, 'assets/wasm/xml_metrics.wat'), path.join(dstDir, 'assets/wasm/xml_metrics.wat'));

// 5. Copiar assets/img (solo SVGs, excluyendo fotos pesadas o prescindibles)
const avatarFiles = ['avatar-desarrollador.svg', 'avatar-disenador.svg', 'avatar-generico.svg'];
for (const f of avatarFiles) {
  const p = path.join(srcDir, 'assets/img', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dstDir, 'assets/img', f));
}

const logosSrc = path.join(srcDir, 'assets/img/logos');
const logosDst = path.join(dstDir, 'assets/img/logos');
if (fs.existsSync(logosSrc)) {
  for (const l of fs.readdirSync(logosSrc)) {
    if (l.endsWith('.svg')) {
      fs.copyFileSync(path.join(logosSrc, l), path.join(logosDst, l));
    }
  }
}

// 6. Copiar ejemplos-xml
const ejemplos = fs.readdirSync(path.join(srcDir, 'ejemplos-xml'));
for (const e of ejemplos) {
  if (e.endsWith('.xml')) {
    fs.copyFileSync(path.join(srcDir, 'ejemplos-xml', e), path.join(dstDir, 'ejemplos-xml', e));
  }
}

// 7. Copiar schema
fs.copyFileSync(path.join(srcDir, 'schema/sitio-personal.xsd'), path.join(dstDir, 'schema/sitio-personal.xsd'));
if (fs.existsSync(path.join(srcDir, 'schema/ESPECIFICACION_XML.md'))) {
  fs.copyFileSync(path.join(srcDir, 'schema/ESPECIFICACION_XML.md'), path.join(dstDir, 'schema/ESPECIFICACION_XML.md'));
}

console.log('✅ Archivos esenciales copiados a', dstDir);
