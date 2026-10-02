/**
 * index.ts — Punto de entrada del módulo TypeScript para PersonalSiteML
 */
import { PersonalSiteXMLParser } from './parser.js';
import { PersonalSiteHTMLGenerator } from './generator.js';
import { PersonalSiteValidator } from './validator.js';
export * from './types.js';
export * from './parser.js';
export * from './validator.js';
export * from './generator.js';
export function parseXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const error = doc.querySelector('parsererror');
    if (error) {
        throw new Error('Error de análisis XML: ' + (error.textContent || 'Sintaxis inválida'));
    }
    return doc;
}
export function extraerDatos(doc, opciones = {}) {
    const datos = PersonalSiteXMLParser.parseDocument(doc, opciones);
    datos.autor = datos.metadatos.autor;
    return datos;
}
export function generarSitioDesdeXml(xmlString, opciones = {}) {
    const doc = parseXml(xmlString);
    const datos = extraerDatos(doc, opciones);
    const validacion = PersonalSiteValidator.validarModelo(datos);
    if (!validacion.esValido) {
        console.warn('Validación TypeScript:', validacion.errores);
    }
    return {
        datos,
        validacion,
        paginas: {
            'index.html': PersonalSiteHTMLGenerator.generarIndexHTML(datos),
            'about.html': PersonalSiteHTMLGenerator.generarAboutHTML(datos),
            'projects.html': PersonalSiteHTMLGenerator.generarProjectsHTML(datos),
            'cv.html': PersonalSiteHTMLGenerator.generarCvHTML(datos),
            'contact.html': PersonalSiteHTMLGenerator.generarContactHTML(datos)
        }
    };
}
export const PersonalSiteGenerator = {
    parseXml,
    extraerDatos,
    generarSitioDesdeXml
};
if (typeof window !== 'undefined') {
    window.PersonalSiteGenerator = PersonalSiteGenerator;
}
if (typeof globalThis !== 'undefined') {
    globalThis.PersonalSiteGenerator = PersonalSiteGenerator;
}
