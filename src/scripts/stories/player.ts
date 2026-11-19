// Player de Web Stories em tela cheia: barras de progresso, toque para avançar/voltar,
// segurar para pausar, arrastar para baixo para fechar e coração para curtir.
import type { Slide, Story } from './tipos';
import { aplicarCapa, renderSlide } from './render';
import { registrar } from '../estatisticas';

const ICONE = {
  fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  pausar: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  tocar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  ant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  prox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  coracao: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>',
};

const guardar = {
  ler: <T>(k: string, padrao: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? padrao; } catch { return padrao; } },
  gravar: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } },
};

const VISTOS = 'mart_stories_vistos';
const CURTIDAS = 'mart_stories_curtidas';
export const storiesVistos = (): string[] => guardar.ler(VISTOS, []);
const marcarVisto = (id: string) => guardar.gravar(VISTOS, [...new Set([...storiesVistos(), id])].slice(-100));

export function abrirPlayer(stories: Story[], inicio = 0, aoFechar?: () => void) {
  if (!stories.length) return;
  let si = inicio, i = 0;
  let decorrido = 0, ultimo = 0, raf = 0, pausado = false, timerSegurar = 0, segurando = false;
  const curtidas = new Set<string>(guardar.ler(CURTIDAS, []));

  const root = document.createElement('div');
  root.className = 'ms-player';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Stories da Igreja MART');
  root.innerHTML = `
    <div class="ms-backdrop"></div>
    <button class="ms-nav" data-ant type="button" aria-label="Anterior">${ICONE.ant}</button>
    <div class="ms-frame">
      <div class="ms-bars"></div>
      <div class="ms-head">
        <span class="ms-avatar"></span>
        <span class="ms-who"><b class="ms-name"></b><small>Igreja MART</small></span>
        <span class="ms-spacer"></span>
        <button class="ms-ctl" data-pp type="button" aria-label="Pausar">${ICONE.pausar}</button>
        <button class="ms-ctl" data-x type="button" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="ms-stage"></div>
      <div class="ms-tap ms-tap-ant" aria-hidden="true"></div>
      <div class="ms-tap ms-tap-prox" aria-hidden="true"></div>
      <button class="ms-like" type="button" aria-pressed="false" aria-label="Curtir">${ICONE.coracao}</button>
      <div class="ms-burst" aria-hidden="true"></div>
    </div>
    <button class="ms-nav" data-prox type="button" aria-label="Próximo">${ICONE.prox}</button>`;
  document.body.append(root);
  document.documentElement.classList.add('ms-aberto');

  const $ = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
  const frame = $('.ms-frame'), palco = $('.ms-stage'), barras = $('.ms-bars');
  const pp = $('[data-pp]'), like = $('.ms-like'), burst = $('.ms-burst');
  requestAnimationFrame(() => root.classList.add('in'));

  const story = () => stories[si];
  const slide = (): Slide => story().slides[i];
  const chave = () => `${story().id}:${i}`;

  // ---------- Coração
  function atualizarLike() {
    const on = curtidas.has(chave());
    like.classList.toggle('on', on);
    like.setAttribute('aria-pressed', String(on));
    like.setAttribute('aria-label', on ? 'Descurtir' : 'Curtir');
  }
  function explodir() {
    burst.replaceChildren();
    for (let k = 0; k < 7; k++) {
      const h = document.createElement('i');
      h.innerHTML = ICONE.coracao;
      h.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      h.style.setProperty('--d', `${k * 60}ms`);
      h.style.setProperty('--s', String(0.6 + Math.random() * 0.7));
      burst.append(h);
    }
  }
  function curtir() {
    const k = chave();
    if (curtidas.has(k)) curtidas.delete(k);
    else { curtidas.add(k); explodir(); }
    guardar.gravar(CURTIDAS, [...curtidas].slice(-300));
    like.classList.remove('pop');
    void like.offsetWidth;
    like.classList.add('pop');
    atualizarLike();
  }

  function montarBarras() {
    barras.innerHTML = story().slides.map(() => '<span><i></i></span>').join('');
    barras.querySelectorAll('i').forEach((b, k) => { (b as HTMLElement).style.width = k < i ? '100%' : '0%'; });
  }

  function mostrarStory(k: number, slideIndex = 0) {
    si = k;
    i = slideIndex;
    const s = story();
    $('.ms-name').textContent = s.titulo;
    aplicarCapa($('.ms-avatar'), s.capa);
    marcarVisto(s.id);
    registrar('story', s.id);
    mostrarSlide();
  }

  function mostrarSlide() {
    cancelAnimationFrame(raf);
    const atual = slide();
    // Fundo claro com texto escuro: topo e coração também ficam escuros.
    root.classList.toggle('claro', !atual.foto && !!atual.cor && atual.cor.toLowerCase() !== '#ffffff');
    palco.replaceChildren(renderSlide(slide(), (href) => { fechar(); location.href = href; }));
    burst.replaceChildren();
    montarBarras();
    atualizarLike();
    decorrido = 0;
    ultimo = performance.now();
    setPausado(false);
    raf = requestAnimationFrame(tick);
    const n = story().slides[i + 1] ?? stories[si + 1]?.slides[0];
    if (n?.foto) { const im = new Image(); im.src = n.foto; }
  }

  function tick(t: number) {
    if (!pausado && !segurando) decorrido += t - ultimo;
    ultimo = t;
    const total = (slide().duracao ?? 6) * 1000;
    const barra = barras.children[i]?.firstElementChild as HTMLElement | undefined;
    if (barra) barra.style.width = `${Math.min(100, (decorrido / total) * 100)}%`;
    if (decorrido >= total) { proximo(); return; }
    raf = requestAnimationFrame(tick);
  }

  function proximo() {
    if (i < story().slides.length - 1) { i++; mostrarSlide(); return; }
    if (si < stories.length - 1) mostrarStory(si + 1);
    else fechar();
  }
  function anterior() {
    if (i > 0) { i--; mostrarSlide(); return; }
    if (si > 0) mostrarStory(si - 1, stories[si - 1].slides.length - 1);
    else mostrarSlide();
  }

  function setPausado(p: boolean) {
    pausado = p;
    pp.innerHTML = p ? ICONE.tocar : ICONE.pausar;
    pp.setAttribute('aria-label', p ? 'Continuar' : 'Pausar');
  }

  function fechar() {
    cancelAnimationFrame(raf);
    root.classList.remove('in');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    document.documentElement.classList.remove('ms-aberto');
    setTimeout(() => root.remove(), 220);
    aoFechar?.();
  }

  // Toque rápido avança/volta; segurar pausa.
  const apertar = () => {
    segurando = false;
    timerSegurar = window.setTimeout(() => { segurando = true; root.classList.add('segurando'); }, 220);
  };
  const soltar = (dir: 'ant' | 'prox') => () => {
    clearTimeout(timerSegurar);
    if (segurando) { segurando = false; root.classList.remove('segurando'); return; }
    dir === 'prox' ? proximo() : anterior();
  };
  for (const [sel, dir] of [['.ms-tap-ant', 'ant'], ['.ms-tap-prox', 'prox']] as const) {
    const z = $(sel);
    z.addEventListener('pointerdown', apertar);
    z.addEventListener('pointerup', soltar(dir));
    z.addEventListener('pointerleave', () => { clearTimeout(timerSegurar); if (segurando) { segurando = false; root.classList.remove('segurando'); } });
  }

  // Arrastar para baixo fecha (celular).
  let y0 = 0, dy = 0;
  frame.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
  frame.addEventListener('touchmove', (e) => {
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 10) { frame.style.transform = `translateY(${dy}px)`; frame.style.opacity = String(1 - dy / 600); }
  }, { passive: true });
  frame.addEventListener('touchend', () => {
    if (dy > 120) fechar();
    else { frame.style.transform = ''; frame.style.opacity = ''; }
  });

  $('[data-x]').addEventListener('click', fechar);
  $('.ms-backdrop').addEventListener('click', fechar);
  $('[data-ant]').addEventListener('click', anterior);
  $('[data-prox]').addEventListener('click', proximo);
  pp.addEventListener('click', () => setPausado(!pausado));
  like.addEventListener('click', curtir);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') fechar();
    else if (e.key === 'ArrowRight') proximo();
    else if (e.key === 'ArrowLeft') anterior();
    else if (e.key === ' ') { e.preventDefault(); setPausado(!pausado); }
  };
  const onVis = () => { if (document.hidden) setPausado(true); };
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

  mostrarStory(si);
  ($('[data-x]') as HTMLButtonElement).focus({ preventScroll: true });
}
