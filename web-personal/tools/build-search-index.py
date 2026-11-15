#!/usr/bin/env python3
"""Genera assets/js/search-index.js a partir de las páginas HTML del sitio.

Uso (desde la carpeta web-personal):
    python3 tools/build-search-index.py

Crea una entrada por cada <section id> hija directa de <main>. Si una sección
contiene a su vez secciones con id (como el currículum), se crea una entrada
por cada subsección para que el resultado lleve directamente al apartado.
En la página de proyectos se añade además una entrada por proyecto.
El atributo opcional data-buscar de una sección añade palabras clave extra
(sinónimos) que no aparecen en el texto visible.
Solo usa la biblioteca estándar de Python.
"""
import json
import pathlib
import re
from html.parser import HTMLParser

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = ['index.html', 'about.html', 'projects.html', 'cv.html', 'contact.html', 'sitemap.html']
VACIOS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
IGNORAR = {'script', 'style', 'noscript', 'template', 'svg'}


class Nodo:
    def __init__(self, tag, attrs, padre=None):
        self.tag, self.attrs, self.padre, self.hijos = tag, dict(attrs), padre, []

    def texto(self):
        partes = []
        for h in self.hijos:
            if isinstance(h, str):
                partes.append(h)
            elif h.tag not in IGNORAR:
                partes.append(' ' + h.texto() + ' ')
        return re.sub(r'\s+', ' ', ''.join(partes)).strip()

    def buscar(self, pred, profundo=True):
        for h in self.hijos:
            if isinstance(h, Nodo):
                if pred(h):
                    yield h
                    if not profundo:
                        continue
                yield from h.buscar(pred, profundo)

    def primero(self, pred):
        return next(self.buscar(pred), None)


class Analizador(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.raiz = Nodo('#doc', [])
        self.actual = self.raiz

    def handle_starttag(self, tag, attrs):
        n = Nodo(tag, attrs, self.actual)
        self.actual.hijos.append(n)
        if tag not in VACIOS:
            self.actual = n

    def handle_endtag(self, tag):
        n = self.actual
        while n is not self.raiz and n.tag != tag:
            n = n.padre
        if n is not self.raiz:
            self.actual = n.padre

    def handle_data(self, data):
        self.actual.hijos.append(data)


def es_titulo(n):
    return n.tag in ('h1', 'h2', 'h3')


def entrada(titulo, pagina, url, lang, claves, cuerpo):
    return {'t': titulo, 'p': pagina, 'u': url, 'l': lang, 'k': claves.strip(), 'b': cuerpo}


def indexar(ruta, prefijo, lang):
    an = Analizador()
    an.feed(ruta.read_text(encoding='utf-8'))
    doc = an.raiz
    titulo_pag = doc.primero(lambda n: n.tag == 'title').texto()
    pagina = [p for p in titulo_pag.split(' — ') if p.strip() != 'Raúl Antuña']
    pagina = pagina[0] if pagina else 'Raúl Antuña'
    meta = doc.primero(lambda n: n.tag == 'meta' and n.attrs.get('name') == 'keywords')
    claves = meta.attrs.get('content', '') if meta else ''
    main = doc.primero(lambda n: n.tag == 'main')
    url_base = ruta.name
    salida = []

    for sec in main.buscar(lambda n: n.tag == 'section' and 'id' in n.attrs, profundo=False):
        subs = list(sec.buscar(lambda n: n.tag == 'section' and 'id' in n.attrs))
        for s in (subs or [sec]):
            h = s.primero(es_titulo)
            extra = s.attrs.get('data-buscar', '')
            salida.append(entrada(h.texto() if h else pagina, pagina, f"{url_base}#{s.attrs['id']}",
                                  lang, f'{claves} {extra}', s.texto()))
        if ruta.name == 'projects.html':
            for art in sec.buscar(lambda n: n.tag == 'article' and 'data-category' in n.attrs):
                h = art.primero(es_titulo)
                etiquetas = ' '.join(li.texto() for li in art.buscar(lambda n: n.tag == 'li'))
                salida.append(entrada(h.texto(), pagina, f"{url_base}#{sec.attrs['id']}", lang,
                                      f"{art.attrs.get('aria-label', '')} {etiquetas} {art.attrs['data-category']}",
                                      art.texto()))
    for e in salida:
        e['u'] = prefijo + e['u']
    return salida


def main():
    indice = []
    for pag in PAGINAS:
        indice += indexar(RAIZ / pag, '', 'es')
    for pag in PAGINAS:
        indice += indexar(RAIZ / 'en' / pag, '', 'en')
    cuerpo = ',\n'.join(json.dumps(e, ensure_ascii=False, indent=0) for e in indice)
    destino = RAIZ / 'assets' / 'js' / 'search-index.js'
    destino.write_text('// Índice de búsqueda generado automáticamente por tools/build-search-index.py. No editar a mano.\n'
                       'window.INDICE_BUSQUEDA = [\n' + cuerpo + '\n];\n', encoding='utf-8')
    print(f'{len(indice)} entradas escritas en {destino.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
