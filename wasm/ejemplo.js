"use strict";

let wasm = null;
let operacion = "factorial";

const REPS = 50000;

const menuBotones = document.querySelectorAll("menu button");
const camposForm  = document.querySelectorAll("form p");
const inputsForm  = document.querySelectorAll("form input");
const btnEjec     = document.querySelector("form > button");
const celdas      = document.querySelectorAll("tbody td");
const banner      = document.querySelector("output");
const preWat      = document.querySelector("pre");

async function cargarWasm() {
  const respuesta = await fetch("ejemplo.wasm");
  const buffer    = await respuesta.arrayBuffer();
  const resultado = await WebAssembly.instantiate(buffer, {});
  wasm = resultado.instance.exports;
  cargarWAT();
}

function js_factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) {
    r = r * i;
  }
  return r;
}

function js_factorial_bigint(n) {
  let r = 1n;
  const limite = BigInt(n);
  for (let i = 2n; i <= limite; i++) {
    r = r * i;
  }
  return r;
}

function js_coseno(x) {
  let suma = 1.0;
  let termino = 1.0;
  const x2 = x * x;
  for (let i = 1; i <= 20; i++) {
    termino = termino * (-x2) / ((2 * i - 1) * (2 * i));
    suma = suma + termino;
  }
  return suma;
}

function js_es_primo(n) {
  if (n < 2) return 0;
  if (n === 2) return 1;
  if (n % 2 === 0) return 0;
  for (let d = 3; d * d <= n; d = d + 2) {
    if (n % d === 0) return 0;
  }
  return 1;
}

function medir(fn, arg) {
  for (let w = 0; w < 5000; w++) {
    fn(arg);
  }

  const t0 = performance.now();
  let ultimo;
  for (let i = 0; i < REPS; i++) {
    ultimo = fn(arg);
  }
  const t1 = performance.now();

  return {
    valor:  ultimo,
    tiempo: (t1 - t0).toFixed(3)
  };
}

function ejecutar() {
  if (!wasm) {
    banner.textContent = "El módulo WASM no está cargado todavía.";
    return;
  }

  btnEjec.disabled    = true;
  btnEjec.textContent = "Calculando...";

  setTimeout(function () {
    try {
      let rw, rj;

      if (operacion === "factorial") {
        const n = parseInt(inputsForm[0].value, 10);

        if (n <= 20) {
          rw = medir(nVal => Number(wasm.factorial(BigInt(nVal))), n);
          rj = medir(js_factorial, n);
        } else {
          rw = medir(nVal => wasm.factorial(BigInt(nVal)), n);
          rj = medir(js_factorial_bigint, n);
        }

        rw.valor = String(rw.valor);
        rj.valor = String(rj.valor);

      } else if (operacion === "coseno") {
        const x = parseFloat(inputsForm[1].value);
        rw = medir(wasm.coseno, x);
        rj = medir(js_coseno, x);
        rw.valor = rw.valor.toFixed(8);
        rj.valor = rj.valor.toFixed(8);

      } else if (operacion === "primo") {
        const num = parseInt(inputsForm[2].value, 10);
        rw = medir(wasm.es_primo, num);
        rj = medir(js_es_primo, num);
        rw.valor = rw.valor === 1 ? "Si es primo" : "No es primo";
        rj.valor = rj.valor === 1 ? "Si es primo" : "No es primo";
      }

      mostrarResultados(rw, rj);

    } catch (err) {
      banner.textContent = "Error: " + err.message;
    } finally {
      btnEjec.disabled    = false;
      btnEjec.textContent = "Ejecutar";
    }
  }, 20);
}

function mostrarResultados(rw, rj) {
  celdas[0].textContent = rw.valor;
  celdas[1].textContent = rj.valor;
  celdas[2].textContent = rw.tiempo + " ms (" + REPS + " repeticiones)";
  celdas[3].textContent = rj.tiempo + " ms (" + REPS + " repeticiones)";

  const tw = parseFloat(rw.tiempo);
  const tj = parseFloat(rj.tiempo);

  if (tw < tj) {
    const factor = (tj / tw).toFixed(2);
    banner.textContent = "WebAssembly fue " + factor + "x mas rápido que JavaScript";
  } else if (tj < tw) {
    const factor = (tw / tj).toFixed(2);
    banner.textContent = "JavaScript fue " + factor + "x mas rápido en esta operación";
  } else {
    banner.textContent = "Ambos tardaron lo mismo.";
  }
}

function cambiarOperacion(op, idx) {
  operacion = op;

  const visibles = {
    factorial: [0],
    coseno:    [1],
    primo:     [2]
  };

  for (let i = 0; i < camposForm.length; i++) {
    camposForm[i].hidden = true;
  }

  const mostrar = visibles[op];
  for (let j = 0; j < mostrar.length; j++) {
    camposForm[mostrar[j]].hidden = false;
  }

  for (let k = 0; k < celdas.length; k++) {
    celdas[k].textContent = k < 2 ? "-" : "";
  }
  banner.textContent = "";
}

async function cargarWAT() {
  try {
    const resp  = await fetch("ejemplo.wat");
    const texto = await resp.text();
    preWat.textContent = texto;
  } catch (_) {
    preWat.textContent = "(No se pudo cargar ejemplo.wat)";
  }
}

menuBotones[0].addEventListener("click", function () { cambiarOperacion("factorial", 0); });
menuBotones[1].addEventListener("click", function () { cambiarOperacion("coseno",    1); });
menuBotones[2].addEventListener("click", function () { cambiarOperacion("primo",     2); });

btnEjec.addEventListener("click", ejecutar);

for (let i = 0; i < inputsForm.length; i++) {
  inputsForm[i].addEventListener("keydown", function (e) {
    if (e.key === "Enter") ejecutar();
  });
}

cambiarOperacion("factorial", 0);
cargarWasm();