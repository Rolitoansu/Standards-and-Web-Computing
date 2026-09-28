/**
 * vona_types.ts — Tipos e interfaces de dominio del estándar VONA OACI / IWXXM
 * Diseñado conforme a las características intrínsecas de TypeScript:
 * - Sistema de tipos estático y tipos de unión discriminada.
 * - Inmutabilidad mediante readonly.
 * - Validación estructural de datos aeronáuticos.
 */

export type AviationColorCode = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'UNKNOWN';

export type FlightLevel = `FL${number}` | 'N/A';

export type CardinalDirection =
  | 'N' | 'NNE' | 'NE' | 'ENE'
  | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW'
  | 'W' | 'WNW' | 'NW' | 'NNW';

export interface GeoCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface VolcanoIdentity {
  readonly name: string;
  readonly number: string;
  readonly area: string;
  readonly summitElevationMeters: number;
  readonly summitElevationFeet: number;
  readonly location: GeoCoordinate;
}

export interface VolcanicAshCloud {
  readonly altitudeMetersASL: number;
  readonly altitudeMetersAboveSummit: number;
  readonly flightLevel: FlightLevel;
  readonly direction: string;
  readonly headingDegrees: number;
  readonly speedKmH: number;
  readonly dispersionDistanceKm: number;
  readonly characteristics: string;
}

export interface VonaNotice {
  readonly noticeNumber: string;
  readonly issueTimeUTC: string;
  readonly volcano: VolcanoIdentity;
  readonly currentColorCode: AviationColorCode;
  readonly previousColorCode: AviationColorCode;
  readonly issuingObservatory: string;
  readonly volcanicActivitySummary: string;
  readonly ashCloud: VolcanicAshCloud;
  readonly remarks: string;
  readonly contacts: string;
  readonly nextNotice: string;
}

export interface ValidationResult<T> {
  readonly isValid: boolean;
  readonly data?: T;
  readonly errors: ReadonlyArray<string>;
}

export interface BenchmarkMetrics {
  readonly language: 'JavaScript' | 'TypeScript' | 'WebAssembly';
  readonly iterations: number;
  readonly totalTimeMs: number;
  readonly avgTimeMicroseconds: number;
  readonly operationsPerSecond: number;
}
