(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('#nav-toggle');
    const menu   = document.querySelector('#nav-menu');
    const es     = (document.documentElement.lang || 'es').indexOf('es') === 0;
    const txt    = es ? { abrir: 'Abrir menú', cerrar: 'Cerrar menú' }
                      : { abrir: 'Open menu',  cerrar: 'Close menu' };

    function cerrar() {
      menu.setAttribute('data-abierto', 'false');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', txt.abrir);
    }

    if (toggle && menu) {
      toggle.setAttribute('aria-controls', 'nav-menu');

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = menu.getAttribute('data-abierto') === 'true';
        if (isOpen) {
          cerrar();
          return;
        }
        menu.setAttribute('data-abierto', 'true');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', txt.cerrar);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.getAttribute('data-abierto') === 'true') {
          cerrar();
          toggle.focus();
        }
      });

      document.addEventListener('click', function (e) {
        if (menu.getAttribute('data-abierto') === 'true' &&
            !toggle.contains(e.target) &&
            !menu.contains(e.target)) {
          cerrar();
        }
      });

      // Si se vuelve a escritorio con el menú abierto, se restaura el estado.
      window.addEventListener('resize', function () {
        if (window.innerWidth > 896 && menu.getAttribute('data-abierto') === 'true') {
          cerrar();
        }
      });
    }

    // Enlace "saltar al contenido": mueve el foco al <main> de forma explícita.
    const skipLink = document.querySelector('body > a:first-of-type');
    const main     = document.querySelector('body > main');
    if (skipLink && main) {
      skipLink.addEventListener('click', function (e) {
        e.preventDefault();
        main.setAttribute('tabindex', '-1');
        main.focus();
        main.scrollIntoView();
      });
    }
  });
}());
