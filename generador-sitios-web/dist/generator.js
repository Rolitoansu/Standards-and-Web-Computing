/**
 * generator.ts — Motor de generación de HTML5 y CSS en TypeScript
 * Transforma el modelo SitioPersonalModel en los 5 archivos HTML, CSS y scripts del sitio estático.
 */
export class PersonalSiteHTMLGenerator {
    /**
     * Escapa caracteres especiales de HTML
     */
    static escapeHtml(str) {
        if (!str)
            return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    /**
     * Genera el bloque <head> común
     */
    static generarHead(sitio, tituloPagina, cssPagina) {
        const autor = sitio.metadatos.autor;
        return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${this.escapeHtml(autor.descripcion)}">
  <meta name="keywords" content="${this.escapeHtml(autor.palabrasClave)}">
  <meta name="author" content="${this.escapeHtml(autor.nombreCompleto)}">
  <meta property="og:title" content="${this.escapeHtml(tituloPagina)} — ${this.escapeHtml(autor.nombreCompleto)}">
  <meta property="og:description" content="${this.escapeHtml(autor.descripcion)}">
  <meta property="og:type" content="website">
  <title>${this.escapeHtml(tituloPagina)} — ${this.escapeHtml(autor.nombreCompleto)}</title>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/layout.css">
  <link rel="stylesheet" href="assets/css/${cssPagina}">
  <script src="assets/js/nav.js" defer></script>`;
    }
    /**
     * Genera la cabecera y barra de navegación
     */
    static generarHeaderNav(sitio, paginaActiva) {
        const paginas = [
            { id: 'index', url: 'index.html', texto: 'Inicio' },
            { id: 'about', url: 'about.html', texto: 'Sobre mí' },
            { id: 'projects', url: 'projects.html', texto: 'Proyectos' },
            { id: 'cv', url: 'cv.html', texto: 'Currículum' },
            { id: 'contact', url: 'contact.html', texto: 'Contacto' }
        ];
        const enlacesNav = paginas.map(p => {
            const isCurrent = p.id === paginaActiva ? ' aria-current="page"' : '';
            return `        <li><a href="${p.url}"${isCurrent}>${p.texto}</a></li>`;
        }).join('\n');
        return `  <header>
    <nav aria-label="Navegación principal">
      <a href="index.html" aria-label="${this.escapeHtml(sitio.metadatos.autor.nombreCompleto)} — Inicio">Mi página personal</a>
      <button type="button" aria-expanded="false" aria-label="Abrir menú">
        &#9776;
      </button>
      <ul data-abierto="false">
${enlacesNav}
      </ul>
    </nav>
  </header>`;
    }
    /**
     * Genera el pie de página
     */
    static generarFooter(sitio) {
        const autor = sitio.metadatos.autor;
        const anio = new Date().getFullYear();
        return `  <footer>
    <p>&copy; ${anio} ${this.escapeHtml(autor.nombreCompleto)} — Sitio web generado automáticamente desde XML (PersonalSiteML).</p>
  </footer>`;
    }
    /**
     * Genera index.html (Página de Inicio)
     */
    static generarIndexHTML(sitio) {
        const inicio = sitio.paginas.inicio;
        const autor = sitio.metadatos.autor;
        // Acciones del Hero
        const accionesHtml = inicio.hero.acciones.map(a => {
            return `            <a href="${this.escapeHtml(a.href)}">${this.escapeHtml(a.texto)}</a>`;
        }).join('\n');
        // Métricas rápidas
        const metricasHtml = inicio.datosRapidos.map(m => {
            return `          <li><strong>${this.escapeHtml(m.valor)}</strong><span>${this.escapeHtml(m.etiqueta)}</span></li>`;
        }).join('\n');
        // Tecnologías destacadas
        const tecHtml = inicio.tecnologiasDestacadas.items.map(t => {
            const imgTag = t.iconoSrc ? `<img src="${this.escapeHtml(t.iconoSrc)}" alt="" aria-hidden="true" width="32" height="32">` : '';
            return `          <li>
            ${imgTag}
            <div><span>${this.escapeHtml(t.nombre)}</span><span>${this.escapeHtml(t.nivel)}</span></div>
          </li>`;
        }).join('\n');
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Inicio', 'index.css')}
</head>
<body>
${this.generarHeaderNav(sitio, 'index')}

  <main>
    <section aria-label="Presentación">
      <div>
        <div>
          <p>${this.escapeHtml(inicio.hero.subtitulo)}</p>
          <h1>${this.escapeHtml(inicio.hero.saludo)}<br><span>${this.escapeHtml(autor.nombreCompleto)}</span></h1>
          <p>
            ${this.escapeHtml(inicio.hero.resumen)}
          </p>
          <div>
${accionesHtml}
          </div>
        </div>
        <div>
          <img
            src="${this.escapeHtml(autor.foto.src)}"
            alt="${this.escapeHtml(autor.foto.alt)}"
            width="${autor.foto.ancho || 208}"
            height="${autor.foto.alto || 208}"
          >
        </div>
      </div>
    </section>

    <section aria-label="Datos rápidos">
      <div>
        <ul>
${metricasHtml}
        </ul>
      </div>
    </section>

    <section aria-label="Tecnologías">
      <div>
        <h2>${this.escapeHtml(inicio.tecnologiasDestacadas.titulo)}</h2>
        <hr>
        <p>${this.escapeHtml(inicio.tecnologiasDestacadas.descripcion)}</p>
        <ul>
${tecHtml}
        </ul>
      </div>
    </section>
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
    /**
     * Genera about.html (Página Sobre mí)
     */
    static generarAboutHTML(sitio) {
        const sobreMi = sitio.paginas.sobreMi;
        const autor = sitio.metadatos.autor;
        // Párrafos de trayectoria
        const parrafosHtml = sobreMi.trayectoria.parrafos.map(p => {
            return `          <p>${this.escapeHtml(p)}</p>`;
        }).join('\n');
        // Tabla de datos personales
        const filasTablaHtml = sobreMi.datosPersonales.datos.map(d => {
            const valHtml = d.enlace
                ? `<a href="${this.escapeHtml(d.enlace)}">${this.escapeHtml(d.valor)}</a>`
                : this.escapeHtml(d.valor);
            return `              <tr>
                <th scope="row">${this.escapeHtml(d.etiqueta)}</th>
                <td>${valHtml}</td>
              </tr>`;
        }).join('\n');
        // Intereses y aficiones
        const interesesHtml = sobreMi.intereses.items.map(it => {
            return `          <article>
            <div>
              <h3>${this.escapeHtml(it.titulo)}</h3>
              <p>${this.escapeHtml(it.descripcion)}</p>
            </div>
          </article>`;
        }).join('\n');
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Sobre mí', 'about.css')}
</head>
<body>
${this.generarHeaderNav(sitio, 'about')}

  <main>
    <section aria-label="Sobre mí">
      <div>
        <img src="${this.escapeHtml(autor.foto.src)}" alt="${this.escapeHtml(autor.foto.alt)}" width="128" height="128">
        <div>
          <h1>${this.escapeHtml(sobreMi.cabecera.titulo)}</h1>
          <p>${this.escapeHtml(sobreMi.cabecera.subtitulo)}</p>
        </div>
      </div>
    </section>

    <section aria-label="Trayectoria e intereses">
      <div>
        <h2>${this.escapeHtml(sobreMi.trayectoria.titulo)}</h2>
        <hr>

        <div>
          <table aria-label="Datos personales de ${this.escapeHtml(autor.nombreCompleto)}">
            <caption>${this.escapeHtml(sobreMi.datosPersonales.tituloTabla)}</caption>
            <tbody>
${filasTablaHtml}
            </tbody>
          </table>

          <div>
${parrafosHtml}
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Intereses y Aficiones">
      <div>
        <h2>${this.escapeHtml(sobreMi.intereses.titulo)}</h2>
        <hr>
        <div>
${interesesHtml}
        </div>
      </div>
    </section>
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
    /**
     * Genera projects.html (Página de Proyectos)
     */
    static generarProjectsHTML(sitio) {
        const proy = sitio.paginas.proyectos;
        // Botones de filtro
        const botonesFiltroHtml = proy.categoriasFiltro.map((c, idx) => {
            const isPressed = idx === 0 ? 'true' : 'false';
            return `          <button aria-pressed="${isPressed}" data-filter="${this.escapeHtml(c.id)}">${this.escapeHtml(c.etiqueta)}</button>`;
        }).join('\n');
        // Lista de artículos de proyectos
        const articulosHtml = proy.proyectos.map(p => {
            const badgeDestacado = p.destacado && p.etiquetaDestacada
                ? `                <em>${this.escapeHtml(p.etiquetaDestacada)}</em>\n`
                : '';
            const tagsHtml = p.tecnologias.map(t => {
                return `                  <li>${this.escapeHtml(t)}</li>`;
            }).join('\n');
            const enlacesHtml = p.enlaces.map(e => {
                return `                  <a href="${this.escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(e.texto)}</a>`;
            }).join('\n');
            return `          <li>
            <article data-category="${this.escapeHtml(p.categoria)}" aria-label="${this.escapeHtml(p.titulo)}">
              <div>
${badgeDestacado}                <h3>${this.escapeHtml(p.titulo)}</h3>
                <span data-estado="${this.escapeHtml(p.estado)}">${this.escapeHtml(p.estado)}</span>
                <p>
                  ${this.escapeHtml(p.descripcion)}
                </p>
                <ul>
${tagsHtml}
                </ul>
                <div>
${enlacesHtml}
                </div>
              </div>
            </article>
          </li>`;
        }).join('\n');
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Proyectos', 'projects.css')}
  <script src="assets/js/projects.js" defer></script>
