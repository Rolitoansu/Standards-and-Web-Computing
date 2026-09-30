/**
 * validator.ts — Validador semántico y estructural en TypeScript para PersonalSiteML
 */
export class PersonalSiteValidator {
    /**
     * Valida semánticamente el modelo parseado contra las reglas del esquema
     */
    static validarModelo(sitio) {
        const errores = [];
        const avisos = [];
        // Validar Metadatos y Autor
        if (!sitio.metadatos?.autor?.nombreCompleto) {
            errores.push('Falta el nombre completo del autor.');
        }
        if (!sitio.metadatos?.autor?.titular) {
            errores.push('Falta el titular profesional del autor.');
        }
        if (!sitio.metadatos?.autor?.descripcion) {
            avisos.push('La descripción para SEO en metadatos está vacía.');
        }
        // Validar estilo de avatar conforme al XSD (TipoAvatar)
        const avatarValido = ['generico', 'desarrollador', 'disenador', 'personalizado', 'avatar-generico.svg', 'avatar-desarrollador.svg', 'avatar-disenador.svg'];
        const avatar = sitio.metadatos?.autor?.foto?.avatar;
        if (avatar && !avatarValido.includes(avatar)) {
            errores.push(`Valor de avatar no válido en el XSD: "${avatar}". Valores permitidos: ${avatarValido.join(', ')}.`);
        }
        // Validar Email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!sitio.metadatos?.contactoInfo?.email || !emailRegex.test(sitio.metadatos.contactoInfo.email)) {
            errores.push(`Email de contacto inválido: "${sitio.metadatos?.contactoInfo?.email || ''}".`);
        }
        // Validar Categorías de Proyectos
        const categoriasIds = new Set();
        categoriasIds.add('all'); // Siempre permitida la categoría comodín
        if (sitio.paginas?.proyectos?.categoriasFiltro) {
            for (const cat of sitio.paginas.proyectos.categoriasFiltro) {
                if (!cat.id) {
                    errores.push('Se encontró una categoría de filtro sin identificador (id).');
                }
                else {
                    categoriasIds.add(cat.id);
                }
            }
        }
        // Comprobar que los proyectos tienen categorías existentes
        if (sitio.paginas?.proyectos?.proyectos) {
            for (const proy of sitio.paginas.proyectos.proyectos) {
                if (!proy.titulo) {
                    errores.push('Hay un proyecto sin título definido.');
                }
                if (!categoriasIds.has(proy.categoria)) {
                    avisos.push(`El proyecto "${proy.titulo || 'Sin título'}" referencia una categoría no listada en filtros: "${proy.categoria}".`);
                }
            }
        }
        // Validar páginas obligatorias
        if (!sitio.paginas?.inicio)
            errores.push('Falta la página de inicio.');
        if (!sitio.paginas?.sobreMi)
            errores.push('Falta la página sobre-mi.');
        if (!sitio.paginas?.proyectos)
            errores.push('Falta la página de proyectos.');
        if (!sitio.paginas?.curriculum)
            errores.push('Falta la página de currículum.');
        if (!sitio.paginas?.contacto)
            errores.push('Falta la página de contacto.');
        return {
            esValido: errores.length === 0,
            errores,
            avisos
        };
    }
}
