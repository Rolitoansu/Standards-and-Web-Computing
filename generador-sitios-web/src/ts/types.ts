/**
 * types.ts — Definiciones de tipos e interfaces TypeScript para PersonalSiteML
 */

export interface MetadatosAutor {
  nombreCompleto: string;
  nombre: string;
  apellidos: string;
  titular: string;
  lema?: string;
  descripcion: string;
  palabrasClave: string;
  foto: {
    src: string;
    alt: string;
    ancho?: number;
    alto?: number;
    avatar?: 'generico' | 'desarrollador' | 'disenador' | 'personalizado' | string;
  };
}

export interface TemaColor {
  colorPrimario?: string;
  colorPrimarioHover?: string;
  colorPrimarioClaro?: string;
  colorAcento?: string;
  colorFondo?: string;
  colorSuperficie?: string;
}

export interface ContactoInfo {
  email: string;
  ubicacion: string;
  empresa?: string;
  telefono?: string;
  disponibilidad?: string;
}

export interface RedSocial {
  tipo: 'github' | 'linkedin' | 'twitter' | 'email' | 'web' | 'gitlab' | 'youtube' | string;
  url: string;
  usuario: string;
  etiqueta?: string;
}

export interface AccionHero {
  texto: string;
  href: string;
  tipo: 'primario' | 'secundario';
}

export interface MetricaRapida {
  valor: string;
  etiqueta: string;
}

export interface TecnologiaDestacada {
  nombre: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto';
  iconoSrc?: string;
  categoria?: string;
}

export interface PaginaInicio {
  hero: {
    saludo: string;
    subtitulo: string;
    resumen: string;
    acciones: AccionHero[];
  };
  datosRapidos: MetricaRapida[];
  tecnologiasDestacadas: {
    titulo: string;
    descripcion: string;
    items: TecnologiaDestacada[];
  };
}

export interface DatoPersonal {
  etiqueta: string;
  valor: string;
  enlace?: string;
}

export interface InteresAficion {
  titulo: string;
  descripcion: string;
  imagen?: {
    src: string;
    alt: string;
    ancho?: number;
    alto?: number;
  };
}

export interface IdiomaItem {
  nombre: string;
  nivel: string;
  porcentaje?: number;
}

export interface PaginaSobreMi {
  cabecera: {
    titulo: string;
    subtitulo: string;
  };
  trayectoria: {
    titulo: string;
    parrafos: string[];
  };
  datosPersonales: {
    tituloTabla: string;
    datos: DatoPersonal[];
  };
  intereses: {
    titulo: string;
    items: InteresAficion[];
  };
  idiomas: IdiomaItem[];
}

export interface CategoriaFiltro {
  id: string;
  etiqueta: string;
}

export interface EnlaceProyecto {
  tipo: 'demo' | 'codigo' | 'articulo' | 'documentacion' | 'descarga' | string;
  url: string;
  texto: string;
}

export interface ProyectoItem {
  id?: string;
  categoria: string;
  estado: 'completado' | 'en-progreso' | 'mantenimiento' | 'planificado';
  destacado: boolean;
  etiquetaDestacada?: string;
  titulo: string;
  descripcion: string;
  imagen?: {
    src: string;
    alt: string;
    ancho?: number;
    alto?: number;
  };
  tecnologias: string[];
  enlaces: EnlaceProyecto[];
}

export interface PaginaProyectos {
  cabecera: {
    titulo: string;
    subtitulo: string;
  };
  categoriasFiltro: CategoriaFiltro[];
  proyectos: ProyectoItem[];
}

export interface Periodo {
  inicio: string;
  fin: string;
}

export interface PuestoExperiencia {
  cargo: string;
  empresa: string;
  periodo: Periodo;
  descripcion: string;
  logros: string[];
  tecnologias: string[];
}

export interface EstudioFormacion {
  titulo: string;
  institucion: string;
  periodo: Periodo;
  descripcion?: string;
}

export interface ItemCompetencia {
  nombre: string;
  nivel?: number;
}

export interface GrupoCompetencias {
  nombre: string;
  items: ItemCompetencia[];
}

export interface PaginaCurriculum {
  cabecera: {
    titulo: string;
    subtitulo: string;
    descargaPdf?: {
      url: string;
      texto: string;
    };
  };
  ordenSecciones?: ('experiencia' | 'formacion')[];
  experienciaLaboral: PuestoExperiencia[];
  formacionAcademica: EstudioFormacion[];
  competencias: GrupoCompetencias[];
}

export interface CanalContacto {
  tipo: string;
  etiqueta: string;
  valor: string;
  href: string;
}

export interface PaginaContacto {
  cabecera: {
    titulo: string;
    subtitulo: string;
  };
  canales: CanalContacto[];
  disponibilidad?: {
    estado: string;
    descripcion: string;
  };
  formulario?: {
    titulo: string;
    descripcion?: string;
  };
}

export interface SitioPersonalModel {
  idioma: string;
  version: string;
  id?: string;
  metadatos: {
    autor: MetadatosAutor;
    tema?: TemaColor;
    contactoInfo: ContactoInfo;
    redesSociales: RedSocial[];
  };
  paginas: {
    inicio: PaginaInicio;
    sobreMi: PaginaSobreMi;
    proyectos: PaginaProyectos;
    curriculum: PaginaCurriculum;
    contacto: PaginaContacto;
  };
}

export interface ArchivoGenerado {
  ruta: string;
  contenido: string;
  tipo: 'html' | 'css' | 'js';
}

export interface ResultadoGeneracion {
  sitio: SitioPersonalModel;
  archivos: Record<string, string>;
  metricas: {
    totalArchivos: number;
    tamanoTotalBytes: number;
    tiempoGeneracionMs: number;
  };
}

export interface OpcionesGenerador {
  avatarGenerico?: 'avatar-generico.svg' | 'avatar-desarrollador.svg' | 'avatar-disenador.svg' | 'original' | string;
  usarFotosGenericas?: boolean;
}

export interface MetricasWasm {
  motor: 'WebAssembly (WASM)' | 'JavaScript Fallback';
  hashHex: string;
  totalBytes: number;
  totalEtiquetas: number;
  puntuacionComplejidad: number;
  tiempoMs: number;
}
