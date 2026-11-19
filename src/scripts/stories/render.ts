// Desenha um slide de Web Story. Todo texto entra como textContent.
import type { Slide } from './tipos';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

const FUNDO_PADRAO = 'linear-gradient(160deg, #ffb347 0%, #fb8300 50%, #c25a00 100%)';

export function renderSlide(slide: Slide, aoClicar?: (href: string) => void) {
  const root = el('div', 'ms-slide');
  root.dataset.vpos = slide.vpos ?? 'bottom';
  root.dataset.align = slide.alinhar ?? 'left';
  root.style.setProperty('--fg', slide.cor ?? '#ffffff');

  const bg = el('div', 'ms-bg');
  if (slide.foto) {
    const img = el('img');
    img.src = slide.foto;
    img.alt = '';
    img.decoding = 'async';
    bg.append(img);
  } else {
    bg.style.background = slide.fundo ?? FUNDO_PADRAO;
  }
  root.append(bg);

  if (slide.foto) {
    const sombra = el('div', 'ms-shade');
    sombra.style.opacity = String((slide.escurecer ?? 35) / 100);
    root.append(sombra);
  } else {
    root.classList.add('sem-foto');
  }

  const c = el('div', 'ms-content');
  if (slide.eyebrow) c.append(el('p', 'ms-eyebrow', slide.eyebrow));
  if (slide.titulo) c.append(el('p', 'ms-title', slide.titulo));
  if (slide.verso) {
    const fig = el('figure', 'ms-verso');
    fig.append(el('blockquote', '', `“${slide.verso.texto}”`), el('figcaption', '', slide.verso.referencia));
    c.append(fig);
  }
  if (slide.texto) c.append(el('p', 'ms-text', slide.texto));
  if (slide.botao) {
    const a = el('a', 'ms-btn', slide.botao.rotulo);
    a.href = slide.botao.href;
    if (/^https?:/.test(slide.botao.href)) { a.target = '_blank'; a.rel = 'noopener'; }
    a.addEventListener('click', (e) => {
      e.stopPropagation();
      if (a.target !== '_blank' && aoClicar) { e.preventDefault(); aoClicar(a.href); }
    });
    c.append(a);
  }
  root.append(c);
  return root;
}

/** Coloca a capa de um story num elemento (bolinha, avatar). */
export function aplicarCapa(alvo: HTMLElement, capa: string) {
  // Capa pode ser uma foto ou uma cor/degradê (story sem foto)
  if (/^(linear-gradient|#|rgb)/.test(capa)) alvo.style.background = capa;
  else alvo.style.background = `center / cover no-repeat url("${capa.replace(/"/g, '')}")`;
}
