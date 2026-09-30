/**
 * generator.js — Generador HTML a partir de PersonalSiteML (XML)
 * Genera el marcado HTML5 exacto que corresponde a las plantillas CSS de Trabajo II
 * asegurando fidelidad visual y accesibilidad WCAG 2.1 AA.
 */

const PersonalSiteGenerator = (function () {
  'use strict';

  const AVATARES = {
    desarrollador: 'assets/img/avatar-desarrollador.svg',
    disenador: 'assets/img/avatar-disenador.svg',
    generico: 'assets/img/avatar-generico.svg'
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function unescapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }

  function capitalizar(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function limpiarAmpersand(texto) {
    if (!texto) return '';
    return String(texto)
      .replace(/&amp;/g, ' y ')
      .replace(/&/g, ' y ')
      .replace(/\s+y\s+/g, ' y ')
      .trim();
  }

  function mapearNivelDescriptivo(nivel) {
    if (nivel === null || nivel === undefined || nivel === '') return 'Avanzado';
    const s = String(nivel).trim().toLowerCase().replace(/%/g, '');
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      if (num >= 80) return 'Avanzado';
      if (num >= 50) return 'Medio';
      return 'Básico';
    }
    if (s.includes('avan') || s.includes('alt') || s.includes('sen') || s.includes('nat') || s.includes('c1') || s.includes('c2')) return 'Avanzado';
    if (s.includes('med') || s.includes('inter') || s.includes('b1') || s.includes('b2')) return 'Medio';
    if (s.includes('bas') || s.includes('princ') || s.includes('inic') || s.includes('elem') || s.includes('a1') || s.includes('a2')) return 'Básico';
    return capitalizar(s);
  }

  function minifyCss(css) {
    if (!css) return '';
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }

  function obtenerCssMinificado(cssFile) {
    let bundle = null;
    if (typeof TEMPLATES_BUNDLE !== 'undefined') {
      bundle = TEMPLATES_BUNDLE;
    } else if (typeof require !== 'undefined') {
      try {
        const path = require('path');
        bundle = require(path.resolve(__dirname, 'templates_bundle.js'));
      } catch (e) {
        bundle = null;
      }
    }
    let base = '', layout = '', specific = '';
    if (bundle) {
      base = bundle['assets/css/base.css'] || '';
      layout = bundle['assets/css/layout.css'] || '';
      specific = bundle['assets/css/' + cssFile] || '';
    } else if (typeof require !== 'undefined') {
      try {
        const path = require('path');
        const fs = require('fs');
        const templatesDir = path.resolve(__dirname, '../templates');
        if (fs.existsSync(templatesDir)) {
          base = fs.readFileSync(path.join(templatesDir, 'base.css'), 'utf8');
          layout = fs.readFileSync(path.join(templatesDir, 'layout.css'), 'utf8');
          specific = fs.readFileSync(path.join(templatesDir, cssFile), 'utf8');
        }
      } catch (e) {}
    }
    return minifyCss(base + '\n' + layout + '\n' + specific);
  }

  function obtenerJsMinificado(jsFile) {
    let bundle = null;
    if (typeof TEMPLATES_BUNDLE !== 'undefined') {
      bundle = TEMPLATES_BUNDLE;
    } else if (typeof require !== 'undefined') {
      try {
        const path = require('path');
        bundle = require(path.resolve(__dirname, 'templates_bundle.js'));
      } catch (e) {
        bundle = null;
      }
    }
    if (bundle && bundle['assets/js/' + jsFile]) {
      return bundle['assets/js/' + jsFile];
    }
    if (typeof require !== 'undefined') {
      try {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.resolve(__dirname, '../templates', jsFile);
        if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
      } catch (e) {}
    }
    return '';
  }

  function getText(parent, tagName) {
    if (!parent) return '';
    const el = parent.getElementsByTagName(tagName)[0] ||
      parent.getElementsByTagNameNS('*', tagName)[0];
    return el && el.textContent ? el.textContent.trim() : '';
  }

  function getAttr(el, attrName, defVal = '') {
    if (!el) return defVal;
    return el.getAttribute(attrName) || defVal;
  }

  function parseXmlSimple(xml) {
    const cleanXml = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').trim();

    function Node(tag) {
      this.tagName = tag;
      this.localName = tag.split(':').pop();
      this.attributes = {};
      this.children = [];
      this.textContent = '';
    }

    Node.prototype.getElementsByTagName = function (name) {
      const results = [];
      function traverse(node) {
        if (!node) return;
        const local = node.tagName.split(':').pop();
        if (local === name || node.tagName === name) {
          results.push(node);
        }
        for (const ch of node.children) {
          traverse(ch);
        }
      }
      for (const ch of this.children) {
        traverse(ch);
      }
      return results;
    };

    Node.prototype.getElementsByTagNameNS = function (ns, name) {
      return this.getElementsByTagName(name);
    };

    Node.prototype.getAttribute = function (attr) {
      return this.attributes[attr] || null;
    };

    Node.prototype.hasAttribute = function (attr) {
      return Object.prototype.hasOwnProperty.call(this.attributes, attr);
    };

    const tagRegex = /<(\/)?([a-zA-Z0-9_\-:]+)((?:\s+[^>="']+(?:=(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/)?>/g;
    let root = null;
    const stack = [];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(cleanXml)) !== null) {
      const textBetween = cleanXml.substring(lastIndex, match.index);
      if (stack.length > 0 && textBetween.trim()) {
        stack[stack.length - 1].textContent += unescapeXml(textBetween.trim());
      }

      const isClosing = Boolean(match[1]);
      const tagName = match[2];
      const attrString = match[3] || '';
      const isSelfClosing = Boolean(match[4]);

      if (isClosing) {
        if (stack.length > 0 && stack[stack.length - 1].tagName === tagName) {
          stack.pop();
        }
      } else {
        const node = new Node(tagName);
        const attrRegex = /([a-zA-Z0-9_\-:]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
        let aMatch;
        while ((aMatch = attrRegex.exec(attrString)) !== null) {
          const aName = aMatch[1];
          const aVal = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : (aMatch[4] || ''));
          node.attributes[aName] = unescapeXml(aVal);
        }

        if (!root) root = node;
        if (stack.length > 0) stack[stack.length - 1].children.push(node);
        if (!isSelfClosing) stack.push(node);
      }
      lastIndex = tagRegex.lastIndex;
    }

    return {
      documentElement: root,
      getElementsByTagName: function (t) { return root ? root.getElementsByTagName(t) : []; },
      getElementsByTagNameNS: function (ns, t) { return root ? root.getElementsByTagName(t) : []; }
    };
  }

  function parseXml(xmlString) {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      const parserError = doc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        throw new Error('Error al parsear el archivo XML: ' + parserError.textContent.slice(0, 120));
      }
      return doc;
    }
    return parseXmlSimple(xmlString);
  }

  function extraerDatos(doc, opciones = {}) {
    opciones = opciones || {};
    const root = doc.documentElement;
    const rootTag = root.localName || root.tagName.split(':').pop();
    if (rootTag !== 'sitio-personal') {
      throw new Error(`Elemento raíz inválido: se esperaba <sitio-personal>, se encontró <${rootTag}>.`);
    }

    const idioma = getAttr(root, 'idioma', 'es');
    const metaEl = root.getElementsByTagName('metadatos')[0] || root.getElementsByTagNameNS('*', 'metadatos')[0];
    if (!metaEl) throw new Error('El archivo XML no contiene el bloque <metadatos>.');

    const autorEl = metaEl.getElementsByTagName('autor')[0] || metaEl.getElementsByTagNameNS('*', 'autor')[0];
    const fotoEl = autorEl ? (autorEl.getElementsByTagName('foto')[0] || autorEl.getElementsByTagNameNS('*', 'foto')[0]) : null;

    const avatar = getAttr(fotoEl, 'avatar', 'generico');
    const fotoSrc = AVATARES[avatar] || AVATARES[opciones.avatarGenerico] || AVATARES.generico;

    const autor = {
      nombreCompleto: getText(autorEl, 'nombre-completo'),
      nombre: getText(autorEl, 'nombre'),
      apellidos: getText(autorEl, 'apellidos'),
      titular: getText(autorEl, 'titular'),
      lema: getText(autorEl, 'lema'),
      descripcion: getText(autorEl, 'descripcion'),
      palabrasClave: getText(autorEl, 'palabras-clave'),
      foto: {
        src: fotoSrc,
        alt: getAttr(fotoEl, 'alt', 'Fotografía de perfil'),
        ancho: getAttr(fotoEl, 'ancho', '208'),
        alto: getAttr(fotoEl, 'alto', '208'),
        avatar: avatar || undefined
      }
    };

    const cInfoEl = metaEl.getElementsByTagName('contacto-info')[0] || metaEl.getElementsByTagNameNS('*', 'contacto-info')[0];
    const contactoInfo = {
      email: getText(cInfoEl, 'email'),
      ubicacion: getText(cInfoEl, 'ubicacion'),
      empresa: getText(cInfoEl, 'empresa'),
      telefono: getText(cInfoEl, 'telefono'),
      disponibilidad: getText(cInfoEl, 'disponibilidad')
    };

    const paginasEl = root.getElementsByTagName('paginas')[0] || root.getElementsByTagNameNS('*', 'paginas')[0];
    if (!paginasEl) throw new Error('El archivo XML no contiene el bloque <paginas>.');

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

    const inicio = {
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
        let intSrc = (imgEl && getAttr(imgEl, 'src', '')) || 'assets/img/interes-generico.svg';
        interesesList.push({
          titulo: getText(it, 'titulo'),
          descripcion: getText(it, 'descripcion'),
          imagen: imgEl || opciones.usarFotosGenericas ? {
            src: intSrc || 'assets/img/interes-generico.svg',
            alt: getAttr(imgEl, 'alt', getText(it, 'titulo') || 'Interés o afición'),
            ancho: getAttr(imgEl, 'ancho', '600'),
            alto: getAttr(imgEl, 'alto', '450')
          } : null
        });
      }
    }

    const sobreMi = {
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
      }
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

        let projSrc = (imgP && getAttr(imgP, 'src', '')) || 'assets/img/proyecto-generico.svg';

        proyectosList.push({
          categoria: getAttr(p, 'categoria', 'web'),
          estado: getAttr(p, 'estado', 'completado'),
          destacado: getAttr(p, 'destacado', 'false') === 'true',
          etiquetaDestacada: getText(p, 'etiqueta-destacada'),
          titulo: getText(p, 'titulo'),
          descripcion: getText(p, 'descripcion'),
          imagen: imgP || opciones.usarFotosGenericas ? {
            src: projSrc || 'assets/img/proyecto-generico.svg',
            alt: getAttr(imgP, 'alt', getText(p, 'titulo') || 'Imagen del proyecto'),
            ancho: getAttr(imgP, 'ancho', '600'),
            alto: getAttr(imgP, 'alto', '380')
          } : null,
          tecnologias: tags,
          enlaces
        });
      }
    }

    const proyectos = {
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
          for (let j = 0; j < lNodes.length; j++) logros.push(lNodes[j].textContent ? lNodes[j].textContent.trim() : '');
        }
        const tecNode = pu.getElementsByTagName('tecnologias')[0] || pu.getElementsByTagNameNS('*', 'tecnologias')[0];
        const tecs = [];
        if (tecNode) {
          const tNodes = tecNode.getElementsByTagName('tag');
          for (let j = 0; j < tNodes.length; j++) tecs.push(tNodes[j].textContent ? tNodes[j].textContent.trim() : '');
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
            nombre: limpiarAmpersand(getAttr(it, 'nombre', '')),
            nivel: it.hasAttribute('nivel') ? getAttr(it, 'nivel', '') : null
          });
        }
        gruposList.push({
          nombre: limpiarAmpersand(getAttr(gr, 'nombre', 'Competencias')),
          items
        });
      }
    }

    const curriculum = {
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

    const contacto = {
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
      autor,
      contactoInfo,
      inicio,
      sobreMi,
      proyectos,
      curriculum,
      contacto
    };
  }

  function generarHead(datos, titulo, cssFile) {
    const autor = datos.autor;
    const cssMin = obtenerCssMinificado(cssFile);
    const navJs = obtenerJsMinificado('nav.js');
    const projectsJs = cssFile === 'projects.css' ? ('\n' + obtenerJsMinificado('projects.js')) : '';

    return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(autor.descripcion)}">
  <meta name="keywords" content="${escapeHtml(autor.palabrasClave)}">
  <meta name="author" content="${escapeHtml(autor.nombreCompleto)}">
  <title>${escapeHtml(titulo)} — ${escapeHtml(autor.nombreCompleto)}</title>
  <style>
