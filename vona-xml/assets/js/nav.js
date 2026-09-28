/**
 * nav.js — Accesibilidad de navegación y salto al contenido principal
 * Cumple con ES6+, const/let, selectores por atributos y WCAG 2.1 AA.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo accesible del enlace de salto al contenido principal sin requerir atributo id
    const enlaceSalto = document.querySelector('body > a[href="#contenido"]');
    const contenidoPrincipal = document.querySelector('body > main');

    if (enlaceSalto && contenidoPrincipal) {
      enlaceSalto.addEventListener('click', (evento) => {
        evento.preventDefault();
        contenidoPrincipal.setAttribute('tabindex', '-1');
        contenidoPrincipal.focus();
        contenidoPrincipal.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Manejo de enlaces internos de sección (ej. #carga, #mapa, #detalles) sin IDs
    const enlacesInternos = document.querySelectorAll('body > header nav[aria-label] ul li a[href^="#"]');
    for (const enlace of enlacesInternos) {
      enlace.addEventListener('click', (evento) => {
        const destinoHash = enlace.getAttribute('href');
        if (destinoHash && destinoHash.length > 1) {
          const claveSeccion = destinoHash.slice(1);
          const seccionDestino = document.querySelector(`body > main > section[data-seccion="${claveSeccion}"]`);
          if (seccionDestino) {
            evento.preventDefault();
            seccionDestino.setAttribute('tabindex', '-1');
            seccionDestino.focus();
            seccionDestino.scrollIntoView({ behavior: 'smooth' });

            // Si el menú móvil está abierto, cerrarlo
            const menuMovil = document.querySelector('body > header nav[aria-label] > ul');
            const btnMenu = document.querySelector('body > header nav[aria-label] > button[aria-expanded]');
            if (menuMovil && btnMenu && menuMovil.getAttribute('data-abierto') === 'true') {
              menuMovil.setAttribute('data-abierto', 'false');
              btnMenu.setAttribute('aria-expanded', 'false');
            }
          }
        }
      });
    }

    // 2. Control de menú accesible para navegación responsiva
    const botonMenu = document.querySelector('body > header nav[aria-label] > button[aria-expanded]');
    const listaNavegacion = document.querySelector('body > header nav[aria-label] > ul');

    if (botonMenu && listaNavegacion) {
      botonMenu.addEventListener('click', () => {
        const estaAbierto = botonMenu.getAttribute('aria-expanded') === 'true';
        const nuevoEstado = !estaAbierto;

        botonMenu.setAttribute('aria-expanded', String(nuevoEstado));
        listaNavegacion.setAttribute('data-abierto', String(nuevoEstado));

        if (!nuevoEstado) {
          botonMenu.focus();
        }
      });

      // Cerrar menú al pulsar la tecla Escape y devolver el foco al botón
      document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && botonMenu.getAttribute('aria-expanded') === 'true') {
          botonMenu.setAttribute('aria-expanded', 'false');
          listaNavegacion.setAttribute('data-abierto', 'false');
          botonMenu.focus();
        }
      });

      // Cerrar menú al hacer clic fuera del área de navegación
      document.addEventListener('click', (evento) => {
        if (!botonMenu.contains(evento.target) && !listaNavegacion.contains(evento.target)) {
          if (botonMenu.getAttribute('aria-expanded') === 'true') {
            botonMenu.setAttribute('aria-expanded', 'false');
            listaNavegacion.setAttribute('data-abierto', 'false');
          }
        }
      });
    }
  });
}());
