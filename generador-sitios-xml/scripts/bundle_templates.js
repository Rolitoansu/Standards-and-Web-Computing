const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatesDir = path.join(rootDir, 'templates');
const imgDir = path.join(rootDir, 'assets/img');
const logosDir = path.join(rootDir, 'assets/img/logos');

const cssFiles = ['base.css', 'layout.css', 'index.css', 'about.css', 'projects.css', 'cv.css', 'contact.css'];
const jsFiles = ['nav.js', 'projects.js'];
const genericImgFiles = [
  'avatar-generico.svg',
  'avatar-desarrollador.svg',
  'avatar-disenador.svg',
  'proyecto-generico.svg',
  'interes-generico.svg'
];

const staticAssets = {};

// Empaquetar CSS
for (const f of cssFiles) {
  const p = path.join(templatesDir, f);
  if (fs.existsSync(p)) {
    staticAssets['assets/css/' + f] = fs.readFileSync(p, 'utf-8');
  }
}

// Empaquetar JS
for (const f of jsFiles) {
  const p = path.join(templatesDir, f);
  if (fs.existsSync(p)) {
    staticAssets['assets/js/' + f] = fs.readFileSync(p, 'utf-8');
  }
}

// Empaquetar imágenes vectoriales genéricas
for (const f of genericImgFiles) {
  const p = path.join(imgDir, f);
  if (fs.existsSync(p)) {
    staticAssets['assets/img/' + f] = fs.readFileSync(p, 'utf-8');
  }
}

// Empaquetar logos SVG
if (fs.existsSync(logosDir)) {
  const logos = fs.readdirSync(logosDir);
  for (const l of logos) {
    if (l.endsWith('.svg')) {
      staticAssets['assets/img/logos/' + l] = fs.readFileSync(path.join(logosDir, l), 'utf-8');
    }
  }
}

const jsContent = `/**
 * templates_bundle.js — Plantillas estáticas de CSS, JS e Imágenes Genéricas de Trabajo II
 * Permite empaquetar el CSS, JS y recursos vectoriales directamente en el archivo ZIP sin llamadas externas.
 */
const TEMPLATES_BUNDLE = ${JSON.stringify(staticAssets, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATES_BUNDLE;
}
`;

fs.writeFileSync(path.join(rootDir, 'assets/js/templates_bundle.js'), jsContent, 'utf-8');
console.log('✅ assets/js/templates_bundle.js generado con éxito!');
console.log(`   Total de recursos integrados: ${Object.keys(staticAssets).length} archivos`);
