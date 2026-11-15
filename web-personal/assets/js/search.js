(function () {
  'use strict';

  // Buscador del sitio: trabaja sobre el índice estático generado en search-index.js
  // (variable global INDICE_BUSQUEDA). Tolera mayúsculas, acentos y pequeñas erratas,
  // reconoce variantes de una misma palabra (certificado / certificación) y sinónimos
  // (curso, diploma, credencial…) y, si no encuentra nada, siempre propone alternativas.

  document.addEventListener('DOMContentLoaded', function () {
    const form       = document.querySelector('body > main form[role="search"]');
    const entrada    = document.querySelector('#busqueda');
    const resumen    = form ? form.querySelector('output') : null;
    const lista      = document.querySelector('#resultados');
    const sinResult  = document.querySelector('#sin-resultados');
    const sugerencia = document.querySelector('#sugerencia');
    const lang       = (document.documentElement.lang || 'es').slice(0, 2);
    const es         = lang === 'es';
    const indice     = (window.INDICE_BUSQUEDA || []).filter(function (e) { return e.l === lang; });

    if (!form || !entrada || !lista) { return; }

    const T = es ? {
      vacio:     'Escribe al menos 2 caracteres para buscar.',
      uno:       '1 resultado para «%q».',
      varios:    '%n resultados para «%q».',
      ninguno:   'No se han encontrado resultados exactos para «%q».',
      tambien:   'Se incluyen también resultados para: %v.',
      quisiste:  '¿Quisiste decir',
      titulo:    'Buscar: %q — Raúl Antuña'
    } : {
      vacio:     'Type at least 2 characters to search.',
      uno:       '1 result for “%q”.',
      varios:    '%n results for “%q”.',
      ninguno:   'No exact results found for “%q”.',
      tambien:   'Also showing results for: %v.',
      quisiste:  'Did you mean',
      titulo:    'Search: %q — Raúl Antuña'
    };

    // Grupos de sinónimos (ya normalizados: minúsculas y sin acentos).
    const SINONIMOS = (es ? [
      ['certificado', 'certificacion', 'certificaciones', 'certificados', 'credencial', 'diploma', 'titulo', 'curso', 'cursos', 'insignia', 'acreditacion'],
      ['cv', 'curriculum', 'curriculo'],
      ['trabajo', 'empleo', 'experiencia', 'empresa', 'laboral', 'puesto', 'hiberus'],
      ['estudios', 'formacion', 'universidad', 'grado', 'master', 'carrera', 'titulacion'],
      ['contacto', 'correo', 'email', 'mail', 'escribir', 'contactar'],
      ['aficiones', 'hobbies', 'intereses', 'gustos', 'ocio', 'tiempo libre'],
      ['f1', 'formula'],
      ['fotos', 'galeria', 'imagenes', 'fotografias'],
      ['idiomas', 'ingles', 'lenguas'],
      ['habilidades', 'tecnologias', 'competencias', 'conocimientos', 'skills', 'aptitudes'],
      ['proyectos', 'portfolio', 'portafolio', 'trabajos'],
      ['referencias', 'recomendaciones', 'avales', 'testimonios'],
      ['mapa', 'indice', 'paginas']
    ] : [
      ['certificate', 'certificates', 'certification', 'certifications', 'certified', 'credential', 'diploma', 'course', 'courses', 'badge'],
      ['cv', 'resume', 'curriculum'],
      ['job', 'work', 'experience', 'employment', 'company', 'hiberus'],
      ['studies', 'education', 'degree', 'university', 'masters', 'school'],
      ['contact', 'email', 'mail', 'write'],
      ['hobbies', 'hobby', 'interests', 'free time'],
      ['f1', 'formula'],
      ['photos', 'gallery', 'pictures', 'images'],
      ['languages', 'english', 'spanish'],
      ['skills', 'technologies', 'tech', 'stack', 'abilities'],
      ['projects', 'portfolio'],
      ['references', 'recommendations', 'testimonials'],
      ['map', 'sitemap', 'pages']
    ]);

    function normalizar(s) {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function palabras(s) {
      return normalizar(s).split(' ').filter(function (p) { return p.length > 1; });
    }

    function levenshtein(a, b) {
      if (a === b) { return 0; }
      if (!a.length) { return b.length; }
      if (!b.length) { return a.length; }
      let prev = [];
      let cur  = [];
      let i, j;
      for (j = 0; j <= b.length; j++) { prev[j] = j; }
      for (i = 1; i <= a.length; i++) {
        cur = [i];
        for (j = 1; j <= b.length; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
      }
      return prev[b.length];
    }

    function tolerancia(t) {
      return t.length >= 8 ? 2 : (t.length >= 5 ? 1 : 0);
    }

    // Dos palabras son variantes de la misma raíz si comparten un prefijo largo
    // (certificado / certificacion / certificaciones, proyecto / proyectos…).
    function prefijoComun(a, b) {
      const n = Math.min(a.length, b.length);
      let i = 0;
      while (i < n && a[i] === b[i]) { i++; }
      return i;
    }

    function variante(a, b) {
      if (a === b) { return false; }
      const p = prefijoComun(a, b);
      return p >= 5 && p >= 0.7 * Math.min(a.length, b.length);
    }

    // Preprocesado del índice: textos normalizados y vocabulario.
    const vocabulario = {};
    indice.forEach(function (e) {
      e._t = normalizar(e.t);
      e._k = normalizar(e.k);
      e._b = normalizar(e.b);
      e._tw = palabras(e.t);
      e._kw = palabras(e.k);
      e._bw = palabras(e.b);
      e._p = e._tw.concat(e._kw, e._bw);
      e._p.forEach(function (p) { vocabulario[p] = (vocabulario[p] || 0) + 1; });
    });
    const listaVocab = Object.keys(vocabulario);

    function escapar(t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function aproximado(lista, tok, tol) {
      for (let i = 0; i < lista.length; i++) {
        const p = lista[i];
        if (Math.abs(p.length - tok.length) <= tol && levenshtein(p, tok) <= tol) { return true; }
      }
      return false;
    }

    // Términos alternativos de un término de búsqueda: variantes de la misma palabra
    // presentes en el sitio y sinónimos de su grupo (y las variantes de estos).
    function alternativas(tok) {
      const variantes = listaVocab.filter(function (p) { return variante(tok, p); });
      const sinonimos = [];
      SINONIMOS.forEach(function (grupo) {
        const pertenece = grupo.some(function (g) { return g === tok || variante(g, tok); });
        if (!pertenece) { return; }
        grupo.forEach(function (g) {
          if (g !== tok && sinonimos.indexOf(g) === -1 && variantes.indexOf(g) === -1) { sinonimos.push(g); }
        });
      });
      return { variantes: variantes, sinonimos: sinonimos };
    }

    // Puntuación de un único término (frase normalizada) en una entrada.
    function puntuarTermino(e, tok) {
      let s = 0;
      const entera = new RegExp('(^|\\s)' + escapar(tok) + '(\\s|$)');
      if (e._t.indexOf(tok) !== -1) { s += 6; if (entera.test(e._t)) { s += 4; } }
      if (e._k.indexOf(tok) !== -1) { s += 3; }
      if (e._b.indexOf(tok) !== -1) {
        const veces = e._b.split(tok).length - 1;
        s += Math.min(veces, 4);
        if (entera.test(e._b)) { s += 2; }
      }
      return s;
    }

    function puntuar(e, consulta) {
      let total = 0;
      let encontrados = 0;
      consulta.forEach(function (c) {
        // Se queda con la mejor de: término exacto, variante (85 %) o sinónimo (60 %).
        let s = puntuarTermino(e, c.tok);
        c.alt.variantes.forEach(function (v) { s = Math.max(s, puntuarTermino(e, v) * 0.85); });
        c.alt.sinonimos.forEach(function (v) { s = Math.max(s, puntuarTermino(e, v) * 0.6); });
        if (!s) {
          // Coincidencia aproximada (erratas): vale más en el título que en el cuerpo o las palabras clave.
          const tol = tolerancia(c.tok);
          if (tol) {
            if (aproximado(e._tw, c.tok, tol)) { s += 5; }
            else if (aproximado(e._bw, c.tok, tol)) { s += 3; }
            else if (aproximado(e._kw, c.tok, tol)) { s += 1; }
          }
        }
        if (s) { encontrados += 1; }
        total += s;
      });
      // Bonificación cuando aparecen todos los términos.
      if (consulta.length > 1 && encontrados === consulta.length) { total += 5; }
      return encontrados ? total : 0;
    }

    function fragmento(texto, terminos) {
      const norm = normalizar(texto);
      let pos = -1;
      for (let i = 0; i < terminos.length; i++) {
        pos = norm.indexOf(terminos[i]);
        if (pos !== -1) { break; }
      }
      const ancho = 160;
      let ini = pos === -1 ? 0 : Math.max(0, pos - 60);
      let fin = Math.min(texto.length, ini + ancho);
      if (ini > 0) { ini = texto.lastIndexOf(' ', ini) + 1; }
      if (fin < texto.length) { fin = texto.lastIndexOf(' ', fin); }
      return (ini > 0 ? '… ' : '') + texto.slice(ini, fin) + (fin < texto.length ? ' …' : '');
    }

    function resaltar(contenedor, texto, terminos) {
      // Construye nodos de texto y <mark> sin usar innerHTML.
      const orden = terminos.slice().sort(function (a, b) { return b.length - a.length; });
      const re = new RegExp('(' + orden.map(escapar).join('|') + ')', 'gi');
      const limpio = texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
      // Si la normalización cambia la longitud (caracteres combinados), no se resalta para no desalinear.
      if (limpio.length !== texto.length) {
        contenedor.appendChild(document.createTextNode(texto));
        return;
      }
      let ultimo = 0;
      let m;
      while ((m = re.exec(limpio)) !== null) {
        if (m.index > ultimo) {
          contenedor.appendChild(document.createTextNode(texto.slice(ultimo, m.index)));
        }
        const mark = document.createElement('mark');
        mark.textContent = texto.slice(m.index, m.index + m[0].length);
        contenedor.appendChild(mark);
        ultimo = m.index + m[0].length;
        if (!m[0].length) { re.lastIndex++; }
      }
      if (ultimo < texto.length) {
        contenedor.appendChild(document.createTextNode(texto.slice(ultimo)));
      }
    }

    function sugerir(tokens) {
      // Para cada término sin coincidencias exactas busca la palabra más cercana del vocabulario.
      const corregidos = tokens.map(function (tok) {
        if (vocabulario[tok]) { return tok; }
        let mejor = null;
        let mejorD = 3;
        for (let i = 0; i < listaVocab.length; i++) {
          const p = listaVocab[i];
          if (Math.abs(p.length - tok.length) > 2) { continue; }
          const d = levenshtein(p, tok);
          if (d < mejorD || (d === mejorD && mejor && vocabulario[p] > vocabulario[mejor])) {
            mejorD = d;
            mejor = p;
          }
        }
        return mejor || tok;
      });
      const frase = corregidos.join(' ');
      return frase !== tokens.join(' ') ? frase : null;
    }

    function pintarSugerencia(alt) {
      sugerencia.appendChild(document.createTextNode(T.quisiste + ' '));
      const a = document.createElement('a');
      a.href = '?q=' + encodeURIComponent(alt);
      a.textContent = alt;
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        entrada.value = alt;
        history.replaceState(null, '', a.href);
        pintar(alt);
        entrada.focus();
      });
      sugerencia.appendChild(a);
      sugerencia.appendChild(document.createTextNode('?'));
    }

    function pintar(consulta) {
      const tokens = palabras(consulta);
      lista.textContent = '';
      if (sugerencia) { sugerencia.textContent = ''; }

      if (normalizar(consulta).length < 2) {
        resumen.textContent = T.vacio;
        sinResult.hidden = true;
        return;
      }

      const frase = normalizar(consulta);
      const consultaAmpliada = tokens.map(function (tok) { return { tok: tok, alt: alternativas(tok) }; });
      // Las frases de varias palabras que coinciden con un sinónimo compuesto («tiempo libre») también cuentan.
      if (tokens.length > 1) {
        SINONIMOS.forEach(function (grupo) {
          if (grupo.indexOf(frase) !== -1) {
            consultaAmpliada.push({ tok: frase, alt: { variantes: [], sinonimos: grupo.filter(function (g) { return g !== frase; }) } });
          }
        });
      }

      const resultados = indice
        .map(function (e) { return { e: e, s: puntuar(e, consultaAmpliada) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; });
      // Se descartan los resultados muy poco relevantes frente al mejor (menos del 20 % de su puntuación).
      if (resultados.length) {
        const corte = resultados[0].s * 0.2;
        while (resultados.length > 1 && resultados[resultados.length - 1].s < corte) { resultados.pop(); }
      }

      document.title = T.titulo.replace('%q', consulta);

      // Términos que se resaltan: los escritos y las alternativas que aparecen en el sitio.
      const terminos = tokens.slice();
      const usados = [];
      consultaAmpliada.forEach(function (c) {
        c.alt.variantes.concat(c.alt.sinonimos).forEach(function (v) {
          const existe = vocabulario[v] || indice.some(function (e) { return e._b.indexOf(v) !== -1; });
          if (existe && terminos.indexOf(v) === -1) { terminos.push(v); usados.push(v); }
        });
      });

      if (!resultados.length) {
        // Nunca se deja al usuario sin opciones: corrección sugerida y enlaces a las secciones principales.
        resumen.textContent = T.ninguno.replace('%q', consulta);
        sinResult.hidden = false;
        const alt = sugerir(tokens);
        if (alt && sugerencia) { pintarSugerencia(alt); }
        return;
      }

      sinResult.hidden = true;
      let texto = (resultados.length === 1 ? T.uno : T.varios)
        .replace('%n', String(resultados.length))
        .replace('%q', consulta);
      const exactos = resultados.some(function (r) {
        return tokens.some(function (t) { return r.e._t.indexOf(t) !== -1 || r.e._b.indexOf(t) !== -1; });
      });
      if (usados.length && !exactos) {
        texto += ' ' + T.tambien.replace('%v', usados.slice(0, 4).join(', '));
      }
      resumen.textContent = texto;

      resultados.forEach(function (r) {
        const li   = document.createElement('li');
        const pag  = document.createElement('p');
        const h2   = document.createElement('h2');
        const a    = document.createElement('a');
        const frag = document.createElement('p');

        pag.textContent = r.e.p;
        a.href = r.e.u;
        resaltar(a, r.e.t, terminos);
        h2.appendChild(a);
        resaltar(frag, fragmento(r.e.b, terminos), terminos);

        li.appendChild(pag);
        li.appendChild(h2);
        li.appendChild(frag);
        lista.appendChild(li);
      });
    }

    // Consulta inicial desde la URL (?q=...)
    const params = new URLSearchParams(window.location.search);
    const inicial = params.get('q') || '';
    if (inicial) {
      entrada.value = inicial;
    }
    pintar(inicial);

    // Búsqueda en vivo mientras se escribe, sin recargar.
    let temporizador = null;
    entrada.addEventListener('input', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        const q = entrada.value;
        history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : window.location.pathname);
        pintar(q);
      }, 180);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(temporizador);
      const q = entrada.value;
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : window.location.pathname);
      pintar(q);
    });
  });
}());
