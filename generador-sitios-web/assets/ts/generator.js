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
      <button id="nav-toggle" type="button" aria-expanded="false" aria-label="Abrir menú">
        &#9776;
      </button>
      <ul id="nav-menu" data-abierto="false">
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
            return `        <li>
          ${imgTag}
          <p><span>${this.escapeHtml(t.nombre)}</span><span>${this.escapeHtml(t.nivel)}</span></p>
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
      <article>
        <header>
          <p>${this.escapeHtml(inicio.hero.subtitulo)}</p>
          <h1>${this.escapeHtml(inicio.hero.saludo)}<br><span>${this.escapeHtml(autor.nombreCompleto)}</span></h1>
          <p>
            ${this.escapeHtml(inicio.hero.resumen)}
          </p>
          <nav aria-label="Acciones principales">
${accionesHtml}
          </nav>
        </header>
        <figure>
          <img
            src="${this.escapeHtml(autor.foto.src)}"
            alt="${this.escapeHtml(autor.foto.alt)}"
            width="${autor.foto.ancho || 208}"
            height="${autor.foto.alto || 208}"
          >
        </figure>
      </article>
    </section>

    <section aria-label="Datos rápidos">
      <article>
        <ul>
${metricasHtml}
        </ul>
      </article>
    </section>

    <section aria-label="Tecnologías">
      <header>
        <h2>${this.escapeHtml(inicio.tecnologiasDestacadas.titulo)}</h2>
        <hr>
        <p>${this.escapeHtml(inicio.tecnologiasDestacadas.descripcion)}</p>
      </header>
      <ul>
${tecHtml}
      </ul>
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
            return `            <p>${this.escapeHtml(p)}</p>`;
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
            return `          <li>
            <h3>${this.escapeHtml(it.titulo)}</h3>
            <p>${this.escapeHtml(it.descripcion)}</p>
          </li>`;
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
      <header>
        <img src="${this.escapeHtml(autor.foto.src)}" alt="${this.escapeHtml(autor.foto.alt)}" width="128" height="128">
        <hgroup>
          <h1>${this.escapeHtml(sobreMi.cabecera.titulo)}</h1>
          <p>${this.escapeHtml(sobreMi.cabecera.subtitulo)}</p>
        </hgroup>
      </header>
    </section>

    <section aria-label="Trayectoria e intereses">
      <article>
        <h2>${this.escapeHtml(sobreMi.trayectoria.titulo)}</h2>
        <hr>

        <section aria-label="Detalles de trayectoria">
          <table aria-label="Datos personales de ${this.escapeHtml(autor.nombreCompleto)}">
            <caption>${this.escapeHtml(sobreMi.datosPersonales.tituloTabla)}</caption>
            <tbody>
${filasTablaHtml}
            </tbody>
          </table>

          <aside aria-label="Biografía y áreas de especialidad">
${parrafosHtml}
            <nav aria-label="Áreas de especialidad">
              <span>Computación web</span>
              <span>UX / UI</span>
              <span>Frontend</span>
              <span>Open Source</span>
            </nav>
          </aside>
        </section>
      </article>
    </section>

    <section aria-label="Aficiones e intereses">
      <article>
        <h2>${this.escapeHtml(sobreMi.intereses.titulo)}</h2>
        <hr>
        <ul>
${interesesHtml}
        </ul>
      </article>
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
        // Lista de artículos de proyectos (renderizado uniforme sin imágenes de captura)
        const articulosHtml = proy.proyectos.map((p, idx) => {
            const badgeDestacado = p.destacado && p.etiquetaDestacada
                ? `              <em>${this.escapeHtml(p.etiquetaDestacada)}</em>\n`
                : '';
            const tagsHtml = p.tecnologias.map(t => {
                return `                <span>${this.escapeHtml(t)}</span>`;
            }).join('\n');
            const enlacesHtml = p.enlaces.map(e => {
                const isGithub = e.url.includes('github') || e.tipo === 'codigo';
                const svgIcon = isGithub
                    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>`
                    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>`;
                return `                  <a href="${this.escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer" aria-label="${this.escapeHtml(e.texto)}: ${this.escapeHtml(p.titulo)}">
                    ${svgIcon}
                  </a>`;
            }).join('\n');
            // Determinar logo tecnológico según la primera tecnología coincidente
            const logosDisponibles = ['typescript', 'javascript', 'python', 'java', 'c', 'go', 'react', 'svelte', 'docker', 'postgresql', 'html5', 'css3'];
            let logoTech = 'typescript';
            for (const t of p.tecnologias) {
                const clean = t.toLowerCase().replace(/[^a-z0-9]/g, '');
                const match = logosDisponibles.find(l => clean.includes(l) || l.includes(clean));
                if (match) {
                    logoTech = match;
                    break;
                }
            }
            return `          <li>
            <article data-category="${this.escapeHtml(p.categoria)}" aria-label="${this.escapeHtml(p.titulo)}">
              <header>
                <img src="assets/img/logos/${logoTech}.svg" alt="" aria-hidden="true" width="28" height="28">
                <nav aria-label="Enlaces del proyecto">
