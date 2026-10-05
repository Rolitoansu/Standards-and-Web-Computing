(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('body > header nav button');
    const menu   = document.querySelector('body > header nav ul');

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        const isOpen = menu.classList.toggle('is-open');
        menu.setAttribute('data-abierto', String(isOpen));
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && (menu.getAttribute('data-abierto') === 'true' || menu.classList.contains('is-open'))) {
          menu.setAttribute('data-abierto', 'false');
          menu.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menú');
          toggle.focus();
        }
      });

      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.setAttribute('data-abierto', 'false');
          menu.classList.remove('is-open');
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
