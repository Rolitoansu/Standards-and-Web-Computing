#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PersonalSiteGenerator = require('../assets/js/generator.js');
const WasmMetricsRunner = require('../src/js/wasm_runner.js');
const JSZip = require('../assets/js/jszip.min.js');

async function generarSitioCompletoFs(xmlFilePath, outputDir, templatesDir, assetsSourceDir, opciones = {}) {
  const nombreXml = path.basename(xmlFilePath);
  console.log(`\nProcesando ${nombreXml} -> ${outputDir}`);
  const t0 = Date.now();

  const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');

  await WasmMetricsRunner.cargarModulo();
  const metricasWasm = WasmMetricsRunner.analizar(xmlContent);
  console.log(`[WASM] Motor: ${metricasWasm.motor} | Hash: 0x${metricasWasm.hashHex.toUpperCase()} | Nodos: ${metricasWasm.totalEtiquetas} | Complejidad: ${metricasWasm.puntuacionComplejidad} | Tiempo: ${metricasWasm.tiempoMs} ms`);

  const res = PersonalSiteGenerator.generarSitioDesdeXml(xmlContent, {
    avatarGenerico: opciones.avatarGenerico || 'avatar-generico.svg',
    usarFotosGenericas: opciones.usarFotosGenericas !== undefined ? opciones.usarFotosGenericas : true
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/css'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/img/logos'), { recursive: true });

  for (const [nombreHtml, contenido] of Object.entries(res.paginas)) {
    fs.writeFileSync(path.join(outputDir, nombreHtml), contenido, 'utf-8');
  }

  const cssFiles = ['base.css', 'layout.css', 'index.css', 'about.css', 'projects.css', 'cv.css', 'contact.css'];
  for (const c of cssFiles) {
    const src = path.join(templatesDir, c);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outputDir, 'assets/css', c));
    }
  }

  const jsFiles = ['nav.js', 'projects.js'];
  for (const j of jsFiles) {
    const src = path.join(templatesDir, j);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outputDir, 'assets/js', j));
    }
  }

  if (fs.existsSync(assetsSourceDir)) {
    function copiarDirectorio(origen, destino) {
      if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
      const items = fs.readdirSync(origen, { withFileTypes: true });
      for (const item of items) {
        if (!item.isDirectory() && !item.name.endsWith('.svg')) continue;
        const srcItem = path.join(origen, item.name);
        const destItem = path.join(destino, item.name);
        if (item.isDirectory()) {
          copiarDirectorio(srcItem, destItem);
        } else {
          fs.copyFileSync(srcItem, destItem);
        }
      }
    }
    copiarDirectorio(assetsSourceDir, path.join(outputDir, 'assets/img'));
  }

  const zip = new JSZip();
  for (const [nombreHtml, contenido] of Object.entries(res.paginas)) {
    zip.file(nombreHtml, contenido);
  }
  for (const c of cssFiles) {
    const src = path.join(templatesDir, c);
    if (fs.existsSync(src)) zip.file('assets/css/' + c, fs.readFileSync(src, 'utf-8'));
  }
  for (const j of jsFiles) {
    const src = path.join(templatesDir, j);
    if (fs.existsSync(src)) zip.file('assets/js/' + j, fs.readFileSync(src, 'utf-8'));
  }

  if (fs.existsSync(assetsSourceDir)) {
    function agregarDirectorioAZip(dir, prefijoZip) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (!item.isDirectory() && !item.name.endsWith('.svg')) continue;
        const fullPath = path.join(dir, item.name);
        const zipPath = prefijoZip + item.name;
        if (item.isDirectory()) {
          agregarDirectorioAZip(fullPath, zipPath + '/');
        } else {
          zip.file(zipPath, fs.readFileSync(fullPath));
        }
      }
    }
    agregarDirectorioAZip(assetsSourceDir, 'assets/img/');
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipPath = outputDir + '.zip';
  fs.writeFileSync(zipPath, zipBuffer);

  const t1 = Date.now();
  console.log(`[OK] Generado en ${t1 - t0} ms -> ${zipPath} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  const args = process.argv.slice(2);
  const baseDir = path.resolve(__dirname, '..');
  const templatesDir = path.join(baseDir, 'templates');
  const assetsDir = path.join(baseDir, 'assets/img');

  if (args.includes('--all') || args.length === 0) {
    const sitios = [
      { xml: 'ejemplos-xml/raul-antuna.xml', out: 'sitios-generados/raul-antuna', avatar: 'avatar-desarrollador.svg' },
      { xml: 'ejemplos-xml/elena-garcia.xml', out: 'sitios-generados/elena-garcia', avatar: 'avatar-generico.svg' },
      { xml: 'ejemplos-xml/marcos-sanchez.xml', out: 'sitios-generados/marcos-sanchez', avatar: 'avatar-disenador.svg' }
    ];

    for (const s of sitios) {
      const xmlPath = path.join(baseDir, s.xml);
      const outPath = path.join(baseDir, s.out);
      await generarSitioCompletoFs(xmlPath, outPath, templatesDir, assetsDir, { avatarGenerico: s.avatar });
    }
    console.log(`\nSitios y paquetes ZIP generados correctamente.`);
  } else {
    let inputXml = null;
    let outputDir = null;
    let avatar = 'avatar-generico.svg';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--input' && args[i + 1]) {
        inputXml = args[i + 1];
      }
      if (args[i] === '--output' && args[i + 1]) {
        outputDir = args[i + 1];
      }
      if (args[i] === '--avatar' && args[i + 1]) {
        avatar = args[i + 1];
      }
    }

    if (!inputXml || !outputDir) {
      console.error('Uso: node cli/generate.js --input <ruta-xml> --output <dir-salida> [--avatar <svg>]');
      process.exit(1);
    }

    const xmlPath = path.resolve(baseDir, inputXml);
    const outPath = path.resolve(baseDir, outputDir);
    await generarSitioCompletoFs(xmlPath, outPath, templatesDir, assetsDir, { avatarGenerico: avatar });
  }
}

main().catch(err => {
  console.error('Error durante la generación:', err);
  process.exit(1);
});
