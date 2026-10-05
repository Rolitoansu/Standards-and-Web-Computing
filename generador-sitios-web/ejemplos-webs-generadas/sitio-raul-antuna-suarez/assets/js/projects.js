(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const botones   = document.querySelectorAll('nav[aria-label="Filtrar proyectos por categoría"] button');
    const proyectos = document.querySelectorAll('body > main > section:nth-of-type(2) > article > ul > li');

    if (!botones.length || !proyectos.length) {
      return;
    }

    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filtro = this.dataset.filter;

        botones.forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        this.setAttribute('aria-pressed', 'true');

        proyectos.forEach(function (li) {
          const art  = li.querySelector('article');
          const show = filtro === 'all' || (art && art.dataset.category === filtro);
          li.style.display = show ? '' : 'none';
        });
      });
    });
  });
}());
