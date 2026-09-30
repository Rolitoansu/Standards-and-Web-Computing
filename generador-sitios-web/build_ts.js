/**
 * build_ts.js — Compila los archivos TypeScript de src/ts/ a dist/
 * Utiliza la API programática de TypeScript.
 */

const fs = require('fs');
const path = require('path');
const ts = require('/home/uo294202/.antigravity-ide-server/bin/2.5.5-ecfbad74d93962fc8ca485d93ab9b4f3d4cb6cf8/extensions/node_modules/typescript/lib/typescript.js');

const tsFiles = [
  path.join(__dirname, 'src/ts/types.ts'),
  path.join(__dirname, 'src/ts/parser.ts'),
  path.join(__dirname, 'src/ts/validator.ts'),
  path.join(__dirname, 'src/ts/generator.ts'),
  path.join(__dirname, 'src/ts/index.ts')
];

const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  outDir: outDir,
  declaration: true,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true
};

const program = ts.createProgram(tsFiles, compilerOptions);
const emitResult = program.emit();

const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

let hasErrors = false;
allDiagnostics.forEach(diagnostic => {
  if (diagnostic.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
  if (diagnostic.category === ts.DiagnosticCategory.Error) {
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('Compilación de TypeScript fallida con errores.');
  process.exit(1);
} else {
  console.log('Compilación TypeScript completada con éxito en ./dist/');
}
