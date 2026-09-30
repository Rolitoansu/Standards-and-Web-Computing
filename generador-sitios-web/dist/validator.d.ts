/**
 * validator.ts — Validador semántico y estructural en TypeScript para PersonalSiteML
 */
import { SitioPersonalModel } from './types';
export interface ValidacionResultado {
    esValido: boolean;
    errores: string[];
    avisos: string[];
}
export declare class PersonalSiteValidator {
    /**
     * Valida semánticamente el modelo parseado contra las reglas del esquema
     */
    static validarModelo(sitio: SitioPersonalModel): ValidacionResultado;
}
