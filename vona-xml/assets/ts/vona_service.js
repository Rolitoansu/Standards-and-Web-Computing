import { VonaValidator } from './vona_validator.js';
export class VonaTypeScriptService {
    parse(cadenaXml) {
        const res = this.parseAndValidate(cadenaXml);
        if (!res.isValid || !res.data) {
            throw new Error(`Validación TypeScript fallida: ${res.errors.join('; ')}`);
        }
        return res.data;
    }
    parseAndValidate(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        if (doc.querySelector('parsererror')) {
            return {
                isValid: false,
                errors: ['Error sintáctico en el documento XML proporcionado.']
            };
        }
        const notices = [];
        const elements = doc.querySelectorAll('vona, VONA, VolcanoObservatoryNoticeForAviation');
        const nodes = elements.length > 0 ? Array.from(elements) : [doc.documentElement];
        for (const node of nodes) {
            const notice = this.extractNoticeFromNode(node);
            const validation = VonaValidator.validateNotice(notice);
            if (validation.isValid && validation.data) {
                notices.push(validation.data);
            }
            else {
                return {
                    isValid: false,
                    errors: validation.errors
                };
            }
        }
        return {
            isValid: true,
            data: notices,
            errors: []
        };
    }
    extractNoticeFromNode(node) {
        const getText = (tag) => {
            const el = node.getElementsByTagName(tag)[0];
            if (el?.textContent)
                return el.textContent.trim();
            const all = node.getElementsByTagName('*');
            for (let i = 0; i < all.length; i++) {
                if ((all[i].localName || '').toLowerCase() === tag.toLowerCase()) {
                    return all[i].textContent?.trim() || '';
                }
            }
            return '';
        };
        let lat = 0;
        let lon = 0;
        const pos = getText('pos');
        if (pos) {
            const parts = pos.split(/\s+/);
            if (parts.length >= 2) {
                lat = parseFloat(parts[0]);
                lon = parseFloat(parts[1]);
            }
        }
        else {
            lat = parseFloat(getText('latitude')) || 0;
            lon = parseFloat(getText('longitude')) || 0;
        }
        const elevM = parseFloat(getText('summitElevation')) || parseFloat(getText('elevation')) || 0;
        const elevFt = Math.round(elevM * 3.28084);
        const volcano = {
            name: getText('name') || 'Volcán Sin Nombre',
            number: getText('number') || 'N/A',
            area: getText('area') || getText('subregion') || 'Región no especificada',
            summitElevationMeters: elevM,
            summitElevationFeet: elevFt,
            location: { latitude: lat, longitude: lon }
        };
        const altASL = parseFloat(getText('aboveSeaLevel')) || parseFloat(getText('verticalExtent')) || 0;
        const altSummit = parseFloat(getText('aboveSummit')) || (altASL > elevM ? altASL - elevM : 0);
        const speed = parseFloat(getText('movementSpeed')) || 30;
        const ashCloud = {
            altitudeMetersASL: altASL,
            altitudeMetersAboveSummit: altSummit,
            flightLevel: getText('flightLevel') || (altASL > 0 ? `FL${Math.round((altASL * 3.28084) / 100)}` : 'N/A'),
            direction: getText('movementDirection') || 'ENE',
            headingDegrees: 90,
            speedKmH: speed,
            dispersionDistanceKm: parseFloat(getText('dispersionDistance')) || Math.max(30, Math.round(speed * 1.3)),
            characteristics: getText('cloudCharacteristics') || getText('remarks') || 'Emisión continua.'
        };
        const rawColor = (getText('currentColourCode') || getText('current') || 'UNKNOWN').toUpperCase();
        const currentColor = VonaValidator.isAviationColorCode(rawColor) ? rawColor : 'UNKNOWN';
        const rawPrev = (getText('previousColourCode') || getText('previous') || 'UNKNOWN').toUpperCase();
        const prevColor = VonaValidator.isAviationColorCode(rawPrev) ? rawPrev : 'UNKNOWN';
        return {
            noticeNumber: getText('noticeNumber') || 'N/A',
            issueTimeUTC: getText('timePosition') || getText('issueTime') || new Date().toISOString(),
            volcano,
            currentColorCode: currentColor,
            previousColorCode: prevColor,
            issuingObservatory: getText('observatory') || getText('source') || 'Observatorio Estatal',
            volcanicActivitySummary: getText('volcanicActivitySummary') || 'Sin resumen',
            ashCloud,
            remarks: getText('remarks') || 'Sin observaciones',
            contacts: getText('contacts') || getText('contact') || 'Sin contacto',
            nextNotice: getText('nextNotice') || 'Aviso periódico'
        };
    }
}
