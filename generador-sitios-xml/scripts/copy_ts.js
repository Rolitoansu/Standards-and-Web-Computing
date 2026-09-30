const fs = require('fs');
const path = require('path');

const srcDir = '/var/www/html/generador-sitios-xml';
const dstDir = '/var/www/html/generador-sitios-web';

// Crear src/ts y src/wasm
fs.mkdirSync(path.join(dstDir, 'src/ts'), { recursive: true });
fs.mkdirSync(path.join(dstDir, 'src/wasm'), { recursive: true });

// Copiar tsconfig.json
fs.copyFileSync(path.join(srcDir, 'tsconfig.json'), path.join(dstDir, 'tsconfig.json'));

// Copiar archivos TypeScript
const tsFiles = ['types.ts', 'parser.ts', 'validator.ts', 'generator.ts'];
for (const f of tsFiles) {
  const p = path.join(srcDir, 'src/ts', f);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(dstDir, 'src/ts', f));
    console.log('Copiado TS:', f);
  }
}

// Copiar xml_metrics.wat
fs.copyFileSync(path.join(srcDir, 'src/wasm/xml_metrics.wat'), path.join(dstDir, 'src/wasm/xml_metrics.wat'));
console.log('Copiado WAT: xml_metrics.wat');
