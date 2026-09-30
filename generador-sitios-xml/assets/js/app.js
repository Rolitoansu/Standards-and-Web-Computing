/**
 * app.js — Controlador del formulario accesible para la generación del paquete ZIP con JSZip
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

  document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.querySelector('form');
    const inputFichero = document.querySelector('input[type="file"]');
    const salida = document.querySelector('output');

    if (!formulario || !inputFichero || !salida) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();

      if (!inputFichero.files || inputFichero.files.length === 0) {
        salida.innerHTML = '<p>Por favor, selecciona un archivo XML antes de continuar.</p>';
        return;
      }

      const archivo = inputFichero.files[0];
      const lector = new FileReader();

      lector.onload = async function (e) {
        try {
          salida.innerHTML = '<p>Procesando archivo XML y empaquetando sitio web...</p>';

          const contenidoXml = e.target.result;
          const resultado = PersonalSiteGenerator.generarSitioDesdeXml(contenidoXml);
          const paginas = resultado.paginas;
          const autor = resultado.datos.autor.nombreCompleto || 'Personal';
          const slug = slugify(autor);

          // Inicializar JSZip
          const zip = new JSZip();

          // 1. Agregar las 5 páginas HTML generadas a la raíz del ZIP
          for (const [nombreHtml, contenidoHtml] of Object.entries(paginas)) {
            zip.file(nombreHtml, contenidoHtml);
          }

          // 2. Agregar los recursos de estilo CSS y scripts JS
          if (typeof TEMPLATES_BUNDLE !== 'undefined') {
            for (const [rutaArchivo, contenido] of Object.entries(TEMPLATES_BUNDLE)) {
              zip.file(rutaArchivo, contenido);
            }
          }

          // 3. Generar archivo ZIP binario con JSZip
          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
          });

          const nombreZip = `sitio-${slug}.zip`;

          // 4. Descargar automáticamente el ZIP
          descargarBlob(nombreZip, zipBlob);

          // 5. Presentar resultado accesible en output
          const urlZipDescarga = URL.createObjectURL(zipBlob);
          salida.innerHTML = `
            <p><strong>¡Sitio web generado con éxito para ${autor}!</strong></p>
            <p>Se ha descargado el archivo ZIP con todas las páginas generadas:</p>
            <ul>
              <li><a href="${urlZipDescarga}" download="${nombreZip}">Descargar de nuevo el paquete completo (${nombreZip})</a></li>
            </ul>
            <p>Cada archivo HTML contiene todo su CSS y scripts minificados directamente en la etiqueta <code>&lt;head&gt;</code>, garantizando que cada página sea 100% autocontenida y funcional sin dependencias externas.</p>
          `;
        } catch (error) {
          console.error(error);
          salida.innerHTML = `<p>Error al procesar el archivo XML: ${error.message}</p>`;
        }
      };

      lector.onerror = function () {
        salida.innerHTML = '<p>Error al leer el archivo desde el dispositivo.</p>';
      };

      lector.readAsText(archivo);
    });
  });
})();
