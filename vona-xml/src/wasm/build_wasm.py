#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    js_builder = os.path.join(script_dir, 'build_wasm.js')
    node_bins = [
        '/home/uo294202/.antigravity-ide-server/bin/2.5.5-ecfbad74d93962fc8ca485d93ab9b4f3d4cb6cf8/node',
        'node',
        'nodejs'
    ]
    for nb in node_bins:
        if os.path.exists(nb) or nb in ('node', 'nodejs'):
            try:
                res = subprocess.run([nb, js_builder])
                if res.returncode == 0:
                    sys.exit(0)
            except (subprocess.SubprocessError, FileNotFoundError):
                continue

    print("Error: Node.js o wabt no disponibles para compilar.", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
