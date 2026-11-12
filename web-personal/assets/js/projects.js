(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const filtros   = document.querySelector('nav[aria-label="Filtrar proyectos por categoría"], nav[aria-label="Filter projects by category"]');
    const botones   = filtros ? filtros.querySelectorAll('button') : [];
    const proyectos = document.querySelectorAll('body > main > section:nth-of-type(2) > article > ul > li');
    const aviso     = document.querySelector('#filtro-estado');
    const es        = (document.documentElement.lang || 'es').indexOf('es') === 0;

    if (!botones.length || !proyectos.length) {
      return;
    }

    function anunciar(visibles, etiqueta) {
      if (!aviso) { return; }
      if (es) {
        aviso.textContent = visibles === 1
          ? 'Mostrando 1 proyecto de la categoría ' + etiqueta + '.'
          : 'Mostrando ' + visibles + ' proyectos' + (etiqueta ? ' de la categoría ' + etiqueta : '') + '.';
      } else {
        aviso.textContent = visibles === 1
          ? 'Showing 1 project in the ' + etiqueta + ' category.'
          : 'Showing ' + visibles + ' projects' + (etiqueta ? ' in the ' + etiqueta + ' category' : '') + '.';
      }
    }

    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filtro = this.dataset.filter;
        let visibles = 0;

        botones.forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        this.setAttribute('aria-pressed', 'true');

        proyectos.forEach(function (li) {
          const art  = li.querySelector('article');
          const show = filtro === 'all' || (art && art.dataset.category === filtro);
          li.hidden = !show;
          if (show) { visibles += 1; }
        });

        anunciar(visibles, filtro === 'all' ? '' : this.textContent.trim());
      });
    });
  });
}());
