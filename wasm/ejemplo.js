"use strict";

const REPS = 100000;
const WARMUP = 10000;

let wasm = null;
let operacion = "factorial";

function js_factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function js_factorial_bigint(n) {
  let r = 1n;
  const lim = BigInt(n);
  for (let i = 2n; i <= lim; i++) r *= i;
  return r;
}

function js_bench_factorial(n, reps) {
  let v = 1;
  for (let i = 0; i < reps; i++) {
    let r = 1;
    for (let j = 2; j <= n; j++) r *= j;
    v = r;
  }
  return v;
}

function js_bench_factorial_bigint(n, reps) {
  let v = 1n;
  const lim = BigInt(n);
  for (let i = 0; i < reps; i++) {
    let r = 1n;
    for (let j = 2n; j <= lim; j++) r *= j;
    v = r;
  }
  return v;
}

function js_coseno(x) {
  const x2 = x * x;
  let termino = 1.0, suma = 1.0;
  for (let i = 1; i <= 15; i++) {
    const di = 2 * i;
    termino = (termino * -x2) / ((di - 1) * di);
    suma += termino;
  }
  return suma;
}

function js_bench_coseno(x, reps) {
  const x2 = x * x;
  let v = 0;
  for (let r = 0; r < reps; r++) {
    let termino = 1.0, suma = 1.0;
    for (let i = 1; i <= 15; i++) {
      const di = 2 * i;
      termino = (termino * -x2) / ((di - 1) * di);
      suma += termino;
    }
    v = suma;
  }
  return v;
}

function js_es_primo(n) {
  if (n < 2) return 0;
  if (n === 2) return 1;
  if (n % 2 === 0) return 0;
  for (let d = 3; d * d <= n; d += 2)
    if (n % d === 0) return 0;
  return 1;
}

function js_bench_es_primo(n, reps) {
  let v = 0;
  for (let r = 0; r < reps; r++) {
    if (n < 2) { v = 0; continue; }
    if (n === 2) { v = 1; continue; }
    if (n % 2 === 0) { v = 0; continue; }
    let esP = 1;
    for (let d = 3; d * d <= n; d += 2) {
      if (n % d === 0) {
        esP = 0;
        break;
      }
    }
    v = esP;
  }
  return v;
}

function bench(benchFn, reps = REPS, warmup = WARMUP) {
  if (warmup > 0) {
    benchFn(warmup);
  }

  const t0 = performance.now();
  const v = benchFn(reps);
  const t1 = performance.now();
  const tiempo = t1 - t0;

  return { valor: v, tiempo: tiempo.toFixed(3), tiempoNum: tiempo };
}

function cambiarOperacion(op, idx) {
  operacion = op;

  const botones = document.querySelectorAll("menu button");
  botones.forEach((btn, i) => {
    const activo = i === idx;
    btn.classList.toggle("active", activo);
    btn.setAttribute("aria-selected", activo ? "true" : "false");
  });

  const campos = document.querySelectorAll("form p");
  campos.forEach((p, i) => {
    p.hidden = i !== idx;
  });

  const celdas = document.querySelectorAll("tbody td");
  celdas.forEach((td, i) => {
    td.textContent = i < 2 ? "-" : "";
  });

  const banner = document.querySelector("output");
  if (banner) banner.textContent = "";

  const nombrePrueba = document.getElementById("nombre-prueba");
  if (nombrePrueba && botones[idx]) {
    nombrePrueba.textContent = botones[idx].textContent.trim();
  }
}

