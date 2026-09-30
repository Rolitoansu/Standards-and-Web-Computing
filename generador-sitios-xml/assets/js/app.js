/**
 * app.js — Controlador del formulario accesible para la generación del paquete ZIP con WebAssembly y Fotos Genéricas
 */

(function () {
  'use strict';

  function descargarBlob(nombreArchivo, blob) {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1500);
  }

  function slugify(texto) {
    return String(texto || 'sitio-personal')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const formulario = document.querySelector('form');
    const inputFichero = document.querySelector('input[type="file"]');
    const salida = document.querySelector('output');

    if (!formulario || !salida) return;

    // Precargar módulo WebAssembly si está disponible
    if (typeof WasmMetricsRunner !== 'undefined') {
      try {
        await WasmMetricsRunner.cargarModulo();
      } catch (err) {
        console.warn('Inicialización WASM en segundo plano:', err);
      }
    }

    formulario.addEventListener('submit', async function (evento) {
      evento.preventDefault();

      if (!inputFichero || !inputFichero.files || inputFichero.files.length === 0) {
        salida.innerHTML = '<p>Por favor, selecciona y sube un archivo XML antes de continuar.</p>';
        return;
      }

      let contenidoXml = '';
      const archivo = inputFichero.files[0];
      const nombreArchivoOrigen = archivo.name;

      try {
        salida.innerHTML = '<p>Leyendo archivo XML del dispositivo...</p>';
        contenidoXml = await archivo.text();
      } catch (err) {
        salida.innerHTML = '<p>Error al leer el archivo desde el dispositivo.</p>';
        return;
      }

      try {
        salida.innerHTML = '<p>Ejecutando análisis WebAssembly (WASM) y generando sitio web...</p>';

        // 2. Ejecutar análisis de métricas en WebAssembly (WASM)
        let metricasWasm = null;
        if (typeof WasmMetricsRunner !== 'undefined') {
          await WasmMetricsRunner.cargarModulo();
          metricasWasm = WasmMetricsRunner.analizar(contenidoXml);
        }

        // 3. Generación HTML con el motor semántico (el avatar se define directamente en el XML)
        const resultado = PersonalSiteGenerator.generarSitioDesdeXml(contenidoXml);
        const paginas = resultado.paginas;
        const autor = resultado.datos.autor.nombreCompleto || 'Personal';
        const slug = slugify(autor);

        // 5. Inicializar JSZip y empaquetar
        const zip = new JSZip();

        // 5.1 Agregar las 5 páginas HTML generadas a la raíz del ZIP
        for (const [nombreHtml, contenidoHtml] of Object.entries(paginas)) {
          zip.file(nombreHtml, contenidoHtml);
        }

        // 5.2 Agregar recursos estáticos (CSS, JS, imágenes genéricas y logos)
        if (typeof TEMPLATES_BUNDLE !== 'undefined') {
          for (const [rutaArchivo, contenido] of Object.entries(TEMPLATES_BUNDLE)) {
            zip.file(rutaArchivo, contenido);
          }
        }

        // 6. Generar archivo binario ZIP comprimido
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        const nombreZip = `sitio-${slug}.zip`;

        // 7. Descargar automáticamente el ZIP
        descargarBlob(nombreZip, zipBlob);

        // 8. Presentar resultado accesible y métricas WASM en el elemento <output>
        const urlZipDescarga = URL.createObjectURL(zipBlob);
        const tamanoKb = (zipBlob.size / 1024).toFixed(1);

        let bloqueWasm = '';
        if (metricasWasm) {
          bloqueWasm = `
            <h3>Métricas WebAssembly (WASM)</h3>
            <dl>
              <div>
                <dt>Motor de cómputo</dt>
                <dd>${metricasWasm.motor}</dd>
              </div>
              <div>
                <dt>Checksum Hash FNV-1a</dt>
                <dd>0x${metricasWasm.hashHex.toUpperCase()}</dd>
              </div>
              <div>
                <dt>Tamaño XML</dt>
                <dd>${metricasWasm.totalBytes} bytes</dd>
              </div>
              <div>
                <dt>Etiquetas XML</dt>
                <dd>${metricasWasm.totalEtiquetas} nodos</dd>
              </div>
              <div>
                <dt>Complejidad</dt>
                <dd>${metricasWasm.puntuacionComplejidad}</dd>
              </div>
              <div>
                <dt>Tiempo de análisis</dt>
                <dd>${metricasWasm.tiempoMs} ms</dd>
              </div>
            </dl>
          `;
        }

        salida.innerHTML = `
          <p><strong>¡Sitio web generado y empaquetado con éxito para ${autor}!</strong></p>
          <p>El paquete <code>${nombreZip}</code> (${tamanoKb} KB) se ha descargado automáticamente e incluye las 5 páginas W3C, estilos CSS, scripts accesibles y recursos vectoriales genéricos.</p>
          <ul>
            <li><a href="${urlZipDescarga}" download="${nombreZip}">Descargar nuevamente el paquete completo (${nombreZip})</a></li>
          </ul>
          ${bloqueWasm}
        `;
      } catch (error) {
        console.error(error);
        salida.innerHTML = `<p>Error al procesar el archivo XML: ${error.message}</p>`;
      }
    });
  });
})();