${cssMin}
  </style>
  <script>
${navJs}${projectsJs}
  </script>`;
  }

  function generarNav(datos, activa) {
    const links = [
      ['index', 'index.html', 'Inicio'],
      ['about', 'about.html', 'Sobre mí'],
      ['projects', 'projects.html', 'Proyectos'],
      ['cv', 'cv.html', 'Currículum'],
      ['contact', 'contact.html', 'Contacto']
    ].map(([id, url, txt]) => {
      const cur = id === activa ? ' aria-current="page"' : '';
      return `        <li><a href="${url}"${cur}>${txt}</a></li>`;
    }).join('\n');

    return `  <header>
    <nav aria-label="Navegación principal">
      <a href="index.html" aria-label="${escapeHtml(datos.autor.nombreCompleto)} — Inicio">Mi página personal</a>
      <button type="button" aria-expanded="false" aria-label="Abrir menú">&#9776;</button>
      <ul data-abierto="false">
${links}
      </ul>
    </nav>
  </header>`;
  }

  function generarFooter(datos) {
    const anio = new Date().getFullYear();
    return `  <footer>
    <p>&copy; <time datetime="${anio}">${anio}</time> ${escapeHtml(datos.autor.nombreCompleto)}</p>
  </footer>`;
  }

  // 1. index.html (Estructura idéntica a Trabajo II)
  function generarIndex(datos) {
    const ini = datos.inicio;
    const autor = datos.autor;
    const accionesHtml = ini.hero.acciones.map(a => `            <a href="${escapeHtml(a.href)}">${escapeHtml(a.texto)}</a>`).join('\n');
    const metricasHtml = ini.datosRapidos.map(m => `          <li><strong>${escapeHtml(m.valor)}</strong><span>${escapeHtml(m.etiqueta)}</span></li>`).join('\n');
    const tecHtml = ini.tecnologiasDestacadas.items.map(t => {
      const img = t.iconoSrc ? `<img src="${escapeHtml(t.iconoSrc)}" alt="" aria-hidden="true" width="32" height="32">` : '';
      return `          <li>
            ${img}
            <div><span>${escapeHtml(t.nombre)}</span><span>${escapeHtml(t.nivel)}</span></div>
          </li>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${datos.idioma}">
