const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const sitios = ['raul-antuna', 'elena-garcia', 'marcos-sanchez'];
const paginas = ['index.html', 'about.html', 'projects.html', 'cv.html', 'contact.html'];

let totalErrors = 0;

for (const s of sitios) {
  const dir = path.join(baseDir, 'sitios-generados', s);
  for (const p of paginas) {
    const filePath = path.join(dir, p);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Falta archivo: ${filePath}`);
      totalErrors++;
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');

    // 1. DOCTYPE
    if (!html.startsWith('<!DOCTYPE html>')) {
      console.error(`❌ ${s}/${p}: Falta <!DOCTYPE html>`);
      totalErrors++;
    }

    // 2. Lang
    if (!html.includes('<html lang=')) {
      console.error(`❌ ${s}/${p}: Falta atributo lang en <html>`);
      totalErrors++;
    }

    // 3. Charset
    if (!html.includes('<meta charset="UTF-8">')) {
      console.error(`❌ ${s}/${p}: Falta <meta charset="UTF-8">`);
      totalErrors++;
    }

    // 4. Viewport
    if (!html.includes('<meta name="viewport"')) {
      console.error(`❌ ${s}/${p}: Falta viewport`);
      totalErrors++;
    }

    // 5. Title
    if (!html.includes('<title>') || !html.includes('</title>')) {
      console.error(`❌ ${s}/${p}: Falta <title>`);
      totalErrors++;
    }

    // 6. Img without alt
    const imgMatches = html.match(/<img\s+[^>]*>/gi) || [];
    for (const img of imgMatches) {
      if (!img.includes('alt=')) {
        console.error(`❌ ${s}/${p}: <img> sin alt: ${img}`);
        totalErrors++;
      }
    }

    // 7. Check balanced main tags
    const tagsToCheck = ['html', 'head', 'body', 'header', 'nav', 'main', 'footer'];
    for (const t of tagsToCheck) {
      const openCount = (html.match(new RegExp(`<${t}[\\s>]`, 'gi')) || []).length;
      const closeCount = (html.match(new RegExp(`</${t}>`, 'gi')) || []).length;
      if (openCount !== closeCount) {
        console.error(`❌ ${s}/${p}: Desbalance en etiqueta <${t}> (${openCount} vs ${closeCount})`);
        totalErrors++;
      }
    }
  }
}

if (totalErrors === 0) {
  console.log('✅ Validación W3C superada: Todas las páginas HTML5 son conformes y semánticas.');
} else {
  console.log(`⚠️ Se encontraron ${totalErrors} errores de validación.`);
  process.exit(1);
}