${enlacesHtml}
                </nav>
              </header>
${badgeDestacado}              <h3>${this.escapeHtml(p.titulo)}</h3>
              <span data-estado="${this.escapeHtml(p.estado)}">${this.escapeHtml(p.estado)}</span>
              <p>
                ${this.escapeHtml(p.descripcion)}
              </p>
              <nav aria-label="Tecnologías usadas">
${tagsHtml}
              </nav>
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
      <header>
        <h1>${this.escapeHtml(proy.cabecera.titulo)}</h1>
        <p>${this.escapeHtml(proy.cabecera.subtitulo)}</p>
      </header>
    </section>

    <section aria-label="Catálogo de proyectos">
      <article>
        <h2>Lista de proyectos</h2>

        <nav aria-label="Filtrar proyectos por categoría">
${botonesFiltroHtml}
        </nav>

        <ul>
${articulosHtml}
        </ul>
      </article>
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
            return `              <li>
                <time datetime="${this.escapeHtml(p.periodo.inicio)}">${this.escapeHtml(p.periodo.inicio)} — ${this.escapeHtml(p.periodo.fin)}</time>
                <strong>${this.escapeHtml(p.cargo)}</strong>
                <span>${this.escapeHtml(p.empresa)}</span>
                <p>${this.escapeHtml(p.descripcion)}</p>
              </li>`;
        }).join('\n');
        // Formación académica
        const formacionHtml = cv.formacionAcademica.map(f => {
            const descHtml = f.descripcion ? `\n                <p>${this.escapeHtml(f.descripcion)}</p>` : '';
            return `              <li>
                <time datetime="${this.escapeHtml(f.periodo.inicio)}">${this.escapeHtml(f.periodo.inicio)} — ${this.escapeHtml(f.periodo.fin)}</time>
                <strong>${this.escapeHtml(f.titulo)}</strong>
                <span>${this.escapeHtml(f.institucion)}</span>${descHtml}
              </li>`;
        }).join('\n');
        // Habilidades técnicas en aside (píldoras sin porcentajes ni NaN, idéntico a web-personal)
        const itemsTecnicos = [];
        for (const g of cv.competencias) {
            for (const it of g.items) {
                itemsTecnicos.push(`              <li>${this.escapeHtml(it.nombre)}</li>`);
            }
        }
        const habilidadesSectionHtml = itemsTecnicos.length > 0 ? `          <section aria-label="Habilidades técnicas">
            <h2>Habilidades técnicas</h2>
            <ul>
${itemsTecnicos.join('\n')}
            </ul>
          </section>\n` : '';
        // Idiomas en aside (igual que en web personal, con data-nivel y sin porcentajes)
        let idiomasSectionHtml = '';
        const listaIdiomas = sitio.paginas.sobreMi?.idiomas || [];
        if (listaIdiomas.length > 0) {
            const itemsIdiomas = listaIdiomas.map(idm => {
                const slugNivel = idm.nivel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'intermedio';
                return `              <li>
                <span>${this.escapeHtml(idm.nombre)}</span>
                <span data-nivel="${this.escapeHtml(slugNivel)}">${this.escapeHtml(idm.nivel)}</span>
              </li>`;
            });
            idiomasSectionHtml = `          <section aria-label="Idiomas">
            <h2>Idiomas</h2>
            <ul>
${itemsIdiomas.join('\n')}
            </ul>
          </section>\n`;
        }
        // Contacto dinámico para el aside a partir de metadatos del XML
        const itemsContacto = [];
        if (cInfo.ubicacion) {
            itemsContacto.push(`              <li>${this.escapeHtml(cInfo.ubicacion)}</li>`);
        }
        if (cInfo.email) {
            itemsContacto.push(`              <li><a href="mailto:${this.escapeHtml(cInfo.email)}">${this.escapeHtml(cInfo.email)}</a></li>`);
        }
        if (cInfo.telefono) {
            itemsContacto.push(`              <li><a href="tel:${this.escapeHtml(cInfo.telefono)}">${this.escapeHtml(cInfo.telefono)}</a></li>`);
        }
        for (const r of sitio.metadatos.redesSociales || []) {
            const redNombre = r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1);
            itemsContacto.push(`              <li><a href="${this.escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(redNombre)}</a></li>`);
        }
        const contactoSectionHtml = itemsContacto.length > 0 ? `          <section aria-label="Contacto">
            <h2>Contacto</h2>
            <ul>
${itemsContacto.join('\n')}
            </ul>
          </section>\n` : '';
        // Secciones principales respetando el orden del XML
        const seccionesMap = {};
        if (cv.experienciaLaboral.length > 0) {
            seccionesMap['experiencia'] = `          <section aria-label="Experiencia profesional">
            <h2>Experiencia laboral</h2>
            <ol aria-label="Historial de experiencia profesional">
${experienciaHtml}
            </ol>
          </section>`;
        }
        if (cv.formacionAcademica.length > 0) {
            seccionesMap['formacion'] = `          <section aria-label="Formación académica">
            <h2>Formación académica</h2>
            <ol aria-label="Historial de formación académica">
${formacionHtml}
            </ol>
          </section>`;
        }
        const orden = cv.ordenSecciones && cv.ordenSecciones.length > 0
            ? cv.ordenSecciones
            : ['experiencia', 'formacion'];
        const seccionesHtml = orden
            .map(k => seccionesMap[k])
            .filter(Boolean)
            .join('\n\n');
        return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${this.generarHead(sitio, 'Currículum', 'cv.css')}
