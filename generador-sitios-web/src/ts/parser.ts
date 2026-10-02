/**
 * parser.ts — Analizador sintáctico y semántico de documentos PersonalSiteML en TypeScript
 * Transforma un documento XML en un modelo fuertemente tipado SitioPersonalModel.
 */

import {
  SitioPersonalModel,
  MetadatosAutor,
  TemaColor,
  ContactoInfo,
  RedSocial,
  PaginaInicio,
  PaginaSobreMi,
  PaginaProyectos,
  PaginaCurriculum,
  PaginaContacto,
  TecnologiaDestacada,
  DatoPersonal,
  InteresAficion,
  IdiomaItem,
  CategoriaFiltro,
  ProyectoItem,
  PuestoExperiencia,
  EstudioFormacion,
  GrupoCompetencias,
  OpcionesGenerador
} from './types.js';

export class PersonalSiteXMLParser {
  private static readonly AVATARES: Record<string, string> = {
    desarrollador: 'assets/img/avatar-desarrollador.svg',
    disenador: 'assets/img/avatar-disenador.svg',
    generico: 'assets/img/avatar-generico.svg'
  };

  /**
   * Obtiene el texto directo de un elemento hijo o cadena vacía si no existe
   */
  private static getText(parent: Element | null, tagName: string): string {
    if (!parent) return '';
    const el = parent.getElementsByTagName(tagName)[0] || 
               parent.getElementsByTagNameNS('*', tagName)[0];
    return el && el.textContent ? el.textContent.trim() : '';
  }

  /**
   * Obtiene un atributo de un elemento
   */
  private static getAttr(el: Element | null, attrName: string, defVal: string = ''): string {
    if (!el) return defVal;
    return el.getAttribute(attrName) || defVal;
  }

