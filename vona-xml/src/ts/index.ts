/**
 * index.ts — Punto de entrada del motor TypeScript para VONA
 */
import { VonaTypeScriptService } from './vona_service.js';
import { VonaValidator } from './vona_validator.js';

export * from './vona_types.js';
export * from './vona_validator.js';
export * from './vona_service.js';

const servicio = new VonaTypeScriptService();

export const VonaTypeScript = {
  validColorCodes: new Set(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'UNKNOWN']),
  validateNotice: (notice: any) => VonaValidator.validateNotice(notice),
  parse: (cadenaXml: string) => servicio.parse(cadenaXml),
  service: servicio
};

if (typeof window !== 'undefined') {
  (window as any).VonaTypeScript = VonaTypeScript;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).VonaTypeScript = VonaTypeScript;
}
