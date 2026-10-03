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

  function obtenerSalida(formulario) {
    let salida = document.querySelector('output');
    if (!salida) {
      salida = document.createElement('output');
      salida.setAttribute('aria-live', 'polite');
      formulario.insertAdjacentElement('afterend', salida);
    }
    return salida;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.querySelector('form');
    const inputFichero = document.getElementById('fichero-xml') || document.querySelector('input[type="file"]');

    if (!formulario) return;

    // Precargar módulo WebAssembly en segundo plano sin bloquear el hilo ni los eventos
    if (typeof WasmMetricsRunner !== 'undefined') {
      WasmMetricsRunner.cargarModulo().catch(err => {
        console.warn('Precarga WASM en segundo plano:', err);
      });
    }

    formulario.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      evento.stopPropagation();
      const salida = obtenerSalida(formulario);

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
        salida.innerHTML = '<p>Error al leer el archivo XML desde el dispositivo.</p>';
        return;
      }

      try {
        salida.innerHTML = '<p>Ejecutando análisis WebAssembly (WASM) y generando sitio web...</p>';

        // 2. Ejecutar análisis de métricas con el módulo nativo WebAssembly (WASM)
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

        // 5.2 Agregar recursos estáticos (CSS, JS, imágenes genéricas y logos) directamente mediante fetch
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
        }));

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
          const tamanoXmlKb = (metricasWasm.totalBytes / 1024).toFixed(2);
          const tiempoTexto = metricasWasm.tiempoMs > 0 ? `${metricasWasm.tiempoMs} ms` : '< 0.05 ms (instantáneo)';

          bloqueWasm = `
            <h3>Métricas de análisis WebAssembly (WASM)</h3>
            <p>El documento XML fue analizado directamente en memoria lineal mediante el módulo nativo compilado <code>xml_metrics.wasm</code>:</p>
            <dl>
              <dt>Motor de cómputo</dt>
              <dd><code>${metricasWasm.motor}</code></dd>
              <dt>Módulo binario</dt>
              <dd>xml_metrics.wasm (279 B compilado)</dd>
              <dt>Tamaño del documento</dt>
              <dd>${tamanoXmlKb} KB (${metricasWasm.totalBytes.toLocaleString('es-ES')} bytes)</dd>
              <dt>Delimitadores léxicos (&lt;)</dt>
              <dd>${metricasWasm.totalEtiquetas.toLocaleString('es-ES')} aperturas de etiqueta</dd>
              <dt>Integridad (Hash FNV-1a 32-bit)</dt>
              <dd><code>0x${metricasWasm.hashHex.toUpperCase()}</code></dd>
              <dt>Complejidad estructural</dt>
              <dd>${metricasWasm.puntuacionComplejidad.toLocaleString('es-ES')} pts</dd>
              <dt>Tiempo de cómputo</dt>
              <dd>${tiempoTexto}</dd>
            </dl>
          `;
        }

        salida.innerHTML = `
          <p><strong>¡Sitio web generado y empaquetado con éxito para ${autor}!</strong></p>
          <ul>
            <li>
              <a href="${urlZipDescarga}" download="${nombreZip}">
                Descargar paquete comprimido (${nombreZip} · ${tamanoKb} KB)
              </a>
            </li>
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
