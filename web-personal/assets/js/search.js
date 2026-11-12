(function () {
  'use strict';

  // Buscador del sitio: trabaja sobre el índice estático generado en search-index.js
  // (variable global INDICE_BUSQUEDA). Tolera mayúsculas, acentos y pequeñas erratas.

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
      ninguno:   'No se han encontrado resultados para «%q».',
      quisiste:  '¿Quisiste decir',
      titulo:    'Buscar: %q — Raúl Antuña'
    } : {
      vacio:     'Type at least 2 characters to search.',
      uno:       '1 result for “%q”.',
      varios:    '%n results for “%q”.',
      ninguno:   'No results found for “%q”.',
      quisiste:  'Did you mean',
      titulo:    'Search: %q — Raúl Antuña'
    };

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
    const listaVocab = Object.keys(vocabulario);

    function puntuar(entrada, tokens) {
      let total = 0;
      let encontrados = 0;
      tokens.forEach(function (tok) {
        let s = 0;
        const entera = new RegExp('(^|\\s)' + escapar(tok) + '(\\s|$)');
        // Coincidencia exacta (como subcadena) y bonificación si es palabra completa.
        if (entrada._t.indexOf(tok) !== -1) { s += 6; if (entera.test(entrada._t)) { s += 4; } }
        if (entrada._k.indexOf(tok) !== -1) { s += 3; }
        if (entrada._b.indexOf(tok) !== -1) {
          const veces = entrada._b.split(tok).length - 1;
          s += Math.min(veces, 4);
          if (entera.test(entrada._b)) { s += 2; }
        }
        if (!s) {
          // Coincidencia aproximada (erratas): vale más en el título que en el cuerpo o las palabras clave.
          const tol = tolerancia(tok);
          if (tol) {
            if (aproximado(entrada._tw, tok, tol)) { s += 5; }
            else if (aproximado(entrada._bw, tok, tol)) { s += 3; }
            else if (aproximado(entrada._kw, tok, tol)) { s += 1; }
          }
        }
        if (s) { encontrados += 1; }
        total += s;
      });
      // Bonificación cuando aparecen todos los términos.
      if (tokens.length > 1 && encontrados === tokens.length) { total += 5; }
      return encontrados ? total : 0;
    }

    function fragmento(texto, tokens) {
      const norm = normalizar(texto);
      let pos = -1;
      for (let i = 0; i < tokens.length; i++) {
        pos = norm.indexOf(tokens[i]);
        if (pos !== -1) { break; }
      }
      // El texto normalizado conserva la longitud salvo por caracteres eliminados,
      // así que usamos la posición como aproximación y recortamos en palabras.
      const ancho = 160;
      let ini = pos === -1 ? 0 : Math.max(0, pos - 60);
      let fin = Math.min(texto.length, ini + ancho);
      if (ini > 0) { ini = texto.lastIndexOf(' ', ini) + 1; }
      if (fin < texto.length) { fin = texto.lastIndexOf(' ', fin); }
      return (ini > 0 ? '… ' : '') + texto.slice(ini, fin) + (fin < texto.length ? ' …' : '');
    }

    function resaltar(contenedor, texto, tokens) {
      // Construye nodos de texto y <mark> sin usar innerHTML.
      const re = new RegExp('(' + tokens.map(escapar).join('|') + ')', 'gi');
      const limpio = texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
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

    function pintar(consulta) {
      const tokens = palabras(consulta);
      lista.textContent = '';
      if (sugerencia) { sugerencia.textContent = ''; }

      if (normalizar(consulta).length < 2) {
        resumen.textContent = T.vacio;
        sinResult.hidden = true;
        return;
      }

      const resultados = indice
        .map(function (e) { return { e: e, s: puntuar(e, tokens) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; });

      document.title = T.titulo.replace('%q', consulta);

      if (!resultados.length) {
        resumen.textContent = T.ninguno.replace('%q', consulta);
        sinResult.hidden = false;
        const alt = sugerir(tokens);
        if (alt && sugerencia) {
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
        return;
      }

      sinResult.hidden = true;
      resumen.textContent = (resultados.length === 1 ? T.uno : T.varios)
        .replace('%n', String(resultados.length))
        .replace('%q', consulta);

      resultados.forEach(function (r) {
        const li   = document.createElement('li');
        const pag  = document.createElement('p');
        const h2   = document.createElement('h2');
        const a    = document.createElement('a');
        const frag = document.createElement('p');

        pag.textContent = r.e.p;
        a.href = r.e.u;
        resaltar(a, r.e.t, tokens);
        h2.appendChild(a);
        resaltar(frag, fragmento(r.e.b, tokens), tokens);

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
