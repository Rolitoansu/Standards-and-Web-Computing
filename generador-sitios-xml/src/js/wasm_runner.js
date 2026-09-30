/**
 * wasm_runner.js — Conector y ejecutor de métricas en WebAssembly
 * Soporta ejecución tanto en navegador como en Node.js
 */

const WasmMetricsRunner = (function () {
  let wasmInstance = null;
  let wasmMemory = null;

  async function cargarModulo(wasmUrlOrPath) {
    if (wasmInstance) return wasmInstance;

    try {
      if (typeof window !== 'undefined' && window.fetch) {
        // Entorno Navegador
        const response = await fetch(wasmUrlOrPath || 'src/wasm/wasm_metrics.wasm');
        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer);
        wasmInstance = instance;
        wasmMemory = instance.exports.memory;
      } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Entorno Node.js
        const fs = require('fs');
        const path = require('path');
        const resolvedPath = wasmUrlOrPath || path.join(__dirname, '../wasm/wasm_metrics.wasm');
        const buffer = fs.readFileSync(resolvedPath);
        const { instance } = await WebAssembly.instantiate(buffer);
        wasmInstance = instance;
        wasmMemory = instance.exports.memory;
      }
    } catch (err) {
      console.warn('No se pudo inicializar WebAssembly, se usará fallback en JavaScript:', err);
    }
    return wasmInstance;
  }

  function analizar(xmlString) {
    const t0 = performance.now();
    const encoder = new TextEncoder();
    const bytes = encoder.encode(xmlString);
    const len = bytes.length;

    if (wasmInstance && wasmMemory) {
      // Si el búfer supera la memoria actual de 64KB, crecer la memoria
      const requiredPages = Math.ceil(len / 65536) + 1;
      const currentPages = wasmMemory.buffer.byteLength / 65536;
      if (requiredPages > currentPages) {
        wasmMemory.grow(requiredPages - currentPages);
      }

      // Escribir bytes en la memoria WebAssembly en la dirección 0
      const heap = new Uint8Array(wasmMemory.buffer);
      heap.set(bytes, 0);

      const hash = wasmInstance.exports.calcular_hash(0, len);
      const etiquetas = wasmInstance.exports.contar_etiquetas_xml(0, len);
      const score = wasmInstance.exports.calcular_puntuacion_complejidad(etiquetas, len);
      const t1 = performance.now();

      return {
        motor: 'WebAssembly (WASM)',
        hashHex: (hash >>> 0).toString(16).padStart(8, '0'),
        totalBytes: len,
        totalEtiquetas: etiquetas,
        puntuacionComplejidad: Math.round(score * 100) / 100,
        tiempoMs: Math.round((t1 - t0) * 1000) / 1000
      };
    }

    // Fallback JavaScript puro
    let hash = -2128831035;
    let etiquetas = 0;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      hash = (hash ^ b) * 16777619;
      if (b === 60) etiquetas++;
    }
    const score = (etiquetas * 1.5) + (len / 100.0);
    const t1 = performance.now();

    return {
      motor: 'JavaScript Fallback',
      hashHex: (hash >>> 0).toString(16).padStart(8, '0'),
      totalBytes: len,
      totalEtiquetas: etiquetas,
      puntuacionComplejidad: Math.round(score * 100) / 100,
      tiempoMs: Math.round((t1 - t0) * 1000) / 1000
    };
  }

  return {
    cargarModulo,
    analizar
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WasmMetricsRunner;
}
