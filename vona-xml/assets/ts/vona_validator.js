export class VonaValidator {
    static VALID_COLOR_CODES = new Set([
        'RED', 'ORANGE', 'YELLOW', 'GREEN', 'UNKNOWN'
    ]);
    static isAviationColorCode(value) {
        return typeof value === 'string' && VonaValidator.VALID_COLOR_CODES.has(value.toUpperCase());
    }
    static validateCoordinates(coord) {
        const errors = [];
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
    static validateNotice(notice) {
        const errors = [];
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
        }
        else {
            errors.push('Las coordenadas geográficas del volcán son obligatorias.');
        }
        return {
            isValid: errors.length === 0,
            data: errors.length === 0 ? notice : undefined,
            errors
        };
    }
}
