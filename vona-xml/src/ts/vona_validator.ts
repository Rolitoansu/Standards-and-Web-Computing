/**
 * vona_validator.ts — Validador estricto de esquemas y tipos VONA XML en TypeScript
 * Aprovecha las capacidades avanzadas de TypeScript:
 * - Type Guards (predicados de tipos personalizados).
 * - Verificación exhaustiva en tiempo de ejecución.
 * - Chequeo de rangos geográficos [-90, 90] y [-180, 180].
 */

import { AviationColorCode, GeoCoordinate, ValidationResult, VonaNotice } from './vona_types';

export class VonaValidator {
  private static readonly VALID_COLOR_CODES: ReadonlySet<string> = new Set([
    'RED', 'ORANGE', 'YELLOW', 'GREEN', 'UNKNOWN'
  ]);

  /**
   * Type Guard para verificar si un valor es un código de color aeronáutico válido
   */
  public static isAviationColorCode(value: unknown): value is AviationColorCode {
    return typeof value === 'string' && VonaValidator.VALID_COLOR_CODES.has(value.toUpperCase());
  }

  /**
   * Valida coordenadas geográficas según estándares WGS84
   */
  public static validateCoordinates(coord: GeoCoordinate): ValidationResult<GeoCoordinate> {
    const errors: string[] = [];

    if (coord.latitude < -90 || coord.latitude > 90) {
      errors.push(`Latitud inválida: ${coord.latitude}. Debe estar en el rango [-90, 90].`);
    }

    if (coord.longitude < -180 || coord.longitude > 180) {
      errors.push(`Longitud inválida: ${coord.longitude}. Debe estar en el rango [-180, 180].`);
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? coord : undefined,
      errors
    };
  }

  /**
   * Validación semántica integral de un aviso VONA
   */
  public static validateNotice(notice: Partial<VonaNotice>): ValidationResult<VonaNotice> {
    const errors: string[] = [];

    if (!notice.volcano?.name || notice.volcano.name.trim().length === 0) {
      errors.push('El nombre del volcán es un campo obligatorio.');
    }

    if (!notice.currentColorCode || !VonaValidator.isAviationColorCode(notice.currentColorCode)) {
      errors.push(`Código de color aeronáutico actual inválido o no reconocido: ${notice.currentColorCode}`);
    }

    if (notice.volcano?.location) {
      const coordValidation = VonaValidator.validateCoordinates(notice.volcano.location);
      if (!coordValidation.isValid) {
        errors.push(...coordValidation.errors);
      }
    } else {
      errors.push('Las coordenadas geográficas del volcán son obligatorias.');
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? (notice as VonaNotice) : undefined,
      errors
    };
  }
}