<head>
${generarHead(datos, 'Inicio', 'index.css')}
</head>
<body>
${generarNav(datos, 'index')}

  <main id="main">
    <section aria-label="Presentación">
      <div>
        <div>
          <p>${escapeHtml(ini.hero.subtitulo)}</p>
          <h1>${escapeHtml(ini.hero.saludo)}<br><span>${escapeHtml(autor.nombreCompleto)}</span></h1>
          <p>
            ${escapeHtml(ini.hero.resumen)}
          </p>
          <div>
${accionesHtml}
          </div>
        </div>
        <div>
          <img
            src="${escapeHtml(autor.foto.src)}"
            alt="${escapeHtml(autor.foto.alt)}"
            width="${autor.foto.ancho}"
            height="${autor.foto.alto}"
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
        <h2>${escapeHtml(ini.tecnologiasDestacadas.titulo)}</h2>
        <hr>
        <p>${escapeHtml(ini.tecnologiasDestacadas.descripcion)}</p>
        <ul>
${tecHtml}
        </ul>
      </div>
    </section>

    <section aria-label="Explora la web">
      <div>
        <h2>Explora la web</h2>
        <hr>
      </div>
      <nav aria-label="Secciones del sitio">
        <ul>
          <li>
            <a href="about.html">
              <h3>Sobre mí</h3>
              <p>Mi historia, aficiones, intereses y lo que me mueve.</p>
            </a>
          </li>
          <li>
            <a href="projects.html">
              <h3>Proyectos</h3>
              <p>Mis trabajos y proyectos más destacados.</p>
            </a>
          </li>
          <li>
            <a href="cv.html">
              <h3>Currículum</h3>
              <p>Mi formación académica y experiencia profesional.</p>
            </a>
          </li>
          <li>
            <a href="contact.html">
              <h3>Contacto</h3>
              <p>Datos de contacto y disponibilidad.</p>
            </a>
          </li>
        </ul>
      </nav>
    </section>
  </main>

