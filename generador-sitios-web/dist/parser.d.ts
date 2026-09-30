/**
 * parser.ts — Analizador sintáctico y semántico de documentos PersonalSiteML en TypeScript
 * Transforma un documento XML en un modelo fuertemente tipado SitioPersonalModel.
 */
import { SitioPersonalModel, OpcionesGenerador } from './types';
export declare class PersonalSiteXMLParser {
    private static readonly AVATARES;
    /**
     * Obtiene el texto directo de un elemento hijo o cadena vacía si no existe
     */
    private static getText;
    /**
     * Obtiene un atributo de un elemento
     */
    private static getAttr;
    /**
     * Parsea un documento XML DOM y construye el objeto SitioPersonalModel
     */
    static parseDocument(doc: Document, opciones?: OpcionesGenerador): SitioPersonalModel;
}
