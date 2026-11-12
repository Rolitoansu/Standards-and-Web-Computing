(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form[action^="mailto:"]');
    if (!form) { return; }

    const es = (document.documentElement.lang || 'es').indexOf('es') === 0;
    const T  = es ? {
      requerido:  'Este campo es obligatorio.',
      email:      'Escribe una dirección de correo válida, por ejemplo nombre@dominio.com.',
      minimo:     'El mensaje debe tener al menos 20 caracteres.',
      consent:    'Debes aceptar el uso de tus datos para poder responderte.',
      errores:    'Revisa los campos marcados: hay %n error(es) en el formulario.',
      ok:         'Se ha abierto tu aplicación de correo con el mensaje preparado. Si no se abre automáticamente, escribe directamente a %e.',
      restantes:  '%n caracteres restantes.',
      asunto:     'Contacto desde la web personal'
    } : {
      requerido:  'This field is required.',
      email:      'Enter a valid email address, for example name@domain.com.',
      minimo:     'The message must be at least 20 characters long.',
      consent:    'You must agree to the use of your data so I can reply.',
      errores:    'Please review the highlighted fields: the form has %n error(s).',
      ok:         'Your email application has been opened with the message ready to send. If it does not open automatically, write directly to %e.',
      restantes:  '%n characters remaining.',
      asunto:     'Contact from personal website'
    };

    form.noValidate = true;

    const destino  = form.getAttribute('action').replace(/^mailto:/, '').split('?')[0];
    const campos   = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    const salida   = form.querySelector('output');
    const mensaje  = form.querySelector('textarea');
    const contador = document.querySelector('#contador-mensaje');

    function errorDe(campo) {
      return document.getElementById(campo.id + '-error');
    }

    function textoError(campo) {
      const v = campo.validity;
      if (campo.type === 'checkbox' && v.valueMissing) { return T.consent; }
      if (v.valueMissing) { return T.requerido; }
      if (campo.type === 'email' && v.typeMismatch) { return T.email; }
      if (v.tooShort) { return T.minimo; }
      return campo.validationMessage;
    }

    function validar(campo, mostrar) {
      const caja = errorDe(campo);
      const ok   = campo.checkValidity();
      if (ok) {
        campo.removeAttribute('aria-invalid');
        if (caja) { caja.textContent = ''; caja.removeAttribute('role'); }
      } else if (mostrar) {
        campo.setAttribute('aria-invalid', 'true');
        if (caja) { caja.textContent = textoError(campo); caja.setAttribute('role', 'alert'); }
      }
      return ok;
    }

    campos.forEach(function (campo) {
      campo.addEventListener('blur', function () { validar(campo, true); });
      campo.addEventListener('input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') { validar(campo, true); }
      });
      campo.addEventListener('change', function () { validar(campo, true); });
    });

    if (mensaje && contador) {
      const max = parseInt(mensaje.getAttribute('maxlength'), 10) || 1000;
      const actualizar = function () {
        contador.textContent = T.restantes.replace('%n', String(max - mensaje.value.length));
      };
      mensaje.addEventListener('input', actualizar);
      actualizar();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let errores = 0;
      let primero = null;

      campos.forEach(function (campo) {
        if (!validar(campo, true)) {
          errores += 1;
          if (!primero) { primero = campo; }
        }
      });

      if (errores) {
        salida.setAttribute('data-estado', 'error');
        salida.textContent = T.errores.replace('%n', String(errores));
        primero.focus();
        return;
      }

      const datos  = new FormData(form);
      const nombre = datos.get('nombre') || datos.get('name') || '';
      const correo = datos.get('correo') || datos.get('email') || '';
      const motivo = datos.get('motivo') || datos.get('reason') || '';
      const texto  = datos.get('mensaje') || datos.get('message') || '';
      const asunto = T.asunto + (motivo ? ' · ' + motivo : '') + (nombre ? ' · ' + nombre : '');
      const cuerpo = texto + '\n\n--\n' + nombre + '\n' + correo;

      salida.setAttribute('data-estado', 'ok');
      salida.textContent = T.ok.replace('%e', destino);

      window.location.href = 'mailto:' + destino +
        '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(cuerpo);
    });
  });
}());