</head>
<body>
${this.generarHeaderNav(sitio, 'projects')}

  <main>
    <section aria-label="Cabecera de proyectos">
      <div>
        <h1>${this.escapeHtml(proy.cabecera.titulo)}</h1>
        <p>${this.escapeHtml(proy.cabecera.subtitulo)}</p>
      </div>
    </section>

    <section aria-label="Catálogo de proyectos">
      <div>
        <h2>Lista de proyectos</h2>

        <div role="group" aria-label="Filtrar proyectos por categoría">
${botonesFiltroHtml}
        </div>

        <ul>
${articulosHtml}
        </ul>
      </div>
    </section>
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
    /**
     * Genera cv.html (Página de Currículum)
     */
    static generarCvHTML(sitio) {
        const cv = sitio.paginas.curriculum;
        const autor = sitio.metadatos.autor;
        const cInfo = sitio.metadatos.contactoInfo;
        // Botón descargar PDF
        const botonPdfHtml = cv.cabecera.descargaPdf
            ? `        <a href="${this.escapeHtml(cv.cabecera.descargaPdf.url)}" download aria-label="${this.escapeHtml(cv.cabecera.descargaPdf.texto)}">
          ${this.escapeHtml(cv.cabecera.descargaPdf.texto)}
        </a>`
            : '';
        // Experiencia laboral
        const experienciaHtml = cv.experienciaLaboral.map(p => {
            const logrosHtml = p.logros && p.logros.length > 0
                ? `              <ul>\n${p.logros.map(l => `                <li>${this.escapeHtml(l)}</li>`).join('\n')}\n              </ul>`
                : '';
            const tagsHtml = p.tecnologias && p.tecnologias.length > 0
                ? `              <div>\n${p.tecnologias.map(t => `                <span>${this.escapeHtml(t)}</span>`).join('\n')}\n              </div>`
                : '';
            return `            <article>
              <header>
                <h3>${this.escapeHtml(p.cargo)}</h3>
                <p>${this.escapeHtml(p.empresa)} · <time>${this.escapeHtml(p.periodo.inicio)} — ${this.escapeHtml(p.periodo.fin)}</time></p>
              </header>
              <p>${this.escapeHtml(p.descripcion)}</p>
${logrosHtml}
${tagsHtml}
            </article>`;
        }).join('\n');
        // Formación académica
        const formacionHtml = cv.formacionAcademica.map(f => {
            const descHtml = f.descripcion ? `              <p>${this.escapeHtml(f.descripcion)}</p>` : '';
            return `            <article>
              <header>
                <h3>${this.escapeHtml(f.titulo)}</h3>
                <p>${this.escapeHtml(f.institucion)} · <time>${this.escapeHtml(f.periodo.inicio)} — ${this.escapeHtml(f.periodo.fin)}</time></p>
              </header>
${descHtml}
            </article>`;
        }).join('\n');
        // Competencias en aside
        const competenciasAsideHtml = cv.competencias.map(g => {
            const itemsHtml = g.items.map(it => {
                const barraHtml = it.nivel !== undefined
                    ? `                  <div role="progressbar" aria-valuenow="${it.nivel}" aria-valuemin="0" aria-valuemax="100" aria-label="${this.escapeHtml(it.nombre)}: ${it.nivel}%">
                    <div style="width: ${it.nivel}%;"></div>
                  </div>`
                    : '';
                return `                <li>
                  <span>${this.escapeHtml(it.nombre)}</span>
                  ${barraHtml}
                </li>`;
            }).join('\n');
            return `          <div>
            <h3>${this.escapeHtml(g.nombre)}</h3>
            <ul>
${itemsHtml}
            </ul>
          </div>`;
        }).join('\n');
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Currículum', 'cv.css')}
</head>
<body>
${this.generarHeaderNav(sitio, 'cv')}

  <main>
    <section aria-label="Cabecera del currículum">
      <div>
        <div>
          <h1>${this.escapeHtml(cv.cabecera.titulo)}</h1>
          <p>${this.escapeHtml(cv.cabecera.subtitulo)}</p>
        </div>
${botonPdfHtml}
      </div>
    </section>

    <section aria-label="Contenido del currículum">
      <div>
        <aside aria-label="Información de contacto y competencias">
          <div>
            <img src="${this.escapeHtml(autor.foto.src)}" alt="${this.escapeHtml(autor.foto.alt)}" width="110" height="110">
            <p>${this.escapeHtml(autor.nombreCompleto)}</p>
            <p>${this.escapeHtml(autor.titular)}</p>
          </div>

          <div>
            <h2>Contacto</h2>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:${this.escapeHtml(cInfo.email)}">${this.escapeHtml(cInfo.email)}</a></li>
              <li><strong>Ubicación:</strong> ${this.escapeHtml(cInfo.ubicacion)}</li>
            </ul>
          </div>

${competenciasAsideHtml}
        </aside>

        <div>
          <section aria-label="Experiencia laboral">
            <h2>Experiencia laboral</h2>
            <hr>
            <div>
${experienciaHtml}
            </div>
          </section>

          <section aria-label="Educación y formación">
            <h2>Educación y formación</h2>
            <hr>
            <div>
${formacionHtml}
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
    /**
     * Genera contact.html (Página de Contacto)
     */
    static generarContactHTML(sitio) {
        const cont = sitio.paginas.contacto;
        // Canales de contacto
        const canalesHtml = cont.canales.map(c => {
            const isExternal = c.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `          <a href="${this.escapeHtml(c.href)}"${isExternal} aria-label="${this.escapeHtml(c.etiqueta)}: ${this.escapeHtml(c.valor)}">
            <div>
              <span>${this.escapeHtml(c.etiqueta)}</span>
              <span>${this.escapeHtml(c.valor)}</span>
            </div>
          </a>`;
        }).join('\n');
        // Disponibilidad
        const disponibilidadHtml = cont.disponibilidad ? `    <section aria-label="Disponibilidad">
      <div>
        <h2>Disponibilidad</h2>
        <hr>
        <p><strong>${this.escapeHtml(cont.disponibilidad.estado)}</strong></p>
        <p>${this.escapeHtml(cont.disponibilidad.descripcion)}</p>
      </div>
    </section>` : '';
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Contacto', 'contact.css')}
</head>
<body>
${this.generarHeaderNav(sitio, 'contact')}

  <main>
    <section aria-label="Cabecera de contacto">
      <div>
        <h1>${this.escapeHtml(cont.cabecera.titulo)}</h1>
        <p>${this.escapeHtml(cont.cabecera.subtitulo)}</p>
      </div>
    </section>

    <section aria-label="Formas de contactarme">
      <div>
        <h2>Formas de contactarme</h2>
        <hr>
        <address>
${canalesHtml}
        </address>
      </div>
    </section>

${disponibilidadHtml}
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
}
