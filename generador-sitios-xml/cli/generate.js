#!/usr/bin/env node
/**
 * generate.js — Generador CLI semántico W3C para PersonalSiteML
 * Genera sitios web personales completos con HTML5 semántico (sin divs innecesarios).
 */

const fs = require('fs');
const path = require('path');
const PersonalSiteGenerator = require('../assets/js/generator.js');
const JSZip = require('../assets/js/jszip.min.js');

function generarSitioCompletoFs(xmlFilePath, outputDir, templatesDir, assetsSourceDir) {
  const nombreXml = path.basename(xmlFilePath);
  console.log(`\nProcesando ${nombreXml} -> ${outputDir}`);
  const t0 = Date.now();

  const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
  const res = PersonalSiteGenerator.generarSitioDesdeXml(xmlContent);

  // Crear directorios
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/css'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/js'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets/img/logos'), { recursive: true });

  // Guardar los 5 archivos HTML generados
  for (const [nombreHtml, contenido] of Object.entries(res.paginas)) {
    fs.writeFileSync(path.join(outputDir, nombreHtml), contenido, 'utf-8');
  }

  // Copiar plantillas CSS estáticas existentes (idénticas para todos)
  const cssFiles = ['base.css', 'layout.css', 'index.css', 'about.css', 'projects.css', 'cv.css', 'contact.css'];
  for (const c of cssFiles) {
    const src = path.join(templatesDir, c);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outputDir, 'assets/css', c));
    }
  }

  // Copiar scripts JS existentes
  const jsFiles = ['nav.js', 'projects.js'];
  for (const j of jsFiles) {
    const src = path.join(templatesDir, j);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outputDir, 'assets/js', j));
    }
  }

  // Copiar imágenes reutilizando si ya existen
  if (fs.existsSync(assetsSourceDir)) {
    function copiarDirectorio(origen, destino) {
      if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
      const items = fs.readdirSync(origen, { withFileTypes: true });
      for (const item of items) {
        const srcItem = path.join(origen, item.name);
        const destItem = path.join(destino, item.name);
        if (item.isDirectory()) {
          copiarDirectorio(srcItem, destItem);
        } else {
          if (!fs.existsSync(destItem)) {
            fs.copyFileSync(srcItem, destItem);
          }
        }
      }
    }
    copiarDirectorio(assetsSourceDir, path.join(outputDir, 'assets/img'));
  }

  // Generar paquete ZIP autónomo completo con JSZip
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

  zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    .then(buffer => {
      fs.writeFileSync(outputDir + '.zip', buffer);
    });

  const t1 = Date.now();
  console.log(`[OK] Generado en ${t1 - t0} ms -> ${outputDir}.zip`);
}

function main() {
  const args = process.argv.slice(2);
  const baseDir = path.resolve(__dirname, '..');
  const templatesDir = path.join(baseDir, 'templates');
  const assetsDir = path.join(baseDir, 'assets/img');

  if (args.includes('--all') || args.length === 0) {
    const sitios = [
      { xml: 'ejemplos-xml/raul-antuna.xml', out: 'sitios-generados/raul-antuna' },
      { xml: 'ejemplos-xml/elena-garcia.xml', out: 'sitios-generados/elena-garcia' },
      { xml: 'ejemplos-xml/marcos-sanchez.xml', out: 'sitios-generados/marcos-sanchez' }
    ];

    for (const s of sitios) {
      const xmlPath = path.join(baseDir, s.xml);
      const outPath = path.join(baseDir, s.out);
      generarSitioCompletoFs(xmlPath, outPath, templatesDir, assetsDir);
    }
    console.log(`\nSitios generados correctamente con HTML5 semántico W3C.`);
  } else {
    let inputXml = null;
    let outputDir = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--input' && args[i + 1]) {
        inputXml = path.resolve(args[i + 1]);
        i++;
      } else if (args[i] === '--output' && args[i + 1]) {
        outputDir = path.resolve(args[i + 1]);
        i++;
      }
    }
    if (!inputXml || !outputDir) {
      console.error('Uso: node cli/generate.js --input <archivo.xml> --output <directorio>');
      console.error('      node cli/generate.js --all');
      process.exit(1);
    }
    generarSitioCompletoFs(inputXml, outputDir, templatesDir, assetsDir);
  }
}

if (require.main === module) {
  main();
}