${generarFooter(datos)}
</body>
</html>`;
  }

  // 2. about.html
  function generarAbout(datos) {
    const s = datos.sobreMi;
    const parrafosHtml = s.trayectoria.parrafos.map(p => `            <p>${escapeHtml(p)}</p>`).join('\n');
    const filasTablaHtml = s.datosPersonales.datos.map(d => {
      const val = d.enlace ? `<a href="${escapeHtml(d.enlace)}">${escapeHtml(d.valor)}</a>` : escapeHtml(d.valor);
      return `              <tr>
                <th scope="row">${escapeHtml(d.etiqueta)}</th>
                <td>${val}</td>
              </tr>`;
    }).join('\n');

    const tagsList = datos.autor.palabrasClave
      ? datos.autor.palabrasClave.split(/[,;]+/).map(t => t.trim()).filter(Boolean)
      : ['Ingeniería web', 'Frontend', 'Backend', 'Software'];
    const tagsHtml = tagsList.map(t => `              <span>${escapeHtml(t)}</span>`).join('\n');

    const aficionesHtml = s.intereses.items.map(it => `          <li>
            <h3>${escapeHtml(it.titulo)}</h3>
            <p>${escapeHtml(it.descripcion)}</p>
          </li>`).join('\n');

    return `<!DOCTYPE html>
