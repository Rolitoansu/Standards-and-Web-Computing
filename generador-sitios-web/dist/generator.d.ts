/**
 * generator.ts — Motor de generación de HTML5 y CSS en TypeScript
 * Transforma el modelo SitioPersonalModel en los 5 archivos HTML, CSS y scripts del sitio estático.
 */
import { SitioPersonalModel } from './types';
export declare class PersonalSiteHTMLGenerator {
    /**
     * Escapa caracteres especiales de HTML
     */
    private static escapeHtml;
    /**
     * Genera el bloque <head> común
     */
    private static generarHead;
    /**
     * Genera la cabecera y barra de navegación
     */
    private static generarHeaderNav;
    /**
     * Genera el pie de página
     */
    private static generarFooter;
    /**
     * Genera index.html (Página de Inicio)
     */
    static generarIndexHTML(sitio: SitioPersonalModel): string;
    /**
     * Genera about.html (Página Sobre mí)
     */
    static generarAboutHTML(sitio: SitioPersonalModel): string;
    /**
     * Genera projects.html (Página de Proyectos)
     */
    static generarProjectsHTML(sitio: SitioPersonalModel): string;
    /**
     * Genera cv.html (Página de Currículum)
     */
    static generarCvHTML(sitio: SitioPersonalModel): string;
    /**
     * Genera contact.html (Página de Contacto)
     */
    static generarContactHTML(sitio: SitioPersonalModel): string;
}
