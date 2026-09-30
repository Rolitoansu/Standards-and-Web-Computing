/**
 * vona_wasm_engine.js — Cargador e interfaz del módulo WebAssembly (compilado desde C++)
 * Aprovecha la velocidad de cómputo en bajo nivel para geodesia esférica y dispersión de ceniza.
 * Refactorizado a ES6+ con const, let y mejores prácticas.
 */
(function (global) {
  'use strict';

  let wasmModule = null;
  let wasmExports = null;

  const VonaWasm = {
    isReady: false,

    /**
     * Inicializa el módulo WebAssembly binario
     */
    async init() {
      try {
        const response = await fetch('assets/wasm/vona_geodesy.wasm');
        if (!response.ok) {
          throw new Error('No se pudo cargar vona_geodesy.wasm');
        }
        const bytes = await response.arrayBuffer();
        const results = await WebAssembly.instantiate(bytes, {
          env: {
            memory: new WebAssembly.Memory({ initial: 2, maximum: 10 })
          }
        });
        wasmModule = results.instance;
        wasmExports = wasmModule.exports;
        this.isReady = true;
        return this;
      } catch (err) {
        console.warn('Inicialización WASM en modo fallback matemático:', err.message);
        this.isReady = true; // Permite continuar usando el kernel matemático integrado
        return this;
      }
    },

    /**
     * Calcula latitud de destino geodésico sobre la esfera terrestre WGS84
     */
    destLat(lat, lon, rumbo, distanciaKm) {
      if (wasmExports && typeof wasmExports.dest_lat === 'function') {
        try {
          const res = wasmExports.dest_lat(lat, lon, rumbo, distanciaKm);
          if (!isNaN(res)) return res;
        } catch {}
      }

      const radioTierraKm = 6371.0;
      const dRad = distanciaKm / radioTierraKm;
      const rRad = (rumbo * Math.PI) / 180.0;
      const latRad = (lat * Math.PI) / 180.0;

      const lat2Rad = Math.asin(
        Math.sin(latRad) * Math.cos(dRad) +
        Math.cos(latRad) * Math.sin(dRad) * Math.cos(rRad)
      );

      return (lat2Rad * 180.0) / Math.PI;
    },

    /**
     * Calcula longitud de destino geodésico sobre la esfera terrestre WGS84
     */
    destLon(lat, lon, rumbo, distanciaKm) {
      if (wasmExports && typeof wasmExports.dest_lon === 'function') {
        try {
          const res = wasmExports.dest_lon(lat, lon, rumbo, distanciaKm);
          if (!isNaN(res)) return res;
        } catch {}
      }

      const radioTierraKm = 6371.0;
      const dRad = distanciaKm / radioTierraKm;
      const rRad = (rumbo * Math.PI) / 180.0;
      const latRad = (lat * Math.PI) / 180.0;
      const lonRad = (lon * Math.PI) / 180.0;

      const lat2Rad = Math.asin(
        Math.sin(latRad) * Math.cos(dRad) +
        Math.cos(latRad) * Math.sin(dRad) * Math.cos(rRad)
      );

      const lon2Rad = lonRad + Math.atan2(
        Math.sin(rRad) * Math.sin(dRad) * Math.cos(latRad),
        Math.cos(dRad) - Math.sin(latRad) * Math.sin(lat2Rad)
      );

      return (lon2Rad * 180.0) / Math.PI;
    },

    /**
     * Calcula área de cobertura de la pluma de ceniza (km²)
     */
    plumeArea(distanciaKm, aperturaDeg) {
      if (wasmExports && typeof wasmExports.plume_area === 'function') {
        try {
          const area = wasmExports.plume_area(distanciaKm, aperturaDeg);
          if (!isNaN(area) && area > 0) return area;
        } catch {
          // Fallback a fórmula analítica
        }
      }
      return 0.5 * distanciaKm * distanciaKm * (aperturaDeg * (Math.PI / 180.0));
    }
  };

  global.VonaWasm = VonaWasm;
}(typeof window !== 'undefined' ? window : this));
