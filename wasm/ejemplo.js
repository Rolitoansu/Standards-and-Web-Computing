"use strict";

const REPS = 50000;
const WARMUP = 5000;

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

function js_coseno(x) {
  const x2 = x * x;
  let termino = 1.0, suma = 1.0;
  for (let i = 1; i <= 50; i++) {
    const di = 2 * i;
    termino *= -x2 / ((di - 1) * di);
    suma += termino;
  }
  return suma;
}

function js_bench_coseno(x, reps) {
  let v = 0;
  for (let i = 0; i < reps; i++) {
    v = js_coseno(x);
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

function bench(fn, reps = REPS, warmup = WARMUP) {
  fn(warmup);

  const t0 = performance.now();
  const v = fn(reps);
  const t1 = performance.now();

  return { valor: v, tiempo: (t1 - t0).toFixed(3) };
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
    celdas[2].textContent = `${rw.tiempo} ms (${reps} repeticiones)`;
    celdas[3].textContent = `${rj.tiempo} ms (${reps} repeticiones)`;
  }

  if (!banner) return;

  const tw = parseFloat(rw.tiempo);
  const tj = parseFloat(rj.tiempo);

  if (tw < tj) {
    const ratio = (tj / tw).toFixed(2);
    banner.textContent = `WebAssembly fue ${ratio}× más rápido que JavaScript`;
  } else if (tj < tw) {
    const ratio = (tw / tj).toFixed(2);
    banner.textContent = `JavaScript fue ${ratio}× más rápido que WebAssembly`;
  } else {
    banner.textContent = "Ambas implementaciones tardaron exactamente lo mismo.";
  }
}

function ejecutar() {
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

  setTimeout(() => {
    try {
      let rw, rj;
      let repeticiones = REPS;

      if (operacion === "factorial") {
        const n = parseInt(inputs[0].value, 10);
        if (n <= 20) {
          rw = bench(v => Number(wasm.factorial(BigInt(v))), n);
          rj = bench(js_factorial, n);
        } else {
          rw = bench(v => wasm.factorial(BigInt(v)), n);
          rj = bench(js_factorial_bigint, n);
        }
        rw.valor = String(rw.valor);
        rj.valor = String(rj.valor);

      } else if (operacion === "coseno") {
        const x = parseFloat(inputs[1].value);

        rw = bench(n => wasm.bench_coseno(x, n), repeticiones);
        rj = bench(n => js_bench_coseno(x, n), repeticiones);

        rw.valor = rw.valor.toFixed(8);
        rj.valor = rj.valor.toFixed(8);
      } else if (operacion === "primo") {
        const n = parseInt(inputs[2].value, 10);
        repeticiones = 200;
        rw = bench(wasm.es_primo, n, repeticiones, 20);
        rj = bench(js_es_primo, n, repeticiones, 20);
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
  }, 20);
}

async function cargarWasm() {
  try {
    const buf = await (await fetch("ejemplo.wasm")).arrayBuffer();
    wasm = (await WebAssembly.instantiate(buf, {})).instance.exports;
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

cambiarOperacion("factorial", 0);
cargarWasm();