<html lang="${datos.idioma}">
<head>
${generarHead(datos, 'Sobre mí', 'about.css')}
</head>
<body>
${generarNav(datos, 'about')}

  <main id="main">
    <section aria-label="Sobre mí">
      <div>
        <img src="${escapeHtml(datos.autor.foto.src)}" alt="${escapeHtml(datos.autor.foto.alt)}" width="128" height="128">
        <div>
          <h1>${escapeHtml(s.cabecera.titulo)}</h1>
          <p>${escapeHtml(s.cabecera.subtitulo)}</p>
        </div>
      </div>
    </section>

    <section aria-label="Trayectoria e intereses">
      <div>
        <h2>${escapeHtml(s.trayectoria.titulo)}</h2>
        <hr>

        <div>
          <table aria-label="Datos personales de ${escapeHtml(datos.autor.nombreCompleto)}">
            <caption>${escapeHtml(s.datosPersonales.tituloTabla)}</caption>
            <tbody>
${filasTablaHtml}
            </tbody>
          </table>

          <div>
${parrafosHtml}
            <div>
${tagsHtml}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Aficiones e intereses">
      <div>
        <h2>${escapeHtml(s.intereses.titulo)}</h2>
        <hr>
        <p>Lo que hago cuando no estoy frente al ordenador (o cuando sí lo estoy, pero por gusto).</p>
        <ul>
${aficionesHtml}
        </ul>
      </div>
    </section>
  </main>