  /**
   * Parsea un documento XML DOM y construye el objeto SitioPersonalModel
   */
  public static parseDocument(doc: Document, opciones?: OpcionesGenerador): SitioPersonalModel {
    const root = doc.documentElement;
    const rootTag = root.localName || root.tagName.split(':').pop();
    if (rootTag !== 'sitio-personal') {
      throw new Error(`Elemento raíz inválido: esperado <sitio-personal>, recibido <${rootTag}>`);
    }

    const idioma = this.getAttr(root, 'idioma', 'es');
    const version = this.getAttr(root, 'version', '1.0');
    const id = this.getAttr(root, 'id', 'sitio-personal');

    // 1. Metadatos
    const metaEl = root.getElementsByTagName('metadatos')[0] || root.getElementsByTagNameNS('*', 'metadatos')[0];
    if (!metaEl) {
      throw new Error('Falta el bloque obligatorio <metadatos> en el documento XML.');
    }

    // Autor
    const autorEl = metaEl.getElementsByTagName('autor')[0] || metaEl.getElementsByTagNameNS('*', 'autor')[0];
    const fotoEl = autorEl ? (autorEl.getElementsByTagName('foto')[0] || autorEl.getElementsByTagNameNS('*', 'foto')[0]) : null;

    const avatar = this.getAttr(fotoEl, 'avatar', 'generico');
    const fotoSrc = PersonalSiteXMLParser.AVATARES[avatar] || (opciones?.avatarGenerico && PersonalSiteXMLParser.AVATARES[opciones.avatarGenerico]) || PersonalSiteXMLParser.AVATARES.generico;

    const autor: MetadatosAutor = {
      nombreCompleto: this.getText(autorEl, 'nombre-completo'),
      nombre: this.getText(autorEl, 'nombre'),
      apellidos: this.getText(autorEl, 'apellidos'),
      titular: this.getText(autorEl, 'titular'),
      lema: this.getText(autorEl, 'lema') || undefined,
      descripcion: this.getText(autorEl, 'descripcion'),
      palabrasClave: this.getText(autorEl, 'palabras-clave'),
      foto: {
        src: fotoSrc,
        alt: this.getAttr(fotoEl, 'alt', 'Fotografía de perfil'),
        ancho: parseInt(this.getAttr(fotoEl, 'ancho', '208'), 10),
        alto: parseInt(this.getAttr(fotoEl, 'alto', '208'), 10),
        avatar: avatar || undefined
      }
    };

    // Tema cromático opcional
    let tema: TemaColor | undefined = undefined;
    const temaEl = metaEl.getElementsByTagName('tema')[0] || metaEl.getElementsByTagNameNS('*', 'tema')[0];
    if (temaEl) {
      tema = {
        colorPrimario: this.getText(temaEl, 'color-primario') || undefined,
        colorPrimarioHover: this.getText(temaEl, 'color-primario-hover') || undefined,
        colorPrimarioClaro: this.getText(temaEl, 'color-primario-claro') || undefined,
        colorAcento: this.getText(temaEl, 'color-acento') || undefined,
        colorFondo: this.getText(temaEl, 'color-fondo') || undefined,
        colorSuperficie: this.getText(temaEl, 'color-superficie') || undefined
      };
    }

    // Contacto Info
    const cInfoEl = metaEl.getElementsByTagName('contacto-info')[0] || metaEl.getElementsByTagNameNS('*', 'contacto-info')[0];
    const contactoInfo: ContactoInfo = {
      email: this.getText(cInfoEl, 'email'),
      ubicacion: this.getText(cInfoEl, 'ubicacion'),
      empresa: this.getText(cInfoEl, 'empresa') || undefined,
      telefono: this.getText(cInfoEl, 'telefono') || undefined,
      disponibilidad: this.getText(cInfoEl, 'disponibilidad') || undefined
    };

    // Redes Sociales
    const redesSociales: RedSocial[] = [];
    const redesEl = metaEl.getElementsByTagName('redes-sociales')[0] || metaEl.getElementsByTagNameNS('*', 'redes-sociales')[0];
    if (redesEl) {
      const redNodes = redesEl.getElementsByTagName('red');
      for (let i = 0; i < redNodes.length; i++) {
        const r = redNodes[i];
        redesSociales.push({
          tipo: this.getAttr(r, 'tipo', 'web'),
          url: this.getAttr(r, 'url', '#'),
          usuario: this.getAttr(r, 'usuario', ''),
          etiqueta: this.getAttr(r, 'etiqueta', '') || undefined
        });
      }
    }

    // 2. Páginas
    const paginasEl = root.getElementsByTagName('paginas')[0] || root.getElementsByTagNameNS('*', 'paginas')[0];
    if (!paginasEl) {
      throw new Error('Falta el bloque obligatorio <paginas> en el documento XML.');
    }

    // A. Inicio
    const inicioEl = paginasEl.getElementsByTagName('inicio')[0] || paginasEl.getElementsByTagNameNS('*', 'inicio')[0];
    const heroEl = inicioEl ? (inicioEl.getElementsByTagName('hero')[0] || inicioEl.getElementsByTagNameNS('*', 'hero')[0]) : null;
    const acciones: { texto: string; href: string; tipo: 'primario' | 'secundario' }[] = [];
    if (heroEl) {
      const accNodes = heroEl.getElementsByTagName('accion');
      for (let i = 0; i < accNodes.length; i++) {
        const a = accNodes[i];
        acciones.push({
          texto: this.getAttr(a, 'texto', 'Acción'),
          href: this.getAttr(a, 'href', '#'),
          tipo: (this.getAttr(a, 'tipo', 'secundario') as 'primario' | 'secundario')
        });
      }
    }

    const datosRapidos: { valor: string; etiqueta: string }[] = [];
    const drEl = inicioEl ? (inicioEl.getElementsByTagName('datos-rapidos')[0] || inicioEl.getElementsByTagNameNS('*', 'datos-rapidos')[0]) : null;
    if (drEl) {
      const metNodes = drEl.getElementsByTagName('metrica');
      for (let i = 0; i < metNodes.length; i++) {
        const m = metNodes[i];
        datosRapidos.push({
          valor: this.getAttr(m, 'valor', ''),
          etiqueta: this.getAttr(m, 'etiqueta', '')
        });
      }
    }

    const tecDesEl = inicioEl ? (inicioEl.getElementsByTagName('tecnologias-destacadas')[0] || inicioEl.getElementsByTagNameNS('*', 'tecnologias-destacadas')[0]) : null;
    const tecItems: TecnologiaDestacada[] = [];
    if (tecDesEl) {
      const tNodes = tecDesEl.getElementsByTagName('tecnologia');
      for (let i = 0; i < tNodes.length; i++) {
        const t = tNodes[i];
        const iconoEl = t.getElementsByTagName('icono')[0] || t.getElementsByTagNameNS('*', 'icono')[0];
        tecItems.push({
          nombre: this.getText(t, 'nombre'),
          nivel: (this.getText(t, 'nivel') as any) || 'Avanzado',
          iconoSrc: iconoEl ? this.getAttr(iconoEl, 'src') : undefined,
          categoria: this.getAttr(t, 'categoria') || undefined
        });
      }
    }

    const paginaInicio: PaginaInicio = {
      hero: {
        saludo: this.getText(heroEl, 'saludo') || 'Hola, soy',
        subtitulo: this.getText(heroEl, 'subtitulo') || autor.titular,
        resumen: this.getText(heroEl, 'resumen') || autor.descripcion,
        acciones
      },
      datosRapidos,
      tecnologiasDestacadas: {
        titulo: this.getText(tecDesEl, 'titulo') || 'Tecnologías',
        descripcion: this.getText(tecDesEl, 'descripcion') || '',
        items: tecItems
      }
    };

    // B. Sobre mí
    const sobreMiEl = paginasEl.getElementsByTagName('sobre-mi')[0] || paginasEl.getElementsByTagNameNS('*', 'sobre-mi')[0];
    const cabSobreMi = sobreMiEl ? (sobreMiEl.getElementsByTagName('cabecera')[0] || sobreMiEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const trayEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('trayectoria')[0] || sobreMiEl.getElementsByTagNameNS('*', 'trayectoria')[0]) : null;
    const parrafos: string[] = [];
    if (trayEl) {
      const pNodes = trayEl.getElementsByTagName('parrafo');
      for (let i = 0; i < pNodes.length; i++) {
        parrafos.push(pNodes[i].textContent?.trim() || '');
      }
    }

    const dtEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('datos-personales')[0] || sobreMiEl.getElementsByTagNameNS('*', 'datos-personales')[0]) : null;
    const datosPersonalesList: DatoPersonal[] = [];
    if (dtEl) {
      const dNodes = dtEl.getElementsByTagName('dato');
      for (let i = 0; i < dNodes.length; i++) {
        const d = dNodes[i];
        datosPersonalesList.push({
          etiqueta: this.getAttr(d, 'etiqueta', ''),
          valor: d.textContent?.trim() || '',
          enlace: this.getAttr(d, 'enlace') || undefined
        });
      }
    }

