const fs = require('fs');
const path = require('path');

async function compilar() {
  let wabtFactory;
  try {
    wabtFactory = require('wabt');
  } catch {
    wabtFactory = require('/var/www/html/wasm/node_modules/wabt');
  }

  const wabt = await wabtFactory();

  const watPath = path.join(__dirname, 'xml_metrics.wat');
  const wasmAssetsPath = path.join(__dirname, '../../assets/wasm/xml_metrics.wasm');
  const wasmSrcPath = path.join(__dirname, 'wasm_metrics.wasm');

  const watSource = fs.readFileSync(watPath, 'utf8');

  const modulo = wabt.parseWat('xml_metrics.wat', watSource, {
    mutable_globals: true,
    sat_float_to_int: true,
    sign_extensions: true,
    bulk_memory: true
  });

  const { buffer } = modulo.toBinary({});
  fs.writeFileSync(wasmAssetsPath, Buffer.from(buffer));
  fs.writeFileSync(wasmSrcPath, Buffer.from(buffer));

  console.log(`✅ xml_metrics.wasm generado con éxito (${buffer.byteLength} bytes) en:`);
  console.log(`   - ${wasmAssetsPath}`);
  console.log(`   - ${wasmSrcPath}`);
  modulo.destroy();
}

compilar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error compilando WAT a WASM:', err);
    process.exit(1);
  });
