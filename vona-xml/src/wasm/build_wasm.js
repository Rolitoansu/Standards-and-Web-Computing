const fs = require("fs");
const path = require("path");

async function compilar() {
  // Cargar wabt desde la instalación local de npm
  let wabtFactory;
  try {
    wabtFactory = require("wabt");
  } catch {
    wabtFactory = require("/var/www/html/wasm/node_modules/wabt");
  }

  const wabt = await wabtFactory();

  const watPath = path.join(__dirname, "vona_geodesy.wat");
  const wasmPath = path.join(__dirname, "../../assets/wasm/vona_geodesy.wasm");

  const watSource = fs.readFileSync(watPath, "utf8");

  const modulo = wabt.parseWat("vona_geodesy.wat", watSource, {
    mutable_globals: true,
    sat_float_to_int: true,
    sign_extensions: true,
    bulk_memory: true,
  });

  const { buffer } = modulo.toBinary({});
  fs.writeFileSync(wasmPath, Buffer.from(buffer));

  console.log(`✅ vona_geodesy.wasm generado con éxito (${buffer.byteLength} bytes)`);
  modulo.destroy();
}

compilar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error compilando WAT a WASM:", err);
    process.exit(1);
  });