${generarFooter(datos)}
</body>
</html>`;
  }

  // 3. projects.html
  function generarProjects(datos) {
    const pr = datos.proyectos;
    const botonesFiltroHtml = pr.categoriasFiltro.map((c, idx) => {
      return `          <button aria-pressed="${idx === 0 ? 'true' : 'false'}" data-filter="${escapeHtml(c.id)}">${escapeHtml(c.etiqueta)}</button>`;
    }).join('\n');

    const articulosHtml = pr.proyectos.map((p) => {
      const tags = p.tecnologias.map(t => `                <span>${escapeHtml(t)}</span>`).join('\n');
      const badge = p.destacado && p.etiquetaDestacada ? `                <em>${escapeHtml(p.etiquetaDestacada)}</em>\n` : '';
      const estadoLabel = capitalizar(p.estado || 'completado');

      const primerTech = (p.tecnologias && p.tecnologias[0]) ? p.tecnologias[0].toLowerCase() : '';
      let logoSrc = 'assets/img/logos/html5.svg';
      if (primerTech.includes('type') || primerTech.includes('ts')) logoSrc = 'assets/img/logos/typescript.svg';
      else if (primerTech.includes('java') && !primerTech.includes('script')) logoSrc = 'assets/img/logos/java.svg';
      else if (primerTech.includes('postgre') || primerTech.includes('sql')) logoSrc = 'assets/img/logos/postgresql.svg';
      else if (primerTech.includes('python')) logoSrc = 'assets/img/logos/python.svg';
      else if (primerTech.includes('react')) logoSrc = 'assets/img/logos/react.svg';
      else if (primerTech.includes('docker')) logoSrc = 'assets/img/logos/docker.svg';
      else if (primerTech.includes('script') || primerTech.includes('js')) logoSrc = 'assets/img/logos/javascript.svg';
      else if (primerTech.includes('css')) logoSrc = 'assets/img/logos/css3.svg';

      const iconLinks = (p.enlaces || []).map(e => `                  <a href="${escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(e.texto)}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  </a>`).join('\n');

      return `          <li>
            <article data-category="${escapeHtml(p.categoria)}" aria-label="${escapeHtml(p.titulo)}">
              <div>
                <img src="${logoSrc}" alt="" aria-hidden="true" width="28" height="28">
                <div>
${iconLinks}
                </div>
              </div>
              <div>
${badge}                <h3>${escapeHtml(p.titulo)}</h3>
                <span data-estado="${escapeHtml(p.estado)}">${escapeHtml(estadoLabel)}</span>
                <p>${escapeHtml(p.descripcion)}</p>
              </div>
              <div>
${tags}
              </div>
            </article>
          </li>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${datos.idioma}">
<head>
${generarHead(datos, 'Proyectos', 'projects.css')}
</head>
<body>
${generarNav(datos, 'projects')}

  <main id="main">
    <section aria-label="Cabecera de proyectos">
      <div>
        <h1>${escapeHtml(pr.cabecera.titulo)}</h1>
        <p>${escapeHtml(pr.cabecera.subtitulo)}</p>
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

${generarFooter(datos)}
</body>
</html>`;
  }

  // 4. cv.html
  function generarCv(datos) {
    const cv = datos.curriculum;
    const cInfo = datos.contactoInfo;
    const botonPdfHtml = cv.cabecera.descargaPdf ? `        <a href="${escapeHtml(cv.cabecera.descargaPdf.url)}" download aria-label="${escapeHtml(cv.cabecera.descargaPdf.texto)}">
          ${escapeHtml(cv.cabecera.descargaPdf.texto)}
        </a>` : '';

    const expHtml = cv.experienciaLaboral.map(p => `              <li>
                <time datetime="${escapeHtml(p.periodo.inicio)}">${escapeHtml(p.periodo.inicio)} — ${escapeHtml(p.periodo.fin)}</time>
                <strong>${escapeHtml(p.cargo)}</strong>
                <span>${escapeHtml(p.empresa)}</span>
                <p>
                  ${escapeHtml(p.descripcion)}
                </p>
              </li>`).join('\n');

    const formHtml = cv.formacionAcademica.map(f => `              <li>
                <time datetime="${escapeHtml(f.periodo.inicio)}">${escapeHtml(f.periodo.inicio)} — ${escapeHtml(f.periodo.fin)}</time>
                <strong>${escapeHtml(f.titulo)}</strong>
                <span>${escapeHtml(f.institucion)}</span>
                <p>
                  ${escapeHtml(f.descripcion)}
                </p>
              </li>`).join('\n');

    const grupoTech = cv.competencias[0];
    const techItemsHtml = grupoTech ? grupoTech.items.map(it => `              <li>${escapeHtml(limpiarAmpersand(it.nombre))}</li>`).join('\n') : '';

    const otrosGruposHtml = cv.competencias.slice(1).map(gr => {
      const itemsHtml = gr.items.map(it => {
        const nivelTxt = mapearNivelDescriptivo(it.nivel);
        const dataNivel = nivelTxt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return `              <li>
                <span>${escapeHtml(limpiarAmpersand(it.nombre))}</span>
                <span data-nivel="${escapeHtml(dataNivel)}">${escapeHtml(nivelTxt)}</span>
              </li>`;
      }).join('\n');

      return `          <div>
            <h2>${escapeHtml(limpiarAmpersand(gr.nombre))}</h2>
            <ul>
${itemsHtml}
            </ul>
          </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="${datos.idioma}">
<head>
${generarHead(datos, 'Currículum', 'cv.css')}
</head>
<body>
${generarNav(datos, 'cv')}

  <main id="main">
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
            <img src="${escapeHtml(datos.autor.foto.src)}" alt="${escapeHtml(datos.autor.foto.alt)}" width="110" height="110">
            <p>${escapeHtml(datos.autor.nombreCompleto)}</p>
            <p>${escapeHtml(datos.autor.titular)}</p>
          </div>

          <div>
            <h2>Contacto</h2>
            <ul>
              <li>${escapeHtml(cInfo.ubicacion)}</li>
              <li><a href="mailto:${escapeHtml(cInfo.email)}">${escapeHtml(cInfo.email)}</a></li>
              ${cInfo.empresa ? `<li>${escapeHtml(cInfo.empresa)}</li>` : ''}
              ${cInfo.telefono ? `<li>${escapeHtml(cInfo.telefono)}</li>` : ''}
            </ul>
          </div>

          <div>
            <h2>${escapeHtml(grupoTech ? limpiarAmpersand(grupoTech.nombre) : 'Habilidades técnicas')}</h2>
            <ul>
${techItemsHtml}
            </ul>
          </div>

${otrosGruposHtml}
        </aside>

        <div>
          <section aria-label="Experiencia profesional">
            <h2>Experiencia profesional</h2>
            <ol aria-label="Historial de experiencia profesional">
${expHtml}
            </ol>
          </section>

          <section aria-label="Formación académica">
            <h2>Formación académica</h2>
            <ol aria-label="Historial de formación académica">
${formHtml}
            </ol>
          </section>
        </div>
      </div>
    </section>
  </main>

${generarFooter(datos)}
</body>
</html>`;
  }

  // 5. contact.html
  function generarContact(datos) {
    const cont = datos.contacto;
    const canales = cont.canales.map(c => {
      const isExt = c.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `          <a href="${escapeHtml(c.href)}"${isExt} aria-label="${escapeHtml(c.etiqueta)}: ${escapeHtml(c.valor)}">
            <div>
              <span>${escapeHtml(c.etiqueta)}</span>
              <span>${escapeHtml(c.valor)}</span>
            </div>
          </a>`;
    }).join('\n');

    let disp = '';
    if (cont.disponibilidad) {
      const desc = cont.disponibilidad.descripcion || cont.disponibilidad.estado;
      disp = `    <section aria-label="Disponibilidad">
      <div>
        <h2>Disponibilidad</h2>
        <hr>
        <p>
          ${escapeHtml(desc)}
        </p>
        <ul>
          <li>Proyectos freelance de corta duración</li>
          <li>Colaboraciones en open source</li>
          <li>Charlas o ponencias sobre AEM y estándares web</li>
        </ul>
      </div>
    </section>`;
    }

    return `<!DOCTYPE html>
<html lang="${datos.idioma}">
<head>
${generarHead(datos, 'Contacto', 'contact.css')}
</head>
<body>
${generarNav(datos, 'contact')}

  <main id="main">
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
${canales}
        </address>
      </div>
    </section>

${disp}
  </main>

${generarFooter(datos)}
</body>
</html>`;
  }

  function generarSitioDesdeXml(xmlString, opciones = {}) {
    const doc = parseXml(xmlString);
    const datos = extraerDatos(doc, opciones);

    return {
      datos,
      paginas: {
        'index.html': generarIndex(datos),
        'about.html': generarAbout(datos),
        'projects.html': generarProjects(datos),
        'cv.html': generarCv(datos),
        'contact.html': generarContact(datos)
      }
    };
  }

  return {
    parseXml,
    extraerDatos,
    generarSitioDesdeXml
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersonalSiteGenerator;
}
