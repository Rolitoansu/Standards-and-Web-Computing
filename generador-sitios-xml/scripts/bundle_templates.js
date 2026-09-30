const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatesDir = path.join(rootDir, 'templates');
const cssFiles = ['base.css', 'layout.css', 'index.css', 'about.css', 'projects.css', 'cv.css', 'contact.css'];
const jsFiles = ['nav.js', 'projects.js'];

const staticAssets = {};
for (const f of cssFiles) {
  staticAssets['assets/css/' + f] = fs.readFileSync(path.join(templatesDir, f), 'utf-8');
}
for (const f of jsFiles) {
  staticAssets['assets/js/' + f] = fs.readFileSync(path.join(templatesDir, f), 'utf-8');
}

const jsContent = `/**
 * templates_bundle.js — Plantillas estáticas de CSS y JS de Trabajo II
 * Permite empaquetar el CSS y JS directamente en el archivo ZIP sin depender de llamadas de red.
 */
const TEMPLATES_BUNDLE = ${JSON.stringify(staticAssets, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATES_BUNDLE;
}
`;

fs.writeFileSync(path.join(rootDir, 'assets/js/templates_bundle.js'), jsContent, 'utf-8');
console.log('assets/js/templates_bundle.js generated successfully!');
