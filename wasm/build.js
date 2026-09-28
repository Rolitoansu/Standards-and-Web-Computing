// build.js — Compila ejemplo.wat → ejemplo.wasm usando el paquete npm "wabt"
// Ejecutar con: node build.js

const fs = require("fs");
const path = require("path");

async function compilar() {
  const wabt = await require("wabt")();

  const watPath = path.join(__dirname, "ejemplo.wat");
  const wasmPath = path.join(__dirname, "ejemplo.wasm");

  const watSource = fs.readFileSync(watPath, "utf8");

  const modulo = wabt.parseWat("ejemplo.wat", watSource, {
    mutable_globals: true,
    sat_float_to_int: true,
    sign_extensions: true,
    bulk_memory: true,
  });

  const { buffer } = modulo.toBinary({});
  fs.writeFileSync(wasmPath, Buffer.from(buffer));

  console.log(`✅ ejemplo.wasm generado (${buffer.byteLength} bytes)`);
  modulo.destroy();
}

compilar().catch(console.error);