    const interesesEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('intereses')[0] || sobreMiEl.getElementsByTagNameNS('*', 'intereses')[0]) : null;
    const interesesList: InteresAficion[] = [];
    if (interesesEl) {
      const intNodes = interesesEl.getElementsByTagName('interes');
      for (let i = 0; i < intNodes.length; i++) {
        const it = intNodes[i];
        const imgEl = it.getElementsByTagName('imagen')[0] || it.getElementsByTagNameNS('*', 'imagen')[0];
        interesesList.push({
          titulo: this.getText(it, 'titulo'),
          descripcion: this.getText(it, 'descripcion'),
          imagen: imgEl ? {
            src: this.getAttr(imgEl, 'src', ''),
            alt: this.getAttr(imgEl, 'alt', ''),
            ancho: parseInt(this.getAttr(imgEl, 'ancho', '600'), 10),
            alto: parseInt(this.getAttr(imgEl, 'alto', '450'), 10)
          } : undefined
        });
      }
    }

    const idiomasEl = sobreMiEl ? (sobreMiEl.getElementsByTagName('idiomas')[0] || sobreMiEl.getElementsByTagNameNS('*', 'idiomas')[0]) : null;
    const idiomasList: IdiomaItem[] = [];
    if (idiomasEl) {
      const idNodes = idiomasEl.getElementsByTagName('idioma-item');
      for (let i = 0; i < idNodes.length; i++) {
        const im = idNodes[i];
        idiomasList.push({
          nombre: this.getAttr(im, 'nombre', ''),
          nivel: this.getAttr(im, 'nivel', ''),
          porcentaje: im.hasAttribute('porcentaje') ? parseInt(this.getAttr(im, 'porcentaje', '100'), 10) : undefined
        });
      }
    }

    const paginaSobreMi: PaginaSobreMi = {
      cabecera: {
        titulo: this.getText(cabSobreMi, 'titulo') || 'Sobre mí',
        subtitulo: this.getText(cabSobreMi, 'subtitulo') || ''
      },
      trayectoria: {
        titulo: this.getText(trayEl, 'titulo') || 'Trayectoria e intereses',
        parrafos
      },
      datosPersonales: {
        tituloTabla: this.getText(dtEl, 'titulo-tabla') || 'Datos personales',
        datos: datosPersonalesList
      },
      intereses: {
        titulo: this.getText(interesesEl, 'titulo') || 'Intereses y Aficiones',
        items: interesesList
      },
      idiomas: idiomasList
    };

    // C. Proyectos
    const proyectosEl = paginasEl.getElementsByTagName('proyectos')[0] || paginasEl.getElementsByTagNameNS('*', 'proyectos')[0];
    const cabProy = proyectosEl ? (proyectosEl.getElementsByTagName('cabecera')[0] || proyectosEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const catFiltroEl = proyectosEl ? (proyectosEl.getElementsByTagName('categorias-filtro')[0] || proyectosEl.getElementsByTagNameNS('*', 'categorias-filtro')[0]) : null;
    const categoriasFiltro: CategoriaFiltro[] = [];
    if (catFiltroEl) {
      const cNodes = catFiltroEl.getElementsByTagName('categoria');
      for (let i = 0; i < cNodes.length; i++) {
        const c = cNodes[i];
        categoriasFiltro.push({
          id: this.getAttr(c, 'id', 'all'),
          etiqueta: this.getAttr(c, 'etiqueta', 'Todos')
        });
      }
    }

    const listaProyEl = proyectosEl ? (proyectosEl.getElementsByTagName('lista-proyectos')[0] || proyectosEl.getElementsByTagNameNS('*', 'lista-proyectos')[0]) : null;
    const proyectosList: ProyectoItem[] = [];
    if (listaProyEl) {
      const pNodes = listaProyEl.getElementsByTagName('proyecto');
      for (let i = 0; i < pNodes.length; i++) {
        const p = pNodes[i];
        const imgP = p.getElementsByTagName('imagen')[0] || p.getElementsByTagNameNS('*', 'imagen')[0];
        
        // Tags de tecnologías
        const tecNode = p.getElementsByTagName('tecnologias')[0] || p.getElementsByTagNameNS('*', 'tecnologias')[0];
        const tags: string[] = [];
        if (tecNode) {
          const tNodes = tecNode.getElementsByTagName('tag');
          for (let j = 0; j < tNodes.length; j++) {
            tags.push(tNodes[j].textContent?.trim() || '');
          }
        }

        // Enlaces
        const enlNode = p.getElementsByTagName('enlaces')[0] || p.getElementsByTagNameNS('*', 'enlaces')[0];
        const enlaces: { tipo: string; url: string; texto: string }[] = [];
        if (enlNode) {
          const eNodes = enlNode.getElementsByTagName('enlace');
          for (let j = 0; j < eNodes.length; j++) {
            const e = eNodes[j];
            enlaces.push({
              tipo: this.getAttr(e, 'tipo', 'demo'),
              url: this.getAttr(e, 'url', '#'),
              texto: this.getAttr(e, 'texto', 'Enlace')
            });
          }
        }

        proyectosList.push({
          categoria: this.getAttr(p, 'categoria', 'web'),
          estado: (this.getAttr(p, 'estado', 'completado') as any),
          destacado: this.getAttr(p, 'destacado', 'false') === 'true',
          etiquetaDestacada: this.getText(p, 'etiqueta-destacada') || undefined,
          titulo: this.getText(p, 'titulo'),
          descripcion: this.getText(p, 'descripcion'),
          imagen: imgP ? {
            src: this.getAttr(imgP, 'src', ''),
            alt: this.getAttr(imgP, 'alt', ''),
            ancho: parseInt(this.getAttr(imgP, 'ancho', '600'), 10),
            alto: parseInt(this.getAttr(imgP, 'alto', '380'), 10)
          } : undefined,
          tecnologias: tags,
          enlaces
        });
      }
    }

    const paginaProyectos: PaginaProyectos = {
      cabecera: {
        titulo: this.getText(cabProy, 'titulo') || 'Proyectos',
        subtitulo: this.getText(cabProy, 'subtitulo') || ''
      },
      categoriasFiltro,
      proyectos: proyectosList
    };

    // D. Currículum
    const cvEl = paginasEl.getElementsByTagName('curriculum')[0] || paginasEl.getElementsByTagNameNS('*', 'curriculum')[0];
    const cabCv = cvEl ? (cvEl.getElementsByTagName('cabecera')[0] || cvEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const pdfEl = cabCv ? (cabCv.getElementsByTagName('descarga-pdf')[0] || cabCv.getElementsByTagNameNS('*', 'descarga-pdf')[0]) : null;

    const expEl = cvEl ? (cvEl.getElementsByTagName('experiencia-laboral')[0] || cvEl.getElementsByTagNameNS('*', 'experiencia-laboral')[0]) : null;
    const puestosList: PuestoExperiencia[] = [];
    if (expEl) {
      const pNodes = expEl.getElementsByTagName('puesto');
      for (let i = 0; i < pNodes.length; i++) {
        const pu = pNodes[i];
        const perEl = pu.getElementsByTagName('periodo')[0] || pu.getElementsByTagNameNS('*', 'periodo')[0];
        const logrosNode = pu.getElementsByTagName('logros')[0] || pu.getElementsByTagNameNS('*', 'logros')[0];
        const logros: string[] = [];
        if (logrosNode) {
          const lNodes = logrosNode.getElementsByTagName('logro');
          for (let j = 0; j < lNodes.length; j++) {
            logros.push(lNodes[j].textContent?.trim() || '');
          }
        }

        const tecNode = pu.getElementsByTagName('tecnologias')[0] || pu.getElementsByTagNameNS('*', 'tecnologias')[0];
        const tecs: string[] = [];
        if (tecNode) {
          const tNodes = tecNode.getElementsByTagName('tag');
          for (let j = 0; j < tNodes.length; j++) {
            tecs.push(tNodes[j].textContent?.trim() || '');
          }
        }

        puestosList.push({
          cargo: this.getText(pu, 'cargo'),
          empresa: this.getText(pu, 'empresa'),
          periodo: {
            inicio: this.getAttr(perEl, 'inicio', ''),
            fin: this.getAttr(perEl, 'fin', 'Actualidad')
          },
          descripcion: this.getText(pu, 'descripcion'),
          logros,
          tecnologias: tecs
        });
      }
    }

    const formEl = cvEl ? (cvEl.getElementsByTagName('formacion-academica')[0] || cvEl.getElementsByTagNameNS('*', 'formacion-academica')[0]) : null;
    const estudiosList: EstudioFormacion[] = [];
    if (formEl) {
      const eNodes = formEl.getElementsByTagName('estudio');
      for (let i = 0; i < eNodes.length; i++) {
        const es = eNodes[i];
        const perEl = es.getElementsByTagName('periodo')[0] || es.getElementsByTagNameNS('*', 'periodo')[0];
        estudiosList.push({
          titulo: this.getText(es, 'titulo'),
          institucion: this.getText(es, 'institucion'),
          periodo: {
            inicio: this.getAttr(perEl, 'inicio', ''),
            fin: this.getAttr(perEl, 'fin', '')
          },
          descripcion: this.getText(es, 'descripcion') || undefined
        });
      }
    }

    const compEl = cvEl ? (cvEl.getElementsByTagName('competencias')[0] || cvEl.getElementsByTagNameNS('*', 'competencias')[0]) : null;
    const gruposList: GrupoCompetencias[] = [];
    if (compEl) {
      const gNodes = compEl.getElementsByTagName('grupo');
      for (let i = 0; i < gNodes.length; i++) {
        const gr = gNodes[i];
        const itNodes = gr.getElementsByTagName('item');
        const items = [];
        for (let j = 0; j < itNodes.length; j++) {
          const it = itNodes[j];
          items.push({
            nombre: this.getAttr(it, 'nombre', ''),
            nivel: it.hasAttribute('nivel') ? parseInt(this.getAttr(it, 'nivel', '80'), 10) : undefined
          });
        }
        gruposList.push({
          nombre: this.getAttr(gr, 'nombre', 'Competencias'),
          items
        });
      }
    }

    const paginaCurriculum: PaginaCurriculum = {
      cabecera: {
        titulo: this.getText(cabCv, 'titulo') || 'Currículum Vitae',
        subtitulo: this.getText(cabCv, 'subtitulo') || '',
        descargaPdf: pdfEl ? {
          url: this.getAttr(pdfEl, 'url', 'assets/cv.pdf'),
          texto: this.getAttr(pdfEl, 'texto', 'Descargar PDF')
        } : undefined
      },
      experienciaLaboral: puestosList,
      formacionAcademica: estudiosList,
      competencias: gruposList
    };

    // E. Contacto
    const contactoEl = paginasEl.getElementsByTagName('contacto')[0] || paginasEl.getElementsByTagNameNS('*', 'contacto')[0];
    const cabCont = contactoEl ? (contactoEl.getElementsByTagName('cabecera')[0] || contactoEl.getElementsByTagNameNS('*', 'cabecera')[0]) : null;
    const canalesEl = contactoEl ? (contactoEl.getElementsByTagName('canales')[0] || contactoEl.getElementsByTagNameNS('*', 'canales')[0]) : null;
    const canalesList = [];
    if (canalesEl) {
      const cNodes = canalesEl.getElementsByTagName('canal');
      for (let i = 0; i < cNodes.length; i++) {
        const c = cNodes[i];
        canalesList.push({
          tipo: this.getAttr(c, 'tipo', 'email'),
          etiqueta: this.getAttr(c, 'etiqueta', 'Email'),
          valor: this.getAttr(c, 'valor', ''),
          href: this.getAttr(c, 'href', '#')
        });
      }
    }

    const dispEl = contactoEl ? (contactoEl.getElementsByTagName('disponibilidad')[0] || contactoEl.getElementsByTagNameNS('*', 'disponibilidad')[0]) : null;
    const formContEl = contactoEl ? (contactoEl.getElementsByTagName('formulario')[0] || contactoEl.getElementsByTagNameNS('*', 'formulario')[0]) : null;

    const paginaContacto: PaginaContacto = {
      cabecera: {
        titulo: this.getText(cabCont, 'titulo') || 'Contacto',
        subtitulo: this.getText(cabCont, 'subtitulo') || ''
      },
      canales: canalesList,
      disponibilidad: dispEl ? {
        estado: this.getText(dispEl, 'estado') || 'Disponible',
        descripcion: this.getText(dispEl, 'descripcion') || ''
      } : undefined,
      formulario: formContEl ? {
        titulo: this.getText(formContEl, 'titulo') || 'Envíame un mensaje',
        descripcion: this.getText(formContEl, 'descripcion') || undefined
      } : undefined
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
}
