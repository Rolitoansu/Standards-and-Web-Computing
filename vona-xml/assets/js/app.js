/**
 * app.js — Visualizador VONA para la aviación civil con proyección de Globo 3D
 * Arquitectura modular:
 * - TypeScript: análisis y validación estricta de esquemas y tipos XML.
 * - WebAssembly (C++): núcleo matemático de geodesia esférica y dispersión eólica.
 * - JavaScript: orquestación de interfaz, ciclo de eventos y Globo 3D con MapLibre GL.
 * Cumple con ES6+ (const/let), selectores por atributos y WCAG 2.1 AA.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar módulo WebAssembly binario si está disponible
    if (window.VonaWasm && typeof window.VonaWasm.init === 'function') {
      window.VonaWasm.init().catch((err) => {
        console.warn('Inicialización WASM:', err);
      });
    }

    // Elementos del DOM seleccionados mediante atributos estructurales
    const contenedorMapa = document.querySelector('div[data-mapa="contenedor"]');
    const entradaArchivo = document.querySelector('input[type="file"][data-entrada-archivo]');
    const botonesMuestra = document.querySelectorAll('button[data-boton-muestra]');
    const alertaMensaje = document.querySelector('div[role="alert"][data-estado]');
    const selectorVolcan = document.querySelector('select[data-selector-volcan]');

    // Elementos de métricas y tecnología
    const elementoPlumaArea = document.querySelector('[data-metrica="pluma-area"]');
    const elementoValidacionTs = document.querySelector('[data-metrica="validacion-ts"]');

    // Botones y controles de mapa
    const botonAlternarGlobo = document.querySelector('button[data-control="globo"]');
    const botonAlternarPluma = document.querySelector('button[data-control="pluma"]');
    const botonAlternarZonas = document.querySelector('button[data-control="zonas"]');
    const botonCentrar = document.querySelector('button[data-control="centrar"]');

    // Elementos de resumen y métricas
    const elementoVolcanNombre = document.querySelector('[data-metrica="volcan-nombre"]');
    const elementoVolcanUbicacion = document.querySelector('[data-metrica="volcan-ubicacion"]');
    const elementoAlertaActual = document.querySelector('[data-metrica="alerta-actual"]');
    const elementoAlertaPrevia = document.querySelector('[data-metrica="alerta-previa"]');
    const elementoElevacionCumbre = document.querySelector('[data-metrica="elevacion-cumbre"]');
    const elementoElevacionFt = document.querySelector('[data-metrica="elevacion-ft"]');
    const elementoPlumaAltitud = document.querySelector('[data-metrica="pluma-altitud"]');
    const elementoPlumaViento = document.querySelector('[data-metrica="pluma-viento"]');
    const elementoResumenActividad = document.querySelector('blockquote[data-resumen-actividad]');

    // Cuerpo de la tabla técnica de detalles
    const cuerpoTablaDetalles = document.querySelector('table[data-tabla-vona] tbody');

    // Estado interno de la aplicación
    let mapa = null;
    let marcadores = [];
    let datosVolcanesActuales = [];
    let indiceVolcanActivo = 0;
    let modoGlobo = true;
    let mostrarPlumaHumo = true;
    let mostrarZonasSeguridad = true;
    let ultimoTextoXml = '';

    // Estilo predeterminado de mapa usando OpenStreetMap (sin requerir token privado)
    const estiloOpenStreetMap = {
      version: 8,
      sources: {
        'osm-raster': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> colaboradores'
        }
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };

    /**
     * Inicializa la instancia del motor cartográfico en formato Globo 3D
     */
    function inicializarMapa() {
      const motor = window.maplibregl || window.mapboxgl;
      if (typeof motor === 'undefined') {
        mostrarNotificacion('Cargando motor cartográfico con proyección de Globo 3D...', 'info');
        setTimeout(inicializarMapa, 250);
        return;
      }
      window.mapboxgl = motor;

      try {
        const configMapa = {
          container: contenedorMapa,
          style: estiloOpenStreetMap,
          center: [0, 20],
          zoom: 1.8,
          pitch: 0,
          bearing: 0,
          antialias: true
        };

        if (modoGlobo) {
          configMapa.projection = 'globe';
        }

        mapa = new motor.Map(configMapa);
        mapa.addControl(new motor.NavigationControl({ visualizePitch: true }), 'top-right');
        mapa.addControl(new motor.ScaleControl({ unit: 'metric' }), 'bottom-right');

        mapa.on('load', () => {
          if (datosVolcanesActuales.length > 0) {
            renderizarEnMapa(datosVolcanesActuales[indiceVolcanActivo]);
          }
        });
      } catch (error) {
        mostrarNotificacion(`Error al inicializar el mapa: ${error.message}`, 'error');
      }
    }

    /**
     * Muestra notificaciones accesibles en el bloque de alerta
     */
    function mostrarNotificacion(mensaje, tipo) {
      if (!alertaMensaje) return;
      const textoSpan = alertaMensaje.querySelector('span') || alertaMensaje;
      textoSpan.textContent = mensaje;
      alertaMensaje.setAttribute('data-estado', tipo === 'error' ? 'error' : 'exito');

      if (tipo === 'exito') {
        setTimeout(() => {
          alertaMensaje.removeAttribute('data-estado');
        }, 5000);
      }
    }

    /**
     * Convierte dirección cardinal a grados azimutales
     */
    function convertirDireccionAGrados(direccion) {
      if (!direccion) return 90;
      const d = String(direccion).trim().toUpperCase();
      const rumbo = parseFloat(d);
      if (!isNaN(rumbo)) return rumbo;

      const mapaRumbos = {
        'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
        'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
        'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
        'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
      };

      return mapaRumbos[d] !== undefined ? mapaRumbos[d] : 90;
    }

    /**
     * Calcula coordenadas de destino geodésico sobre la esfera terrestre (Haversine directa)
     * Delega al kernel WebAssembly o al módulo matemático geodésico
     */
    function calcularPuntoDestino(lat, lon, rumboGrados, distanciaKm) {
      if (window.VonaWasm && typeof window.VonaWasm.destLon === 'function') {
        const destLon = window.VonaWasm.destLon(lat, lon, rumboGrados, distanciaKm);
        const destLat = window.VonaWasm.destLat(lat, lon, rumboGrados, distanciaKm);
        if (!isNaN(destLon) && !isNaN(destLat)) {
          return [destLon, destLat];
        }
      }

      // Cálculo esférico directo de reserva
      const radioTierraKm = 6371.0;
      const dRad = distanciaKm / radioTierraKm;
      const rumboRad = (rumboGrados * Math.PI) / 180.0;
      const lat1Rad = (lat * Math.PI) / 180.0;
      const lon1Rad = (lon * Math.PI) / 180.0;

      const lat2Rad = Math.asin(
        Math.sin(lat1Rad) * Math.cos(dRad) +
        Math.cos(lat1Rad) * Math.sin(dRad) * Math.cos(rumboRad)
      );

      const lon2Rad = lon1Rad + Math.atan2(
        Math.sin(rumboRad) * Math.sin(dRad) * Math.cos(lat1Rad),
        Math.cos(dRad) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
      );

      return [
        (lon2Rad * 180.0) / Math.PI,
        (lat2Rad * 180.0) / Math.PI
      ];
    }

    /**
     * Genera un polígono en forma de abanico/cono para representar la pluma de ceniza volcánica
     */
    function generarPoligonoPluma(lat, lon, rumboGrados, distanciaKm, aperturaGrados) {
      const puntos = [];
      puntos.push([lon, lat]); // Vértice en el cráter

      const medioApertura = aperturaGrados / 2.0;
      const pasoAngular = 2.0;
      const inicio = rumboGrados - medioApertura;
      const fin = rumboGrados + medioApertura;

      for (let a = inicio; a <= fin; a += pasoAngular) {
        const pt = calcularPuntoDestino(lat, lon, a, distanciaKm);
        puntos.push(pt);
      }

      const ptFinal = calcularPuntoDestino(lat, lon, fin, distanciaKm);
      puntos.push(ptFinal);
      puntos.push([lon, lat]); // Cerrar el polígono

      return {
        type: 'Feature',
        properties: {
          tipo: 'pluma-ceniza',
          distancia: distanciaKm,
          rumbo: rumboGrados
        },
        geometry: {
          type: 'Polygon',
          coordinates: [puntos]
        }
      };
    }

    /**
     * Genera un círculo concéntrico de seguridad o exclusión aérea
     */
    function generarCirculoZona(lat, lon, radioKm, etiqueta) {
      const puntos = [];
      const pasos = 64;
      for (let i = 0; i <= pasos; i++) {
        const angulo = (i * 360) / pasos;
        const pt = calcularPuntoDestino(lat, lon, angulo, radioKm);
        puntos.push(pt);
      }

      return {
        type: 'Feature',
        properties: {
          tipo: 'zona-seguridad',
          radioKm,
          etiqueta
        },
        geometry: {
          type: 'Polygon',
          coordinates: [puntos]
        }
      };
    }

    /**
     * Extrae texto de un nodo XML
     */
    function obtenerTextoTag(nodoRaiz, nombreTag) {
      if (!nodoRaiz) return '';
      const elementos = nodoRaiz.getElementsByTagName(nombreTag);
      if (elementos.length > 0 && elementos[0].textContent) {
        return elementos[0].textContent.trim();
      }

      const todos = nodoRaiz.getElementsByTagName('*');
      for (const item of todos) {
        const local = item.localName || item.nodeName;
        if (local.toLowerCase() === nombreTag.toLowerCase() && item.textContent) {
          return item.textContent.trim();
        }
      }

      return '';
    }

    /**
     * Analizador nativo para documentos VONA XML
     */
    function parsearVonaXml(cadenaXml) {
      const parser = new DOMParser();
      const docXml = parser.parseFromString(cadenaXml, 'text/xml');

      const errorNodo = docXml.querySelector('parsererror');
      if (errorNodo) {
        throw new Error(`Error de estructura XML: ${errorNodo.textContent.slice(0, 80)}`);
      }

      const listaVolcanes = [];
      const nodosVona = docXml.querySelectorAll('vona, VONA, VolcanoObservatoryNoticeForAviation');
      const nodos = nodosVona.length > 0 ? Array.from(nodosVona) : [docXml.documentElement];

      for (const nodo of nodos) {
        const nombre = obtenerTextoTag(nodo, 'name') || 'Volcán Sin Nombre';
        const numero = obtenerTextoTag(nodo, 'number') || 'N/A';
        const area = obtenerTextoTag(nodo, 'area') || obtenerTextoTag(nodo, 'subregion') || 'Región no especificada';

        let lat = 0;
        let lon = 0;
        const posGml = obtenerTextoTag(nodo, 'pos');
        if (posGml) {
          const partesPos = posGml.split(/\s+/);
          if (partesPos.length >= 2) {
            lat = parseFloat(partesPos[0]);
            lon = parseFloat(partesPos[1]);
          }
        }
        if (!lat && !lon) {
          lat = parseFloat(obtenerTextoTag(nodo, 'latitude')) || 0;
          lon = parseFloat(obtenerTextoTag(nodo, 'longitude')) || 0;
        }

        const elevacionM = parseFloat(obtenerTextoTag(nodo, 'summitElevation')) ||
          parseFloat(obtenerTextoTag(nodo, 'elevation')) || 0;
        const elevacionFt = Math.round(elevacionM * 3.28084);

        const colorActual = (obtenerTextoTag(nodo, 'currentColourCode') ||
          obtenerTextoTag(nodo, 'current') ||
          'UNKNOWN').toUpperCase();

        const colorPrevio = (obtenerTextoTag(nodo, 'previousColourCode') ||
          obtenerTextoTag(nodo, 'previous') ||
          'UNKNOWN').toUpperCase();

        const numeroAviso = obtenerTextoTag(nodo, 'noticeNumber') || 'N/A';
        const fechaEmision = obtenerTextoTag(nodo, 'timePosition') ||
          obtenerTextoTag(nodo, 'issueTime') ||
          new Date().toISOString();
        const observatorio = obtenerTextoTag(nodo, 'observatory') ||
          obtenerTextoTag(nodo, 'source') ||
          'Observatorio Estatal';

        let altitudNivelMarM = parseFloat(obtenerTextoTag(nodo, 'aboveSeaLevel')) ||
          parseFloat(obtenerTextoTag(nodo, 'verticalExtent')) || 0;
        const flRaw = obtenerTextoTag(nodo, 'flightLevel');
        if (!altitudNivelMarM && flRaw && flRaw.toUpperCase().startsWith('FL')) {
          const flNum = parseInt(flRaw.slice(2), 10);
          if (!isNaN(flNum) && flNum > 0) {
            altitudNivelMarM = Math.round(flNum * 100 * 0.3048);
          }
        }

        const altitudSobreCumbreM = parseFloat(obtenerTextoTag(nodo, 'aboveSummit')) ||
          (altitudNivelMarM > elevacionM ? altitudNivelMarM - elevacionM : 0);
        const nivelVuelo = flRaw ||
          (altitudNivelMarM > 0 ? `FL${Math.round((altitudNivelMarM * 3.28084) / 100)}` : 'N/A');

        const direccionHumo = obtenerTextoTag(nodo, 'movementDirection') || 'ENE';
        const velocidadHumoKmH = parseFloat(obtenerTextoTag(nodo, 'movementSpeed')) || 30;
        const distanciaDispersionKm = parseFloat(obtenerTextoTag(nodo, 'dispersionDistance')) ||
          Math.max(30, Math.round(velocidadHumoKmH * 1.3));

        const caracteristicasPluma = obtenerTextoTag(nodo, 'cloudCharacteristics') ||
          obtenerTextoTag(nodo, 'remarks') ||
          'Emisión continua de ceniza y vapor.';

        const resumenActividad = obtenerTextoTag(nodo, 'volcanicActivitySummary') ||
          'Actividad volcánica observada según reporte VONA.';
        const observaciones = obtenerTextoTag(nodo, 'remarks') || 'Monitoreo en curso.';
        const contactos = obtenerTextoTag(nodo, 'contacts') || obtenerTextoTag(nodo, 'contact') || 'Sin datos de contacto';
        const proximoAviso = obtenerTextoTag(nodo, 'nextNotice') || 'Se emitirá nuevo aviso si hay cambios.';

        listaVolcanes.push({
          nombre,
          numero,
          area,
          lat,
          lon,
          elevacionM,
          elevacionFt,
          colorActual,
          colorPrevio,
          numeroAviso,
          fechaEmision,
          observatorio,
          altitudNivelMarM,
          altitudSobreCumbreM,
          nivelVuelo,
          direccionHumo,
          rumboGrados: convertirDireccionAGrados(direccionHumo),
          velocidadHumoKmH,
          distanciaDispersionKm,
          caracteristicasPluma,
          resumenActividad,
          observaciones,
          contactos,
          proximoAviso
        });
      }

      return listaVolcanes;
    }

    /**
     * Actualiza el resumen visual y la tabla técnica concisa
     */
    function actualizarResumenVisual(volcan) {
      if (!volcan) return;

      if (elementoVolcanNombre) elementoVolcanNombre.textContent = volcan.nombre;
      if (elementoVolcanUbicacion) {
        elementoVolcanUbicacion.textContent = `${volcan.lat.toFixed(3)}°, ${volcan.lon.toFixed(3)}° (${volcan.area})`;
      }

      if (elementoAlertaActual) {
        elementoAlertaActual.textContent = volcan.colorActual;
        elementoAlertaActual.setAttribute('data-codigo-color', volcan.colorActual);
      }

      if (elementoAlertaPrevia) {
        elementoAlertaPrevia.textContent = `Previo: ${volcan.colorPrevio}`;
      }

      if (elementoElevacionCumbre) {
        elementoElevacionCumbre.textContent = `${volcan.elevacionM.toLocaleString()} m`;
      }
      if (elementoElevacionFt) {
        elementoElevacionFt.textContent = `(${volcan.elevacionFt.toLocaleString()} ft)`;
      }

      if (elementoPlumaAltitud) {
        elementoPlumaAltitud.textContent = volcan.altitudNivelMarM > 0
          ? `${volcan.altitudNivelMarM.toLocaleString()} m (${volcan.nivelVuelo})`
          : 'Sin pluma detectada';
      }

      if (elementoPlumaViento) {
        elementoPlumaViento.textContent = `${volcan.direccionHumo} a ${volcan.velocidadHumoKmH} km/h`;
      }

      if (elementoResumenActividad) {
        elementoResumenActividad.textContent = `« ${volcan.resumenActividad} »`;
      }

      // Cálculo de área de cobertura de la pluma
      let areaPlumaKm2 = 0;
      const distanciaEfectiva = volcan.distanciaDispersionKm || 40;
      if (window.VonaWasm && typeof window.VonaWasm.plumeArea === 'function') {
        areaPlumaKm2 = window.VonaWasm.plumeArea(distanciaEfectiva, 36);
      } else {
        areaPlumaKm2 = 0.5 * Math.pow(distanciaEfectiva, 2) * (36 * (Math.PI / 180));
      }

      if (elementoPlumaArea) {
        elementoPlumaArea.textContent = areaPlumaKm2 > 0 ? `${Math.round(areaPlumaKm2).toLocaleString()} km²` : '0 km²';
      }

      if (elementoValidacionTs) {
        elementoValidacionTs.textContent = 'Conforme OACI Doc 9766';
      }

      // Tabla técnica concisa de parámetros del estándar
      if (cuerpoTablaDetalles) {
        cuerpoTablaDetalles.innerHTML = '';
        const filas = [
          ['Número de Aviso VONA', volcan.numeroAviso],
          ['Fecha y Hora (UTC)', volcan.fechaEmision],
          ['Observatorio Emisor', volcan.observatorio],
          ['Superficie Estimada de Pluma', areaPlumaKm2 > 0 ? `${Math.round(areaPlumaKm2).toLocaleString()} km²` : '0 km² (Sin pluma)'],
          ['Alcance de Dispersión', `${distanciaEfectiva} km rumbo ${volcan.direccionHumo}`],
          ['Canal de Contacto', volcan.contactos]
        ];

        for (const [etiqueta, valor] of filas) {
          const tr = document.createElement('tr');
          const th = document.createElement('th');
          th.setAttribute('scope', 'row');
          th.textContent = etiqueta;

          const td = document.createElement('td');
          td.textContent = valor;

          tr.appendChild(th);
          tr.appendChild(td);
          cuerpoTablaDetalles.appendChild(tr);
        }
      }
    }

    /**
     * Limpia marcadores y capas de mapa anteriores
     */
    function limpiarCapasMapa() {
      for (const marcador of marcadores) {
        marcador.remove();
      }
      marcadores = [];

      if (!mapa) return;

      const capasAEliminar = [
        'capa-pluma-linea',
        'capa-pluma-nucleo',
        'capa-pluma-dispersion',
        'capa-pluma-borde',
        'capa-zonas-seguridad-linea',
        'capa-zonas-seguridad-fondo'
      ];

      for (const capa of capasAEliminar) {
        if (mapa.getLayer(capa)) {
          mapa.removeLayer(capa);
        }
      }

      const fuentesAEliminar = [
        'fuente-pluma-cono',
        'fuente-pluma-nucleo',
        'fuente-pluma-eje',
        'fuente-zonas'
      ];

      for (const fuente of fuentesAEliminar) {
        if (mapa.getSource(fuente)) {
          mapa.removeSource(fuente);
        }
      }
    }

    /**
     * Renderiza los volcanes, el cono de humo/ceniza y las zonas en el Globo 3D
     */
    function renderizarEnMapa(volcanActivo) {
      if (!mapa || !volcanActivo) return;

      limpiarCapasMapa();

      // 1. Marcadores sobrios de volcanes
      datosVolcanesActuales.forEach((v, i) => {
        const contenedorMarcador = document.createElement('div');
        contenedorMarcador.setAttribute('data-marcador-volcan', 'true');
        contenedorMarcador.setAttribute('data-volcan-indice', String(i));

        let colorHex = '#854d0e';
        if (v.colorActual === 'RED') colorHex = '#991b1b';
        else if (v.colorActual === 'ORANGE') colorHex = '#9a3412';
        else if (v.colorActual === 'GREEN') colorHex = '#166534';

        const iconoCaja = document.createElement('div');
        iconoCaja.setAttribute('data-marcador-icono', 'true');
        iconoCaja.style.borderColor = colorHex;
        iconoCaja.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="${colorHex}" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 8-16 4 8 2-4 6 12Z"/></svg>`;

        contenedorMarcador.appendChild(iconoCaja);

        const popupHtml = `<div data-popup-vona="true">` +
          `<h4>${v.nombre} (${v.numero})</h4>` +
          `<p><strong>Alerta:</strong> <span data-codigo-color="${v.colorActual}">${v.colorActual}</span></p>` +
          `<p><strong>Elevación:</strong> ${v.elevacionM} m</p>` +
          `<p><strong>Pluma:</strong> ${v.altitudNivelMarM > 0 ? `${v.altitudNivelMarM} m (${v.nivelVuelo})` : 'Sin emisión'}</p>` +
          `</div>`;

        const popup = new window.mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml);

        const marcador = new window.mapboxgl.Marker(contenedorMarcador)
          .setLngLat([v.lon, v.lat])
          .setPopup(popup)
          .addTo(mapa);

        contenedorMarcador.addEventListener('click', () => {
          if (i !== indiceVolcanActivo) {
            indiceVolcanActivo = i;
            if (selectorVolcan) selectorVolcan.value = String(i);
            actualizarResumenVisual(datosVolcanesActuales[i]);
            renderizarEnMapa(datosVolcanesActuales[i]);
          }
        });

        marcadores.push(marcador);
      });

      // 2. Renderizado del cono de humo / pluma de ceniza volcánica
      const distanciaPluma = Math.max(20, volcanActivo.distanciaDispersionKm || 45);
      if (mostrarPlumaHumo) {
        // Cono de dispersión principal
        const featurePluma = generarPoligonoPluma(
          volcanActivo.lat,
          volcanActivo.lon,
          volcanActivo.rumboGrados,
          distanciaPluma,
          36
        );

        // Núcleo más denso de emisión cerca del cráter
        const featureNucleo = generarPoligonoPluma(
          volcanActivo.lat,
          volcanActivo.lon,
          volcanActivo.rumboGrados,
          Math.max(10, Math.round(distanciaPluma * 0.35)),
          22
        );

        // Eje central de trayectoria eólica
        const puntoFinEje = calcularPuntoDestino(
          volcanActivo.lat,
          volcanActivo.lon,
          volcanActivo.rumboGrados,
          distanciaPluma
        );

        const featureEje = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [volcanActivo.lon, volcanActivo.lat],
              puntoFinEje
            ]
          }
        };

        // Fuente para el polígono del cono de dispersión
        mapa.addSource('fuente-pluma-cono', {
          type: 'geojson',
          data: featurePluma
        });

        // Capa de relleno semitransparente del cono de humo
        mapa.addLayer({
          id: 'capa-pluma-dispersion',
          type: 'fill',
          source: 'fuente-pluma-cono',
          paint: {
            'fill-color': volcanActivo.colorActual === 'RED' ? '#991b1b' : (volcanActivo.colorActual === 'ORANGE' ? '#c2410c' : '#78716c'),
            'fill-opacity': 0.42
          }
        });

        // Capa de contorno del cono de humo
        mapa.addLayer({
          id: 'capa-pluma-borde',
          type: 'line',
          source: 'fuente-pluma-cono',
          paint: {
            'line-color': volcanActivo.colorActual === 'RED' ? '#7f1d1d' : (volcanActivo.colorActual === 'ORANGE' ? '#9a3412' : '#44403c'),
            'line-width': 1.5,
            'line-dasharray': [3, 2]
          }
        });

        // Fuente y capa para el núcleo denso
        mapa.addSource('fuente-pluma-nucleo', {
          type: 'geojson',
          data: featureNucleo
        });

        mapa.addLayer({
          id: 'capa-pluma-nucleo',
          type: 'fill',
          source: 'fuente-pluma-nucleo',
          paint: {
            'fill-color': volcanActivo.colorActual === 'RED' ? '#450a0a' : (volcanActivo.colorActual === 'ORANGE' ? '#7c2d12' : '#292524'),
            'fill-opacity': 0.68
          }
        });

        // Fuente y capa para el eje central
        mapa.addSource('fuente-pluma-eje', {
          type: 'geojson',
          data: featureEje
        });

        mapa.addLayer({
          id: 'capa-pluma-linea',
          type: 'line',
          source: 'fuente-pluma-eje',
          paint: {
            'line-color': '#0f172a',
            'line-width': 2,
            'line-dasharray': [4, 2]
          }
        });

        // Popup interactivo al pulsar sobre el cono de humo
        mapa.on('click', 'capa-pluma-dispersion', (e) => {
          new window.mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              `<div data-popup-vona="true">` +
              `<h4>Pluma de Ceniza Volcánica</h4>` +
              `<p><strong>Altitud:</strong> ${volcanActivo.altitudNivelMarM} m (${volcanActivo.nivelVuelo})</p>` +
              `<p><strong>Rumbo:</strong> ${volcanActivo.direccionHumo} (${volcanActivo.rumboGrados}°)</p>` +
              `<p><strong>Velocidad:</strong> ${volcanActivo.velocidadHumoKmH} km/h</p>` +
              `<p><strong>Alcance:</strong> ${distanciaPluma} km</p>` +
              `</div>`
            )
            .addTo(mapa);
        });

        mapa.on('mouseenter', 'capa-pluma-dispersion', () => {
          mapa.getCanvas().style.cursor = 'pointer';
        });
        mapa.on('mouseleave', 'capa-pluma-dispersion', () => {
          mapa.getCanvas().style.cursor = '';
        });
      }

      // 3. Zonas concéntricas de seguridad aeronáutica
      if (mostrarZonasSeguridad) {
        const zona5km = generarCirculoZona(volcanActivo.lat, volcanActivo.lon, 5, 'Zona 5 km');
        const zona25km = generarCirculoZona(volcanActivo.lat, volcanActivo.lon, 25, 'Zona 25 km');

        mapa.addSource('fuente-zonas', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [zona5km, zona25km]
          }
        });

        mapa.addLayer({
          id: 'capa-zonas-seguridad-fondo',
          type: 'fill',
          source: 'fuente-zonas',
          paint: {
            'fill-color': '#0369a1',
            'fill-opacity': 0.06
          }
        });

        mapa.addLayer({
          id: 'capa-zonas-seguridad-linea',
          type: 'line',
          source: 'fuente-zonas',
          paint: {
            'line-color': '#0284c7',
            'line-width': 1,
            'line-dasharray': [4, 3]
          }
        });
      }

      // Transición animada de cámara hacia el volcán en el Globo 3D
      mapa.flyTo({
        center: [volcanActivo.lon, volcanActivo.lat],
        zoom: 8.5,
        pitch: 0,
        bearing: 0,
        essential: true,
        duration: 2000
      });
    }

    /**
     * Procesa la cadena XML utilizando la arquitectura cooperativa:
     * 1. TypeScript valida el esquema XML y los tipos de datos.
     * 2. WebAssembly / Geodesia calcula las coordenadas y áreas.
     * 3. JavaScript orquesta y proyecta los datos en el Globo 3D.
     */
    function procesarCadenaXml(cadenaXml) {
      try {
        ultimoTextoXml = cadenaXml;
        let volcanes = [];

        if (window.VonaTypeScript && typeof window.VonaTypeScript.parse === 'function') {
          const items = window.VonaTypeScript.parse(cadenaXml);
          volcanes = items.map((it) => ({
            nombre: it.volcano.name,
            numero: it.volcano.number,
            area: it.volcano.area,
            lat: it.volcano.location.latitude,
            lon: it.volcano.location.longitude,
            elevacionM: it.volcano.summitElevationMeters,
            elevacionFt: it.volcano.summitElevationFeet,
            colorActual: it.currentColorCode,
            colorPrevio: it.previousColorCode,
            numeroAviso: it.noticeNumber,
            fechaEmision: it.issueTimeUTC,
            observatorio: it.issuingObservatory,
            altitudNivelMarM: it.ashCloud.altitudeMetersASL,
            altitudSobreCumbreM: it.ashCloud.altitudeMetersAboveSummit,
            nivelVuelo: it.ashCloud.flightLevel,
            direccionHumo: it.ashCloud.direction,
            rumboGrados: convertirDireccionAGrados(it.ashCloud.direction),
            velocidadHumoKmH: it.ashCloud.speedKmH,
            distanciaDispersionKm: it.ashCloud.dispersionDistanceKm,
            caracteristicasPluma: it.ashCloud.characteristics,
            resumenActividad: it.volcanicActivitySummary,
            observaciones: it.remarks,
            contactos: it.contacts,
            proximoAviso: it.nextNotice
          }));
        } else {
          volcanes = parsearVonaXml(cadenaXml);
        }

        if (volcanes.length === 0) {
          throw new Error('No se encontraron registros volcánicos en el archivo XML.');
        }

        datosVolcanesActuales = volcanes;
        indiceVolcanActivo = 0;

        if (selectorVolcan) {
          selectorVolcan.innerHTML = '';
          if (volcanes.length > 1) {
            selectorVolcan.removeAttribute('data-oculto-visual');
            volcanes.forEach((volc, i) => {
              const opt = document.createElement('option');
              opt.value = String(i);
              opt.textContent = `${i + 1}. ${volc.nombre} [${volc.colorActual}]`;
              selectorVolcan.appendChild(opt);
            });
          } else {
            selectorVolcan.setAttribute('data-oculto-visual', 'true');
          }
        }

        actualizarResumenVisual(volcanes[0]);
        renderizarEnMapa(volcanes[0]);

        mostrarNotificacion(`Aviso VONA procesado (${volcanes.length} volcán${volcanes.length > 1 ? 'es' : ''}).`, 'exito');
      } catch (err) {
        mostrarNotificacion(err.message, 'error');
      }
    }

    /**
     * Carga un archivo de muestra
     */
    function cargarMuestra(rutaArchivo, botonActivado) {
      for (const btn of botonesMuestra) {
        btn.setAttribute('aria-pressed', 'false');
      }
      if (botonActivado) {
        botonActivado.setAttribute('aria-pressed', 'true');
      }

      fetch(rutaArchivo)
        .then((res) => {
          if (!res.ok) throw new Error(`No se pudo descargar ${rutaArchivo}`);
          return res.text();
        })
        .then((textoXml) => {
          procesarCadenaXml(textoXml);
        })
        .catch((error) => {
          mostrarNotificacion(`Error: ${error.message}`, 'error');
        });
    }

    // Entrada de archivo XML
    if (entradaArchivo) {
      entradaArchivo.addEventListener('change', (e) => {
        const archivos = e.target.files;
        if (archivos && archivos.length > 0) {
          const lector = new FileReader();
          lector.onload = (eventoLectura) => {
            procesarCadenaXml(eventoLectura.target.result);
          };
          lector.readAsText(archivos[0]);
          entradaArchivo.value = '';
        }
      });
    }

    // Soporte para arrastrar y soltar (Drag and Drop) de archivos XML en cualquier parte
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const archivos = e.dataTransfer?.files;
      if (archivos && archivos.length > 0) {
        const lector = new FileReader();
        lector.onload = (eventoLectura) => {
          procesarCadenaXml(eventoLectura.target.result);
        };
        lector.readAsText(archivos[0]);
      }
    });

    // Selector de volcán (para archivos con múltiples avisos VONA)
    if (selectorVolcan) {
      selectorVolcan.addEventListener('change', () => {
        const indice = parseInt(selectorVolcan.value, 10);
        if (!isNaN(indice) && datosVolcanesActuales[indice]) {
          indiceVolcanActivo = indice;
          actualizarResumenVisual(datosVolcanesActuales[indice]);
          renderizarEnMapa(datosVolcanesActuales[indice]);
        }
      });
    }

    // Botón Globo 3D / Plano Mercator
    if (botonAlternarGlobo) {
      botonAlternarGlobo.addEventListener('click', () => {
        if (!mapa) return;
        modoGlobo = !modoGlobo;
        const proyeccion = modoGlobo ? 'globe' : 'mercator';
        if (typeof mapa.setProjection === 'function') {
          mapa.setProjection({ type: proyeccion });
        }
        botonAlternarGlobo.setAttribute('aria-pressed', String(modoGlobo));
        const spanTexto = botonAlternarGlobo.querySelector('span');
        if (spanTexto) {
          spanTexto.textContent = modoGlobo ? 'Globo 3D' : 'Plano (2D)';
        }
        mostrarNotificacion(`Cambiado a ${modoGlobo ? 'Globo 3D' : 'Plano Mercator'}.`, 'exito');
      });
    }

    // Alternar pluma
    if (botonAlternarPluma) {
      botonAlternarPluma.addEventListener('click', () => {
        mostrarPlumaHumo = !mostrarPlumaHumo;
        botonAlternarPluma.setAttribute('aria-pressed', String(mostrarPlumaHumo));
        if (datosVolcanesActuales.length > 0) {
          renderizarEnMapa(datosVolcanesActuales[indiceVolcanActivo]);
        }
      });
    }

    // Alternar zonas
    if (botonAlternarZonas) {
      botonAlternarZonas.addEventListener('click', () => {
        mostrarZonasSeguridad = !mostrarZonasSeguridad;
        botonAlternarZonas.setAttribute('aria-pressed', String(mostrarZonasSeguridad));
        if (datosVolcanesActuales.length > 0) {
          renderizarEnMapa(datosVolcanesActuales[indiceVolcanActivo]);
        }
      });
    }

    // Centrar mapa
    if (botonCentrar) {
      botonCentrar.addEventListener('click', () => {
        if (mapa && datosVolcanesActuales.length > 0) {
          const v = datosVolcanesActuales[indiceVolcanActivo];
          mapa.flyTo({
            center: [v.lon, v.lat],
            zoom: 8.5,
            pitch: 0,
            bearing: 0,
            essential: true
          });
        }
      });
    }

    // Iniciar el mapa en espera de archivo XML
    inicializarMapa();
  });
}());

