/**
 * generator.ts — Motor de generación de HTML5 y CSS en TypeScript
 * Transforma el modelo SitioPersonalModel en los 5 archivos HTML, CSS y scripts del sitio estático.
 */

import { SitioPersonalModel } from './types';

export class PersonalSiteHTMLGenerator {
  /**
   * Escapa caracteres especiales de HTML
   */
  private static escapeHtml(str: string): string {
    if (!str) return '';
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
  private static generarHead(sitio: SitioPersonalModel, tituloPagina: string, cssPagina: string): string {
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
  private static generarHeaderNav(sitio: SitioPersonalModel, paginaActiva: string): string {
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
  private static generarFooter(sitio: SitioPersonalModel): string {
    const autor = sitio.metadatos.autor;
    const anio = new Date().getFullYear();
    return `  <footer>
    <p>&copy; ${anio} ${this.escapeHtml(autor.nombreCompleto)} — Sitio web generado automáticamente desde XML (PersonalSiteML).</p>
  </footer>`;
  }

  /**
   * Genera index.html (Página de Inicio)
   */
  public static generarIndexHTML(sitio: SitioPersonalModel): string {
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
  public static generarAboutHTML(sitio: SitioPersonalModel): string {
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
      const imgHtml = it.imagen 
        ? `<img src="${this.escapeHtml(it.imagen.src)}" alt="${this.escapeHtml(it.imagen.alt)}" width="${it.imagen.ancho || 600}" height="${it.imagen.alto || 450}" loading="lazy">`
        : '';
      return `          <article>
            <div>
              ${imgHtml}
            </div>
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
  public static generarProjectsHTML(sitio: SitioPersonalModel): string {
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

      const imgHtml = p.imagen ? `              <div>
                <img
                  src="${this.escapeHtml(p.imagen.src)}"
                  alt="${this.escapeHtml(p.imagen.alt)}"
                  width="${p.imagen.ancho || 600}"
                  height="${p.imagen.alto || 380}"
                  loading="lazy"
                >
              </div>\n` : '';

      return `          <li>
            <article data-category="${this.escapeHtml(p.categoria)}" aria-label="${this.escapeHtml(p.titulo)}">
${imgHtml}              <div>
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
  public static generarCvHTML(sitio: SitioPersonalModel): string {
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
  public static generarContactHTML(sitio: SitioPersonalModel): string {
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

    <section aria-label="Formulario de contacto">
      <div>
        <h2>${this.escapeHtml(cont.formulario?.titulo || 'Envíame un mensaje')}</h2>
        <hr>
        <p>${this.escapeHtml(cont.formulario?.descripcion || 'Completa el siguiente formulario para iniciar una conversación.')}</p>
        <form action="#" method="post" aria-label="Formulario de contacto">
          <div>
            <label for="campo-nombre">Nombre <span aria-hidden="true">*</span></label>
            <input type="text" id="campo-nombre" name="nombre" required aria-required="true">
          </div>
          <div>
            <label for="campo-email">Correo electrónico <span aria-hidden="true">*</span></label>
            <input type="email" id="campo-email" name="email" required aria-required="true">
          </div>
          <div>
            <label for="campo-mensaje">Mensaje <span aria-hidden="true">*</span></label>
            <textarea id="campo-mensaje" name="mensaje" rows="5" required aria-required="true"></textarea>
          </div>
          <button type="submit">Enviar mensaje</button>
        </form>
      </div>
    </section>
  </main>

${this.generarFooter(sitio)}
</body>
</html>`;
  }

  /**
   * Genera el contenido de base.css con las variables CSS del tema
   */
  public static generarBaseCSS(sitio: SitioPersonalModel): string {
    const tema = sitio.metadatos.tema || {};
    const colorPrimario = tema.colorPrimario || '#2563eb';
    const colorPrimarioHover = tema.colorPrimarioHover || '#1d4ed8';
    const colorPrimarioClaro = tema.colorPrimarioClaro || '#f0f4fd';
    const colorAcento = tema.colorAcento || '#0ea5e9';
    const colorFondo = tema.colorFondo || '#ffffff';
    const colorSuperficie = tema.colorSuperficie || '#f5f7fb';

    return `:root {
  --fondo:          ${colorFondo};
  --superficie:     ${colorSuperficie};
  --tarjeta:        #ffffff;
  --borde:          #dde3ef;
  --primario:       ${colorPrimario};
  --primario-hover: ${colorPrimarioHover};
  --primario-claro: ${colorPrimarioClaro};
  --primario-borde: #d4e2fc;
  --acento:         ${colorAcento};
  --texto:          #13192b;
  --texto-suave:    #374060;
  --texto-mutado:   #617090;
  --titulo:         #13192b;
  --exito:          #16a34a;
  --aviso:          #d97706;
  --error:          #dc2626;

  --fuente: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --mono:   ui-monospace, 'Cascadia Code', 'Fira Code', monospace;

  --radio-s: 0.375rem;
  --radio-m: 0.5rem;
  --radio-l: 0.75rem;
  --radio-full: 999rem;

  --ancho-max: 68.75rem;
  --transicion: 0.15s ease;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--fondo);
  color: var(--texto);
  font-family: var(--fuente);
  font-size: 1rem;
  line-height: 1.7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

h1, h2, h3, h4 {
  color: var(--titulo);
  line-height: 1.25;
  font-weight: 700;
}

h1 { font-size: 2.1rem; }
h2 { font-size: 1.45rem; }
h3 { font-size: 1.1rem; }

p {
  color: var(--texto-suave);
}

a {
  color: var(--primario);
  text-decoration: none;
  transition: color var(--transicion);
}

a:hover {
  color: var(--primario-hover);
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 0.1875rem solid var(--primario);
  outline-offset: 0.125rem;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

ul, ol {
  list-style: none;
}

hr {
  border: none;
  border-top: 0.0625rem solid var(--borde);
  margin: 0.75rem 0 1.5rem;
}

main {
  flex: 1;
}
`;
  }
}
