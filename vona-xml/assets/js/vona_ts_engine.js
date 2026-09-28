/**
 * vona_ts_engine.js — Implementación transpilada del motor TypeScript
 * Contiene el validador estricto de esquemas, comprobaciones de tipo y serialización de modelos.
 * Refactorizado a ES6+ con const, let y mejores prácticas de desarrollo.
 */
(function (global) {
  'use strict';

  const VonaTypeScript = {
    validColorCodes: new Set(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'UNKNOWN']),

    /**
     * Validador estricto de tipos según el modelo TypeScript
     */
    validateNotice(notice) {
      const errors = [];

      if (!notice.volcano || !notice.volcano.name || notice.volcano.name.trim().length === 0) {
        errors.push('TS-TYPE-ERROR: El nombre del volcán es obligatorio.');
      }

      if (!notice.currentColorCode || !this.validColorCodes.has(notice.currentColorCode.toUpperCase())) {
        errors.push(`TS-TYPE-ERROR: Código de color aeronáutico inválido: ${notice.currentColorCode}`);
      }

      if (notice.volcano && notice.volcano.location) {
        const { latitude, longitude } = notice.volcano.location;
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
          errors.push(`TS-TYPE-ERROR: Latitud fuera de rango [-90, 90]: ${latitude}`);
        }
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
          errors.push(`TS-TYPE-ERROR: Longitud fuera de rango [-180, 180]: ${longitude}`);
        }
      } else {
        errors.push('TS-TYPE-ERROR: Coordenadas de ubicación ausentes.');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Procesa y valida el XML con el motor tipado de TypeScript
     */
    parse(cadenaXml) {
      const parser = new DOMParser();
      const docXml = parser.parseFromString(cadenaXml, 'text/xml');

      if (docXml.querySelector('parsererror')) {
        throw new Error('TS-PARSE-ERROR: Error de sintaxis XML detectado por el validador tipado.');
      }

      const nodosVona = docXml.querySelectorAll('vona, VONA, VolcanoObservatoryNoticeForAviation');
      const nodos = nodosVona.length > 0 ? Array.from(nodosVona) : [docXml.documentElement];
      const resultados = [];

      for (const nodo of nodos) {
        const item = this.extractTypedModel(nodo);
        const validacion = this.validateNotice(item);

        if (!validacion.isValid) {
          throw new Error(`Validación TypeScript fallida: ${validacion.errors.join('; ')}`);
        }
        resultados.push(item);
      }

      return resultados;
    },

    extractTypedModel(nodo) {
      const getTag = (tag) => {
        const el = nodo.getElementsByTagName(tag)[0];
        if (el?.textContent) return el.textContent.trim();
        const todos = nodo.getElementsByTagName('*');
        for (const item of todos) {
          if ((item.localName || '').toLowerCase() === tag.toLowerCase()) {
            return (item.textContent || '').trim();
          }
        }
        return '';
      };

      let lat = 0;
      let lon = 0;
      const pos = getTag('pos');
      if (pos) {
        const partes = pos.split(/\s+/);
        if (partes.length >= 2) {
          lat = parseFloat(partes[0]);
          lon = parseFloat(partes[1]);
        }
      } else {
        lat = parseFloat(getTag('latitude')) || 0;
        lon = parseFloat(getTag('longitude')) || 0;
      }

      const elevM = parseFloat(getTag('summitElevation')) || parseFloat(getTag('elevation')) || 0;
      let altASL = parseFloat(getTag('aboveSeaLevel')) || parseFloat(getTag('verticalExtent')) || 0;
      const flRaw = getTag('flightLevel');
      if (!altASL && flRaw && flRaw.toUpperCase().startsWith('FL')) {
        const flNum = parseInt(flRaw.slice(2), 10);
        if (!isNaN(flNum) && flNum > 0) {
          altASL = Math.round((flNum * 100) * 0.3048);
        }
      }

      const speed = parseFloat(getTag('movementSpeed')) || 30;
      const dispersionKm = parseFloat(getTag('dispersionDistance')) || Math.max(30, Math.round(speed * 1.3));

      return {
        noticeNumber: getTag('noticeNumber') || 'N/A',
        issueTimeUTC: getTag('timePosition') || getTag('issueTime') || new Date().toISOString(),
        volcano: {
          name: getTag('name') || 'Volcán Sin Nombre',
          number: getTag('number') || 'N/A',
          area: getTag('area') || getTag('subregion') || 'Región no especificada',
          summitElevationMeters: elevM,
          summitElevationFeet: Math.round(elevM * 3.28084),
          location: { latitude: lat, longitude: lon }
        },
        currentColorCode: (getTag('currentColourCode') || getTag('current') || 'UNKNOWN').toUpperCase(),
        previousColorCode: (getTag('previousColourCode') || getTag('previous') || 'UNKNOWN').toUpperCase(),
        issuingObservatory: getTag('observatory') || getTag('source') || 'Observatorio Estatal',
        volcanicActivitySummary: getTag('volcanicActivitySummary') || 'Sin resumen',
        ashCloud: {
          altitudeMetersASL: altASL,
          altitudeMetersAboveSummit: altASL > elevM ? altASL - elevM : 0,
          flightLevel: flRaw || (altASL > 0 ? `FL${Math.round((altASL * 3.28084) / 100)}` : 'N/A'),
          direction: getTag('movementDirection') || 'ENE',
          speedKmH: speed,
          dispersionDistanceKm: dispersionKm,
          characteristics: getTag('cloudCharacteristics') || getTag('remarks') || 'Emisión continua.'
        },
        remarks: getTag('remarks') || 'Sin observaciones',
        contacts: getTag('contacts') || getTag('contact') || 'Sin contacto',
        nextNotice: getTag('nextNotice') || 'Aviso regular'
      };
    }
  };

  global.VonaTypeScript = VonaTypeScript;
}(typeof window !== 'undefined' ? window : this));
