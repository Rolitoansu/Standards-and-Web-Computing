/**
 * generator_engine.js — Motor universal de generación de sitios web personales
 * Compatible con ejecución en Navegador y Node.js (TypeScript/JavaScript ES6).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PersonalSiteGeneratorEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getText(parent, tagName) {
    if (!parent) return '';
    const el = parent.getElementsByTagName(tagName)[0] || 
               parent.getElementsByTagNameNS('*', tagName)[0];
    return el && el.textContent ? el.textContent.trim() : '';
  }

  function getAttr(el, attrName, defVal) {
    if (!el) return defVal || '';
    return el.getAttribute(attrName) || (defVal || '');
  }

  /**
   * Parser XML unificado
   */
  function parseXML(xmlString) {
    let doc;
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(xmlString, 'text/xml');
      const parserError = doc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        throw new Error('Error de sintaxis XML: ' + parserError.textContent.slice(0, 120));
      }
    } else {
      // Entorno Node.js
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM(xmlString, { contentType: 'text/xml' });
      doc = dom.window.document;
    }

    const root = doc.documentElement;
    const rootTag = root.localName || root.tagName.split(':').pop();
    if (rootTag !== 'sitio-personal') {
      throw new Error(`Elemento raíz inválido: esperado <sitio-personal>, recibido <${rootTag}>`);
    }

    const idioma = getAttr(root, 'idioma', 'es');
    const version = getAttr(root, 'version', '1.0');
    const id = getAttr(root, 'id', 'sitio-personal');

    // Metadatos
    const metaEl = root.getElementsByTagName('metadatos')[0] || root.getElementsByTagNameNS('*', 'metadatos')[0];
    if (!metaEl) throw new Error('Falta el bloque obligatorio <metadatos>.');

    const autorEl = metaEl.getElementsByTagName('autor')[0] || metaEl.getElementsByTagNameNS('*', 'autor')[0];
    const fotoEl = autorEl ? (autorEl.getElementsByTagName('foto')[0] || autorEl.getElementsByTagNameNS('*', 'foto')[0]) : null;

    const autor = {
      nombreCompleto: getText(autorEl, 'nombre-completo'),
      nombre: getText(autorEl, 'nombre'),
      apellidos: getText(autorEl, 'apellidos'),
      titular: getText(autorEl, 'titular'),
      lema: getText(autorEl, 'lema'),
      descripcion: getText(autorEl, 'descripcion'),
      palabrasClave: getText(autorEl, 'palabras-clave'),
      foto: {
        src: getAttr(fotoEl, 'src', 'assets/img/yo.jpg'),
        alt: getAttr(fotoEl, 'alt', 'Fotografía de perfil'),
        ancho: parseInt(getAttr(fotoEl, 'ancho', '208'), 10),
        alto: parseInt(getAttr(fotoEl, 'alto', '208'), 10)
      }
    };

    // Tema
    let tema = null;
    const temaEl = metaEl.getElementsByTagName('tema')[0] || metaEl.getElementsByTagNameNS('*', 'tema')[0];
    if (temaEl) {
      tema = {
        colorPrimario: getText(temaEl, 'color-primario') || '#2563eb',
        colorPrimarioHover: getText(temaEl, 'color-primario-hover') || '#1d4ed8',
        colorPrimarioClaro: getText(temaEl, 'color-primario-claro') || '#f0f4fd',
        colorAcento: getText(temaEl, 'color-acento') || '#0ea5e9',
        colorFondo: getText(temaEl, 'color-fondo') || '#ffffff',
        colorSuperficie: getText(temaEl, 'color-superficie') || '#f5f7fb'
      };
    } else {
      tema = {
        colorPrimario: '#2563eb',
        colorPrimarioHover: '#1d4ed8',
        colorPrimarioClaro: '#f0f4fd',
        colorAcento: '#0ea5e9',
        colorFondo: '#ffffff',
        colorSuperficie: '#f5f7fb'
      };
    }

    // Contacto
    const cInfoEl = metaEl.getElementsByTagName('contacto-info')[0] || metaEl.getElementsByTagNameNS('*', 'contacto-info')[0];
    const contactoInfo = {
      email: getText(cInfoEl, 'email'),
      ubicacion: getText(cInfoEl, 'ubicacion'),
      empresa: getText(cInfoEl, 'empresa'),
      telefono: getText(cInfoEl, 'telefono'),
      disponibilidad: getText(cInfoEl, 'disponibilidad')
    };

    // Redes
    const redesSociales = [];
    const redesEl = metaEl.getElementsByTagName('redes-sociales')[0] || metaEl.getElementsByTagNameNS('*', 'redes-sociales')[0];
    if (redesEl) {
      const redNodes = redesEl.getElementsByTagName('red');
      for (let i = 0; i < redNodes.length; i++) {
        const r = redNodes[i];
        redesSociales.push({
          tipo: getAttr(r, 'tipo', 'web'),
          url: getAttr(r, 'url', '#'),
          usuario: getAttr(r, 'usuario', ''),
          etiqueta: getAttr(r, 'etiqueta', '')
        });
      }
    }

    // Páginas
    const paginasEl = root.getElementsByTagName('paginas')[0] || root.getElementsByTagNameNS('*', 'paginas')[0];
    if (!paginasEl) throw new Error('Falta el bloque obligatorio <paginas>.');

    // 1. Inicio
    const inicioEl = paginasEl.getElementsByTagName('inicio')[0] || paginasEl.getElementsByTagNameNS('*', 'inicio')[0];
    const heroEl = inicioEl ? (inicioEl.getElementsByTagName('hero')[0] || inicioEl.getElementsByTagNameNS('*', 'hero')[0]) : null;
    const acciones = [];
    if (heroEl) {
      const aNodes = heroEl.getElementsByTagName('accion');
      for (let i = 0; i < aNodes.length; i++) {
        const a = aNodes[i];
        acciones.push({
          texto: getAttr(a, 'texto', 'Acción'),
          href: getAttr(a, 'href', '#'),
          tipo: getAttr(a, 'tipo', 'secundario')
        });
      }
    }

    const datosRapidos = [];
    const drEl = inicioEl ? (inicioEl.getElementsByTagName('datos-rapidos')[0] || inicioEl.getElementsByTagNameNS('*', 'datos-rapidos')[0]) : null;
    if (drEl) {
      const mNodes = drEl.getElementsByTagName('metrica');
      for (let i = 0; i < mNodes.length; i++) {
        const m = mNodes[i];
        datosRapidos.push({
          valor: getAttr(m, 'valor', ''),
          etiqueta: getAttr(m, 'etiqueta', '')
        });
      }
    }

    const tecDesEl = inicioEl ? (inicioEl.getElementsByTagName('tecnologias-destacadas')[0] || inicioEl.getElementsByTagNameNS('*', 'tecnologias-destacadas')[0]) : null;
    const tecItems = [];
    if (tecDesEl) {
      const tNodes = tecDesEl.getElementsByTagName('tecnologia');
      for (let i = 0; i < tNodes.length; i++) {
        const t = tNodes[i];
        const iconoEl = t.getElementsByTagName('icono')[0] || t.getElementsByTagNameNS('*', 'icono')[0];
        tecItems.push({
          nombre: getText(t, 'nombre'),
          nivel: getText(t, 'nivel') || 'Avanzado',
          iconoSrc: iconoEl ? getAttr(iconoEl, 'src') : '',
          categoria: getAttr(t, 'categoria', '')
        });
      }
    }

    const paginaInicio = {
      hero: {
        saludo: getText(heroEl, 'saludo') || 'Hola, soy',
        subtitulo: getText(heroEl, 'subtitulo') || autor.titular,
        resumen: getText(heroEl, 'resumen') || autor.descripcion,
        acciones
      },
      datosRapidos,
      tecnologiasDestacadas: {
        titulo: getText(tecDesEl, 'titulo') || 'Tecnologías',
        descripcion: getText(tecDesEl, 'descripcion') || '',
        items: tecItems
      }
    };

    // 2. Sobre mí
    const sobreMiEl = paginasEl.getElementsByTagName('sobre-mi')[0] || paginasEl.getElementsByTagNameNS('*', 'sobre-mi')[0];
    const cabSobreMi = sobreMiEl ? (sobreMiEl.getElementsByTagName('cabecera')[0] || sobreMiEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const trayEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('trayectoria')[0] || sobreMiEl.getElementsByTagNameNS('*', 'trayectoria')[0]) : null;
    const parrafos = [];
    if (trayEl) {
      const pNodes = trayEl.getElementsByTagName('parrafo');
      for (let i = 0; i < pNodes.length; i++) {
        parrafos.push(pNodes[i].textContent ? pNodes[i].textContent.trim() : '');
      }
    }

    const dtEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('datos-personales')[0] || sobreMiEl.getElementsByTagNameNS('*', 'datos-personales')[0]) : null;
    const datosPersonalesList = [];
    if (dtEl) {
      const dNodes = dtEl.getElementsByTagName('dato');
      for (let i = 0; i < dNodes.length; i++) {
        const d = dNodes[i];
        datosPersonalesList.push({
          etiqueta: getAttr(d, 'etiqueta', ''),
          valor: d.textContent ? d.textContent.trim() : '',
          enlace: getAttr(d, 'enlace', '')
        });
      }
    }

    const interesesEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('intereses')[0] || sobreMiEl.getElementsByTagNameNS('*', 'intereses')[0]) : null;
    const interesesList = [];
    if (interesesEl) {
      const intNodes = interesesEl.getElementsByTagName('interes');
      for (let i = 0; i < intNodes.length; i++) {
        const it = intNodes[i];
        const imgEl = it.getElementsByTagName('imagen')[0] || it.getElementsByTagNameNS('*', 'imagen')[0];
        interesesList.push({
          titulo: getText(it, 'titulo'),
          descripcion: getText(it, 'descripcion'),
          imagen: imgEl ? {
            src: getAttr(imgEl, 'src', ''),
            alt: getAttr(imgEl, 'alt', ''),
            ancho: parseInt(getAttr(imgEl, 'ancho', '600'), 10),
            alto: parseInt(getAttr(imgEl, 'alto', '450'), 10)
          } : null
        });
      }
    }

    const idiomasEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('idiomas')[0] || sobreMiEl.getElementsByTagNameNS('*', 'idiomas')[0]) : null;
    const idiomasList = [];
    if (idiomasEl) {
      const idNodes = idiomasEl.getElementsByTagName('idioma-item');
      for (let i = 0; i < idNodes.length; i++) {
        const im = idNodes[i];
        idiomasList.push({
          nombre: getAttr(im, 'nombre', ''),
          nivel: getAttr(im, 'nivel', ''),
          porcentaje: im.hasAttribute('porcentaje') ? parseInt(getAttr(im, 'porcentaje', '100'), 10) : null
        });
      }
    }

    const paginaSobreMi = {
      cabecera: {
        titulo: getText(cabSobreMi, 'titulo') || 'Sobre mí',
        subtitulo: getText(cabSobreMi, 'subtitulo') || ''
      },
      trayectoria: {
        titulo: getText(trayEl, 'titulo') || 'Trayectoria e intereses',
        parrafos
      },
      datosPersonales: {
        tituloTabla: getText(dtEl, 'titulo-tabla') || 'Datos personales',
        datos: datosPersonalesList
      },
      intereses: {
        titulo: getText(interesesEl, 'titulo') || 'Intereses y Aficiones',
        items: interesesList
      },
      idiomas: idiomasList
    };

    // 3. Proyectos
    const proyectosEl = paginasEl.getElementsByTagName('proyectos')[0] || paginasEl.getElementsByTagNameNS('*', 'proyectos')[0];
    const cabProy = proyectosEl ? (proyectosEl.getElementsByTagName('cabecera')[0] || proyectosEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const catFiltroEl = proyectosEl ? (proyectosEl.getElementsByTagName('categorias-filtro')[0] || proyectosEl.getElementsByTagNameNS('*', 'categorias-filtro')[0]) : null;
    const categoriasFiltro = [];
    if (catFiltroEl) {
      const cNodes = catFiltroEl.getElementsByTagName('categoria');
      for (let i = 0; i < cNodes.length; i++) {
        const c = cNodes[i];
        categoriasFiltro.push({
          id: getAttr(c, 'id', 'all'),
          etiqueta: getAttr(c, 'etiqueta', 'Todos')
        });
      }
    }

    const listaProyEl = proyectosEl ? (proyectosEl.getElementsByTagName('lista-proyectos')[0] || proyectosEl.getElementsByTagNameNS('*', 'lista-proyectos')[0]) : null;
    const proyectosList = [];
    if (listaProyEl) {
      const pNodes = listaProyEl.getElementsByTagName('proyecto');
      for (let i = 0; i < pNodes.length; i++) {
        const p = pNodes[i];
        const imgP = p.getElementsByTagName('imagen')[0] || p.getElementsByTagNameNS('*', 'imagen')[0];
        
        const tecNode = p.getElementsByTagName('tecnologias')[0] || p.getElementsByTagNameNS('*', 'tecnologias')[0];
        const tags = [];
        if (tecNode) {
          const tNodes = tecNode.getElementsByTagName('tag');
          for (let j = 0; j < tNodes.length; j++) {
            tags.push(tNodes[j].textContent ? tNodes[j].textContent.trim() : '');
          }
        }

        const enlNode = p.getElementsByTagName('enlaces')[0] || p.getElementsByTagNameNS('*', 'enlaces')[0];
        const enlaces = [];
        if (enlNode) {
          const eNodes = enlNode.getElementsByTagName('enlace');
          for (let j = 0; j < eNodes.length; j++) {
            const e = eNodes[j];
            enlaces.push({
              tipo: getAttr(e, 'tipo', 'demo'),
              url: getAttr(e, 'url', '#'),
              texto: getAttr(e, 'texto', 'Enlace')
            });
          }
        }

        proyectosList.push({
          categoria: getAttr(p, 'categoria', 'web'),
          estado: getAttr(p, 'estado', 'completado'),
          destacado: getAttr(p, 'destacado', 'false') === 'true',
          etiquetaDestacada: getText(p, 'etiqueta-destacada'),
          titulo: getText(p, 'titulo'),
          descripcion: getText(p, 'descripcion'),
          imagen: imgP ? {
            src: getAttr(imgP, 'src', ''),
            alt: getAttr(imgP, 'alt', ''),
            ancho: parseInt(getAttr(imgP, 'ancho', '600'), 10),
            alto: parseInt(getAttr(imgP, 'alto', '380'), 10)
          } : null,
          tecnologias: tags,
          enlaces
        });
      }
    }

    const paginaProyectos = {
      cabecera: {
        titulo: getText(cabProy, 'titulo') || 'Proyectos',
        subtitulo: getText(cabProy, 'subtitulo') || ''
      },
      categoriasFiltro,
      proyectos: proyectosList
    };

    // 4. Currículum
    const cvEl = paginasEl.getElementsByTagName('curriculum')[0] || paginasEl.getElementsByTagNameNS('*', 'curriculum')[0];
    const cabCv = cvEl ? (cvEl.getElementsByTagName('cabecera')[0] || cvEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const pdfEl = cabCv ? (cabCv.getElementsByTagName('descarga-pdf')[0] || cabCv.getElementsByTagNameNS('*', 'descarga-pdf')[0]) : null;

    const expEl = cvEl ? (cvEl.getElementsByTagName('experiencia-laboral')[0] || cvEl.getElementsByTagNameNS('*', 'experiencia-laboral')[0]) : null;
    const puestosList = [];
    if (expEl) {
      const pNodes = expEl.getElementsByTagName('puesto');
      for (let i = 0; i < pNodes.length; i++) {
        const pu = pNodes[i];
        const perEl = pu.getElementsByTagName('periodo')[0] || pu.getElementsByTagNameNS('*', 'periodo')[0];
        const logrosNode = pu.getElementsByTagName('logros')[0] || pu.getElementsByTagNameNS('*', 'logros')[0];
        const logros = [];
        if (logrosNode) {
          const lNodes = logrosNode.getElementsByTagName('logro');
          for (let j = 0; j < lNodes.length; j++) {
            logros.push(lNodes[j].textContent ? lNodes[j].textContent.trim() : '');
          }
        }

        const tecNode = pu.getElementsByTagName('tecnologias')[0] || pu.getElementsByTagNameNS('*', 'tecnologias')[0];
        const tecs = [];
        if (tecNode) {
          const tNodes = tecNode.getElementsByTagName('tag');
          for (let j = 0; j < tNodes.length; j++) {
            tecs.push(tNodes[j].textContent ? tNodes[j].textContent.trim() : '');
          }
        }

        puestosList.push({
          cargo: getText(pu, 'cargo'),
          empresa: getText(pu, 'empresa'),
          periodo: {
            inicio: getAttr(perEl, 'inicio', ''),
            fin: getAttr(perEl, 'fin', 'Actualidad')
          },
          descripcion: getText(pu, 'descripcion'),
          logros,
          tecnologias: tecs
        });
      }
    }

    const formEl = cvEl ? (cvEl.getElementsByTagName('formacion-academica')[0] || cvEl.getElementsByTagNameNS('*', 'formacion-academica')[0]) : null;
    const estudiosList = [];
    if (formEl) {
      const eNodes = formEl.getElementsByTagName('estudio');
      for (let i = 0; i < eNodes.length; i++) {
        const es = eNodes[i];
        const perEl = es.getElementsByTagName('periodo')[0] || es.getElementsByTagNameNS('*', 'periodo')[0];
        estudiosList.push({
          titulo: getText(es, 'titulo'),
          institucion: getText(es, 'institucion'),
          periodo: {
            inicio: getAttr(perEl, 'inicio', ''),
            fin: getAttr(perEl, 'fin', '')
          },
          descripcion: getText(es, 'descripcion')
        });
      }
    }

    const compEl = cvEl ? (cvEl.getElementsByTagName('competencias')[0] || cvEl.getElementsByTagNameNS('*', 'competencias')[0]) : null;
    const gruposList = [];
    if (compEl) {
      const gNodes = compEl.getElementsByTagName('grupo');
      for (let i = 0; i < gNodes.length; i++) {
        const gr = gNodes[i];
        const itNodes = gr.getElementsByTagName('item');
        const items = [];
        for (let j = 0; j < itNodes.length; j++) {
          const it = itNodes[j];
          items.push({
            nombre: getAttr(it, 'nombre', ''),
            nivel: it.hasAttribute('nivel') ? parseInt(getAttr(it, 'nivel', '80'), 10) : null
          });
        }
        gruposList.push({
          nombre: getAttr(gr, 'nombre', 'Competencias'),
          items
        });
      }
    }

    const paginaCurriculum = {
      cabecera: {
        titulo: getText(cabCv, 'titulo') || 'Currículum Vitae',
        subtitulo: getText(cabCv, 'subtitulo') || '',
        descargaPdf: pdfEl ? {
          url: getAttr(pdfEl, 'url', 'assets/cv.pdf'),
          texto: getAttr(pdfEl, 'texto', 'Descargar PDF')
        } : null
      },
      experienciaLaboral: puestosList,
      formacionAcademica: estudiosList,
      competencias: gruposList
    };

    // 5. Contacto
    const contactoEl = paginasEl.getElementsByTagName('contacto')[0] || paginasEl.getElementsByTagNameNS('*', 'contacto')[0];
    const cabCont = contactoEl ? (contactoEl.getElementsByTagName('cabecera')[0] || contactoEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const canalesEl = contactoEl ? (contactoEl.getElementsByTagName('canales')[0] || contactoEl.getElementsByTagNameNS('*', 'canales')[0]) : null;
    const canalesList = [];
    if (canalesEl) {
      const cNodes = canalesEl.getElementsByTagName('canal');
      for (let i = 0; i < cNodes.length; i++) {
        const c = cNodes[i];
        canalesList.push({
          tipo: getAttr(c, 'tipo', 'email'),
          etiqueta: getAttr(c, 'etiqueta', 'Email'),
          valor: getAttr(c, 'valor', ''),
          href: getAttr(c, 'href', '#')
        });
      }
    }

    const dispEl = contactoEl ? (contactoEl.getElementsByTagName('disponibilidad')[0] || contactoEl.getElementsByTagNameNS('*', 'disponibilidad')[0]) : null;
    const formContEl = contactoEl ? (contactoEl.getElementsByTagName('formulario')[0] || contactoEl.getElementsByTagNameNS('*', 'formulario')[0]) : null;

    const paginaContacto = {
      cabecera: {
        titulo: getText(cabCont, 'titulo') || 'Contacto',
        subtitulo: getText(cabCont, 'subtitulo') || ''
      },
      canales: canalesList,
      disponibilidad: dispEl ? {
        estado: getText(dispEl, 'estado') || 'Disponible',
        descripcion: getText(dispEl, 'descripcion') || ''
      } : null,
      formulario: formContEl ? {
        titulo: getText(formContEl, 'titulo') || 'Envíame un mensaje',
        descripcion: getText(formContEl, 'descripcion') || ''
      } : null
    };

    return {
      idioma,
      version,
      id,
      metadatos: {
        autor,
        tema,
        contactoInfo,
        redesSociales
      },
      paginas: {
        inicio: paginaInicio,
        sobreMi: paginaSobreMi,
        proyectos: paginaProyectos,
        curriculum: paginaCurriculum,
        contacto: paginaContacto
      }
    };
  }

  /**
   * Generación de HTML Head y Navegación
   */
  function generarHead(sitio, tituloPagina, cssPagina) {
    const autor = sitio.metadatos.autor;
    return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(autor.descripcion)}">
  <meta name="keywords" content="${escapeHtml(autor.palabrasClave)}">
  <meta name="author" content="${escapeHtml(autor.nombreCompleto)}">
  <meta property="og:title" content="${escapeHtml(tituloPagina)} — ${escapeHtml(autor.nombreCompleto)}">
  <meta property="og:description" content="${escapeHtml(autor.descripcion)}">
  <meta property="og:type" content="website">
  <title>${escapeHtml(tituloPagina)} — ${escapeHtml(autor.nombreCompleto)}</title>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/layout.css">
  <link rel="stylesheet" href="assets/css/${cssPagina}">
  <script src="assets/js/nav.js" defer></script>`;
  }

  function generarHeaderNav(sitio, paginaActiva) {
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
      <a href="index.html" aria-label="${escapeHtml(sitio.metadatos.autor.nombreCompleto)} — Inicio">Mi página personal</a>
      <button type="button" aria-expanded="false" aria-label="Abrir menú">
        &#9776;
      </button>
      <ul data-abierto="false">
${enlacesNav}
      </ul>
    </nav>
  </header>`;
  }

  function generarFooter(sitio) {
    const autor = sitio.metadatos.autor;
    const anio = new Date().getFullYear();
    return `  <footer>
    <p>&copy; ${anio} ${escapeHtml(autor.nombreCompleto)} — Generado automáticamente mediante PersonalSiteML.</p>
  </footer>`;
  }

  /**
   * Generadores de páginas individuales
   */
  function generarIndexHTML(sitio) {
    const inicio = sitio.paginas.inicio;
    const autor = sitio.metadatos.autor;

    const accionesHtml = inicio.hero.acciones.map(a => {
      return `            <a href="${escapeHtml(a.href)}">${escapeHtml(a.texto)}</a>`;
    }).join('\n');

    const metricasHtml = inicio.datosRapidos.map(m => {
      return `          <li><strong>${escapeHtml(m.valor)}</strong><span>${escapeHtml(m.etiqueta)}</span></li>`;
    }).join('\n');

    const tecHtml = inicio.tecnologiasDestacadas.items.map(t => {
      const imgTag = t.iconoSrc ? `<img src="${escapeHtml(t.iconoSrc)}" alt="" aria-hidden="true" width="32" height="32">` : '';
      return `          <li>
            ${imgTag}
            <div><span>${escapeHtml(t.nombre)}</span><span>${escapeHtml(t.nivel)}</span></div>
          </li>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${generarHead(sitio, 'Inicio', 'index.css')}
</head>
<body>
${generarHeaderNav(sitio, 'index')}

  <main>
    <section aria-label="Presentación">
      <div>
        <div>
          <p>${escapeHtml(inicio.hero.subtitulo)}</p>
          <h1>${escapeHtml(inicio.hero.saludo)}<br><span>${escapeHtml(autor.nombreCompleto)}</span></h1>
          <p>
            ${escapeHtml(inicio.hero.resumen)}
          </p>
          <div>
${accionesHtml}
          </div>
        </div>
        <div>
          <img
            src="${escapeHtml(autor.foto.src)}"
            alt="${escapeHtml(autor.foto.alt)}"
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
        <h2>${escapeHtml(inicio.tecnologiasDestacadas.titulo)}</h2>
        <hr>
        <p>${escapeHtml(inicio.tecnologiasDestacadas.descripcion)}</p>
        <ul>
${tecHtml}
        </ul>
      </div>
    </section>
  </main>

${generarFooter(sitio)}
</body>
</html>`;
  }

  function generarAboutHTML(sitio) {
    const sobreMi = sitio.paginas.sobreMi;
    const autor = sitio.metadatos.autor;

    const parrafosHtml = sobreMi.trayectoria.parrafos.map(p => {
      return `          <p>${escapeHtml(p)}</p>`;
    }).join('\n');

    const filasTablaHtml = sobreMi.datosPersonales.datos.map(d => {
      const valHtml = d.enlace 
        ? `<a href="${escapeHtml(d.enlace)}">${escapeHtml(d.valor)}</a>`
        : escapeHtml(d.valor);
      return `              <tr>
                <th scope="row">${escapeHtml(d.etiqueta)}</th>
                <td>${valHtml}</td>
              </tr>`;
    }).join('\n');

    const interesesHtml = sobreMi.intereses.items.map(it => {
      const imgHtml = it.imagen 
        ? `<img src="${escapeHtml(it.imagen.src)}" alt="${escapeHtml(it.imagen.alt)}" width="${it.imagen.ancho || 600}" height="${it.imagen.alto || 450}" loading="lazy">`
        : '';
      return `          <article>
            <div>
              ${imgHtml}
            </div>
            <div>
              <h3>${escapeHtml(it.titulo)}</h3>
              <p>${escapeHtml(it.descripcion)}</p>
            </div>
          </article>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${generarHead(sitio, 'Sobre mí', 'about.css')}
</head>
<body>
${generarHeaderNav(sitio, 'about')}

  <main>
    <section aria-label="Sobre mí">
      <div>
        <img src="${escapeHtml(autor.foto.src)}" alt="${escapeHtml(autor.foto.alt)}" width="128" height="128">
        <div>
          <h1>${escapeHtml(sobreMi.cabecera.titulo)}</h1>
          <p>${escapeHtml(sobreMi.cabecera.subtitulo)}</p>
        </div>
      </div>
    </section>

    <section aria-label="Trayectoria e intereses">
      <div>
        <h2>${escapeHtml(sobreMi.trayectoria.titulo)}</h2>
        <hr>

        <div>
          <table aria-label="Datos personales de ${escapeHtml(autor.nombreCompleto)}">
            <caption>${escapeHtml(sobreMi.datosPersonales.tituloTabla)}</caption>
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
        <h2>${escapeHtml(sobreMi.intereses.titulo)}</h2>
        <hr>
        <div>
${interesesHtml}
        </div>
      </div>
    </section>
  </main>

${generarFooter(sitio)}
</body>
</html>`;
  }

  function generarProjectsHTML(sitio) {
    const proy = sitio.paginas.proyectos;

    const botonesFiltroHtml = proy.categoriasFiltro.map((c, idx) => {
      const isPressed = idx === 0 ? 'true' : 'false';
      return `          <button aria-pressed="${isPressed}" data-filter="${escapeHtml(c.id)}">${escapeHtml(c.etiqueta)}</button>`;
    }).join('\n');

    const articulosHtml = proy.proyectos.map(p => {
      const badgeDestacado = p.destacado && p.etiquetaDestacada 
        ? `                <em>${escapeHtml(p.etiquetaDestacada)}</em>\n` 
        : '';

      const tagsHtml = p.tecnologias.map(t => {
        return `                  <li>${escapeHtml(t)}</li>`;
      }).join('\n');

      const enlacesHtml = p.enlaces.map(e => {
        return `                  <a href="${escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.texto)}</a>`;
      }).join('\n');

      const imgHtml = p.imagen ? `              <div>
                <img
                  src="${escapeHtml(p.imagen.src)}"
                  alt="${escapeHtml(p.imagen.alt)}"
                  width="${p.imagen.ancho || 600}"
                  height="${p.imagen.alto || 380}"
                  loading="lazy"
                >
              </div>\n` : '';

      return `          <li>
            <article data-category="${escapeHtml(p.categoria)}" aria-label="${escapeHtml(p.titulo)}">
${imgHtml}              <div>
${badgeDestacado}                <h3>${escapeHtml(p.titulo)}</h3>
                <span data-estado="${escapeHtml(p.estado)}">${escapeHtml(p.estado)}</span>
                <p>
                  ${escapeHtml(p.descripcion)}
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
${generarHead(sitio, 'Proyectos', 'projects.css')}
  <script src="assets/js/projects.js" defer></script>
</head>
<body>
${generarHeaderNav(sitio, 'projects')}

  <main>
    <section aria-label="Cabecera de proyectos">
      <div>
        <h1>${escapeHtml(proy.cabecera.titulo)}</h1>
        <p>${escapeHtml(proy.cabecera.subtitulo)}</p>
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

${generarFooter(sitio)}
</body>
</html>`;
  }

  function generarCvHTML(sitio) {
    const cv = sitio.paginas.curriculum;
    const autor = sitio.metadatos.autor;
    const cInfo = sitio.metadatos.contactoInfo;

    const botonPdfHtml = cv.cabecera.descargaPdf 
      ? `        <a href="${escapeHtml(cv.cabecera.descargaPdf.url)}" download aria-label="${escapeHtml(cv.cabecera.descargaPdf.texto)}">
          ${escapeHtml(cv.cabecera.descargaPdf.texto)}
        </a>`
      : '';

    const experienciaHtml = cv.experienciaLaboral.map(p => {
      const logrosHtml = p.logros && p.logros.length > 0 
        ? `              <ul>\n${p.logros.map(l => `                <li>${escapeHtml(l)}</li>`).join('\n')}\n              </ul>`
        : '';

      const tagsHtml = p.tecnologias && p.tecnologias.length > 0
        ? `              <div>\n${p.tecnologias.map(t => `                <span>${escapeHtml(t)}</span>`).join('\n')}\n              </div>`
        : '';

      return `            <article>
              <header>
                <h3>${escapeHtml(p.cargo)}</h3>
                <p>${escapeHtml(p.empresa)} · <time>${escapeHtml(p.periodo.inicio)} — ${escapeHtml(p.periodo.fin)}</time></p>
              </header>
              <p>${escapeHtml(p.descripcion)}</p>
${logrosHtml}
${tagsHtml}
            </article>`;
    }).join('\n');

    const formacionHtml = cv.formacionAcademica.map(f => {
      const descHtml = f.descripcion ? `              <p>${escapeHtml(f.descripcion)}</p>` : '';
      return `            <article>
              <header>
                <h3>${escapeHtml(f.titulo)}</h3>
                <p>${escapeHtml(f.institucion)} · <time>${escapeHtml(f.periodo.inicio)} — ${escapeHtml(f.periodo.fin)}</time></p>
              </header>
${descHtml}
            </article>`;
    }).join('\n');

    const competenciasAsideHtml = cv.competencias.map(g => {
      const itemsHtml = g.items.map(it => {
        const barraHtml = it.nivel !== null && it.nivel !== undefined
          ? `                  <div role="progressbar" aria-valuenow="${it.nivel}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(it.nombre)}: ${it.nivel}%">
                    <div style="width: ${it.nivel}%;"></div>
                  </div>`
          : '';
        return `                <li>
                  <span>${escapeHtml(it.nombre)}</span>
                  ${barraHtml}
                </li>`;
      }).join('\n');

      return `          <div>
            <h3>${escapeHtml(g.nombre)}</h3>
            <ul>
${itemsHtml}
            </ul>
          </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${generarHead(sitio, 'Currículum', 'cv.css')}
</head>
<body>
${generarHeaderNav(sitio, 'cv')}

  <main>
    <section aria-label="Cabecera del currículum">
      <div>
        <div>
          <h1>${escapeHtml(cv.cabecera.titulo)}</h1>
          <p>${escapeHtml(cv.cabecera.subtitulo)}</p>
        </div>
${botonPdfHtml}
      </div>
    </section>

    <section aria-label="Contenido del currículum">
      <div>
        <aside aria-label="Información de contacto y competencias">
          <div>
            <img src="${escapeHtml(autor.foto.src)}" alt="${escapeHtml(autor.foto.alt)}" width="110" height="110">
            <p>${escapeHtml(autor.nombreCompleto)}</p>
            <p>${escapeHtml(autor.titular)}</p>
          </div>

          <div>
            <h2>Contacto</h2>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:${escapeHtml(cInfo.email)}">${escapeHtml(cInfo.email)}</a></li>
              <li><strong>Ubicación:</strong> ${escapeHtml(cInfo.ubicacion)}</li>
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

${generarFooter(sitio)}
</body>
</html>`;
  }

  function generarContactHTML(sitio) {
    const cont = sitio.paginas.contacto;

    const canalesHtml = cont.canales.map(c => {
      const isExternal = c.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `          <a href="${escapeHtml(c.href)}"${isExternal} aria-label="${escapeHtml(c.etiqueta)}: ${escapeHtml(c.valor)}">
            <div>
              <span>${escapeHtml(c.etiqueta)}</span>
              <span>${escapeHtml(c.valor)}</span>
            </div>
          </a>`;
    }).join('\n');

    const disponibilidadHtml = cont.disponibilidad ? `    <section aria-label="Disponibilidad">
      <div>
        <h2>Disponibilidad</h2>
        <hr>
        <p><strong>${escapeHtml(cont.disponibilidad.estado)}</strong></p>
        <p>${escapeHtml(cont.disponibilidad.descripcion)}</p>
      </div>
    </section>` : '';

    return `<!DOCTYPE html>
<html lang="${sitio.idioma}">
<head>
${generarHead(sitio, 'Contacto', 'contact.css')}
</head>
<body>
${generarHeaderNav(sitio, 'contact')}

  <main>
    <section aria-label="Cabecera de contacto">
      <div>
        <h1>${escapeHtml(cont.cabecera.titulo)}</h1>
        <p>${escapeHtml(cont.cabecera.subtitulo)}</p>
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
        <h2>${escapeHtml(cont.formulario ? cont.formulario.titulo : 'Envíame un mensaje')}</h2>
        <hr>
        <p>${escapeHtml(cont.formulario ? cont.formulario.descripcion : 'Completa el siguiente formulario para iniciar una conversación.')}</p>
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

${generarFooter(sitio)}
</body>
</html>`;
  }

  function generarBaseCSS(sitio) {
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

  /**
   * Generación completa del conjunto de archivos
   */
  function generarSitioCompleto(xmlString, plantillasCSS = {}) {
    const tInicio = performance.now();
    const sitio = parseXML(xmlString);

    const archivos = {
      'index.html': generarIndexHTML(sitio),
      'about.html': generarAboutHTML(sitio),
      'projects.html': generarProjectsHTML(sitio),
      'cv.html': generarCvHTML(sitio),
      'contact.html': generarContactHTML(sitio),
      'assets/css/base.css': generarBaseCSS(sitio),
      'assets/css/layout.css': plantillasCSS['layout.css'] || '',
      'assets/css/index.css': plantillasCSS['index.css'] || '',
      'assets/css/about.css': plantillasCSS['about.css'] || '',
      'assets/css/projects.css': plantillasCSS['projects.css'] || '',
      'assets/css/cv.css': plantillasCSS['cv.css'] || '',
      'assets/css/contact.css': plantillasCSS['contact.css'] || '',
      'assets/js/nav.js': plantillasCSS['nav.js'] || '',
      'assets/js/projects.js': plantillasCSS['projects.js'] || ''
    };

    let tamanoTotal = 0;
    for (const key in archivos) {
      tamanoTotal += archivos[key].length;
    }

    const tFin = performance.now();

    return {
      sitio,
      archivos,
      metricas: {
        totalArchivos: Object.keys(archivos).length,
        tamanoTotalBytes: tamanoTotal,
        tiempoGeneracionMs: Math.round((tFin - tInicio) * 100) / 100
      }
    };
  }

  return {
    parseXML,
    generarIndexHTML,
    generarAboutHTML,
    generarProjectsHTML,
    generarCvHTML,
    generarContactHTML,
    generarBaseCSS,
    generarSitioCompleto
  };
}));