</head>
<body>
${this.generarHeaderNav(sitio, 'cv')}

  <main>
    <section aria-label="Cabecera del currículum">
      <header>
        <hgroup>
          <h1>${this.escapeHtml(cv.cabecera.titulo)}</h1>
          <p>${this.escapeHtml(cv.cabecera.subtitulo)}</p>
        </hgroup>
${botonPdfHtml}
      </header>
    </section>

    <section aria-label="Contenido del currículum">
      <article>
        <aside aria-label="Información de contacto y competencias">
          <figure>
            <img src="${this.escapeHtml(autor.foto.src)}" alt="${this.escapeHtml(autor.foto.alt)}" width="110" height="110">
            <figcaption>
              <strong>${this.escapeHtml(autor.nombreCompleto)}</strong>
              <p>${this.escapeHtml(autor.titular)}</p>
            </figcaption>
          </figure>

${contactoSectionHtml}
${habilidadesSectionHtml}
${idiomasSectionHtml}        </aside>

        <section aria-label="Historial profesional y académico">
${seccionesHtml}
        </section>
      </article>
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
            <p>
              <span>${this.escapeHtml(c.etiqueta)}</span>
              <span>${this.escapeHtml(c.valor)}</span>
            </p>
          </a>`;
        }).join('\n');
        // Disponibilidad
        const disponibilidadHtml = cont.disponibilidad ? `    <section aria-label="Disponibilidad">
      <article>
        <h2>Disponibilidad</h2>
        <hr>
        <p><strong>${this.escapeHtml(cont.disponibilidad.estado)}</strong></p>
        <p>${this.escapeHtml(cont.disponibilidad.descripcion)}</p>
      </article>
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
      <header>
        <h1>${this.escapeHtml(cont.cabecera.titulo)}</h1>
        <p>${this.escapeHtml(cont.cabecera.subtitulo)}</p>
      </header>
    </section>

    <section aria-label="Formas de contactarme">
      <article>
        <h2>Formas de contactarme</h2>
        <hr>
        <address>
${canalesHtml}
        </address>
      </article>
    </section>

${disponibilidadHtml}
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
    }
}