function mostrarResultados(rw, rj, reps = REPS) {
  const celdas = document.querySelectorAll("tbody td");
  const banner = document.querySelector("output");

  if (celdas.length >= 4) {
    celdas[0].textContent = rw.valor;
    celdas[1].textContent = rj.valor;
    celdas[2].textContent = `${rw.tiempo} ms (${Number(reps).toLocaleString()} repeticiones)`;
    celdas[3].textContent = `${rj.tiempo} ms (${Number(reps).toLocaleString()} repeticiones)`;
  }

  if (!banner) return;

  const tw = rw.tiempoNum ?? parseFloat(rw.tiempo);
  const tj = rj.tiempoNum ?? parseFloat(rj.tiempo);

  if (tw < 0.001 && tj < 0.001) {
    banner.textContent = "Ambas implementaciones tardaron prácticamente lo mismo (< 0.001 ms).";
  } else if (tw < 0.001) {
    banner.textContent = "WebAssembly fue prácticamente instantáneo comparado con JavaScript.";
  } else if (tj < 0.001) {
    banner.textContent = "JavaScript fue prácticamente instantáneo comparado con WebAssembly.";
  } else if (tw < tj) {
    const ratio = (tj / tw).toFixed(2);
    banner.textContent = `WebAssembly fue ${ratio}x más rápido que JavaScript`;
  } else if (tj < tw) {
    const ratio = (tw / tj).toFixed(2);
    banner.textContent = `JavaScript fue ${ratio}x más rápido que WebAssembly`;
  } else {
    banner.textContent = "Ambas implementaciones tardaron exactamente lo mismo.";
  }
}

async function ejecutar() {
  const banner = document.querySelector("output");
  const btnEjec = document.querySelector("form > button");
  const inputs = document.querySelectorAll("form input");

  if (!wasm) {
    if (banner) banner.textContent = "El módulo WASM aún no está cargado.";
    return;
  }

  if (btnEjec) {
    btnEjec.disabled = true;
    btnEjec.textContent = "Calculando...";
  }

  // Dejamos que el navegador pinte el estado y complete el tier-up de TurboFan
  await new Promise(r => setTimeout(r, 25));

  try {
    let rw, rj;
    let repeticiones = REPS;

    if (operacion === "factorial") {
      const n = parseInt(inputs[0].value, 10);
      repeticiones = REPS;
      const warmup = WARMUP;

      rw = bench(r => wasm.bench_factorial(BigInt(n), r), repeticiones, warmup);
      rj = bench(r => js_bench_factorial_bigint(n, r), repeticiones, warmup);
      rw.valor = String(rw.valor);
      rj.valor = String(rj.valor);

    } else if (operacion === "coseno") {
      const x = parseFloat(inputs[1].value);
      repeticiones = REPS;

      rw = bench(n => wasm.bench_coseno(x, n), repeticiones, WARMUP);
      rj = bench(n => js_bench_coseno(x, n), repeticiones, WARMUP);

      rw.valor = Number(rw.valor).toFixed(8);
      rj.valor = Number(rj.valor).toFixed(8);

    } else if (operacion === "primo") {
      const n = parseInt(inputs[2].value, 10);

      repeticiones = n > 100000 ? 2000 : REPS;
      const warmup = n > 100000 ? 200 : WARMUP;

      rw = bench(r => wasm.bench_es_primo(n, r), repeticiones, warmup);
      rj = bench(r => js_bench_es_primo(n, r), repeticiones, warmup);

      rw.valor = rw.valor === 1 ? "Sí es primo" : "No es primo";
      rj.valor = rj.valor === 1 ? "Sí es primo" : "No es primo";
    }

    mostrarResultados(rw, rj, repeticiones);
  } catch (e) {
    if (banner) banner.textContent = "Error: " + e.message;
  } finally {
    if (btnEjec) {
      btnEjec.disabled = false;
      btnEjec.textContent = "Ejecutar";
    }
  }
}

async function cargarWasm() {
  try {
    const buf = await (await fetch("ejemplo.wasm")).arrayBuffer();
    wasm = (await WebAssembly.instantiate(buf, {})).instance.exports;
    setTimeout(() => {
      try {
        wasm.bench_factorial(15n, 10000);
        wasm.bench_coseno(1.0472, 10000);
        wasm.bench_es_primo(982451653, 500);
      } catch {}
    }, 50);
  } catch (err) {
    console.error("Error al cargar WASM:", err);
  }
  cargarWAT();
}

async function cargarWAT() {
  const preWat = document.querySelector("pre");
  if (!preWat) return;
  try {
    preWat.textContent = await (await fetch("ejemplo.wat")).text();
  } catch {
    preWat.textContent = "(No se pudo cargar ejemplo.wat)";
  }
}

window.cambiarOperacion = cambiarOperacion;
window.ejecutar = ejecutar;

document.addEventListener("DOMContentLoaded", () => {
  cambiarOperacion("factorial", 0);
  cargarWasm();

  document.querySelectorAll("form input").forEach(inp => {
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") ejecutar();
    });
  });
});