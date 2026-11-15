(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('#nav-toggle');
    const menu   = document.querySelector('#nav-menu');
    const es     = (document.documentElement.lang || 'es').indexOf('es') === 0;
    const txt    = es ? { abrir: 'Abrir menú', cerrar: 'Cerrar menú' }
                      : { abrir: 'Open menu',  cerrar: 'Close menu' };
    const ICONO_ABRIR  = '☰';
    const ICONO_CERRAR = '✕';

    function abierto() {
      return menu.getAttribute('data-abierto') === 'true';
    }

    function cerrar(devolverFoco) {
      menu.setAttribute('data-abierto', 'false');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', txt.abrir);
      toggle.textContent = ICONO_ABRIR;
      if (devolverFoco) { toggle.focus(); }
    }

    function abrir() {
      menu.setAttribute('data-abierto', 'true');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', txt.cerrar);
      toggle.textContent = ICONO_CERRAR;
    }

    if (toggle && menu) {
      toggle.setAttribute('aria-controls', 'nav-menu');

      // Botón explícito "Cerrar menú" al final del desplegable (solo visible en pantallas estrechas).
      const li     = document.createElement('li');
      const boton  = document.createElement('button');
      boton.type = 'button';
      boton.textContent = ICONO_CERRAR + ' ' + txt.cerrar;
      boton.addEventListener('click', function () { cerrar(true); });
      li.appendChild(boton);
      menu.appendChild(li);

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (abierto()) { cerrar(false); } else { abrir(); }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && abierto()) { cerrar(true); }
      });

      document.addEventListener('click', function (e) {
        if (abierto() && !toggle.contains(e.target) && !menu.contains(e.target)) {
          cerrar(false);
        }
      });

      // Al elegir un enlace el menú se cierra, también si el destino está en la misma página.
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) { cerrar(false); }
      });

      // Si se vuelve a escritorio con el menú abierto, se restaura el estado.
      window.addEventListener('resize', function () {
        if (window.innerWidth > 896 && abierto()) { cerrar(false); }
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
