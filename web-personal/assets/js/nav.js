(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('#nav-toggle');
    const menu   = document.querySelector('#nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = menu.getAttribute('data-abierto') === 'true';
        const next   = !isOpen;
        menu.setAttribute('data-abierto', String(next));
        toggle.setAttribute('aria-expanded', String(next));
        toggle.setAttribute('aria-label', next ? 'Cerrar menú' : 'Abrir menú');
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.getAttribute('data-abierto') === 'true') {
          menu.setAttribute('data-abierto', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menú');
          toggle.focus();
        }
      });

      document.addEventListener('click', function (e) {
        if (menu.getAttribute('data-abierto') === 'true' &&
            !toggle.contains(e.target) &&
            !menu.contains(e.target)) {
          menu.setAttribute('data-abierto', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menú');
        }
      });
    }

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
