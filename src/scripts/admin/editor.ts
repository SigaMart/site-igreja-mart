// Editor visual (Tiptap) para devocionais e blog: negrito, títulos, listas, citações, links,
// imagens (galeria, arrastar ou colar), vídeos (YouTube ou arquivo) e alinhamento.
// O conteúdo vai para um <textarea> escondido como HTML, um bloco por linha (o Markdown do site aceita HTML).
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { marked } from 'marked';
import { abrirGaleria, enviarMidia } from './galeria';

// Vídeo enviado (arquivo): <figure><video controls src></video></figure>
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: null } }),
  parseHTML: () => [{ tag: 'video[src]' }, { tag: 'figure.video', getAttrs: (el) => ({ src: (el as HTMLElement).querySelector('video')?.getAttribute('src') }) }],
  renderHTML: ({ HTMLAttributes }) => ['figure', { class: 'video' }, ['video', mergeAttributes(HTMLAttributes, { controls: 'true', preload: 'metadata', playsinline: 'true' })]],
});

/** HTML do editor -> um bloco por linha, sem linhas em branco (vira um único bloco HTML no Markdown). */
function paraArquivo(html: string) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return [...t.content.children].map((el) => el.outerHTML.replace(/\n+/g, ' ')).filter((l) => l !== '<p></p>').join('\n');
}

/** Markdown antigo ou HTML -> HTML para o editor. */
const paraEditor = (texto: string) => (texto.trim() ? (marked.parse(texto, { async: false }) as string) : '');

type Botao = { r: string; t: string; acao: (e: Editor) => void; ativo?: (e: Editor) => boolean; classe?: string };

const ICONE = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">${d}</svg>`;

export function criarEditor(raiz: HTMLElement) {
  const area = raiz.querySelector<HTMLTextAreaElement>('textarea')!;
  const alvo = raiz.querySelector<HTMLElement>('[data-editor]')!;
  const barra = raiz.querySelector<HTMLElement>('[data-barra-editor]')!;
  let sincronizando = false;

  const inserirImagem = async (arq: File) => {
    const ph = raiz.querySelector<HTMLElement>('[data-enviando]');
    if (ph) ph.hidden = false;
    try { editor.chain().focus().setImage({ src: await enviarMidia(arq) }).run(); }
    catch (e) { alert((e as Error).message); }
    finally { if (ph) ph.hidden = true; }
  };

  const editor = new Editor({
    element: alvo,
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false, heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, defaultProtocol: 'https' } }),
      Image.configure({ inline: false }),
      Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
      Video,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
      Placeholder.configure({ placeholder: 'Escreva ou cole o texto aqui…' }),
    ],
    content: paraEditor(area.value),
    editorProps: {
      attributes: { class: 'prosa editor-visual min-h-[28rem] px-5 py-4 outline-none' },
      // Arrastar ou colar imagens direto no texto
      handleDrop: (_v, ev) => {
        const arq = [...((ev as DragEvent).dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!arq) return false;
        ev.preventDefault(); inserirImagem(arq); return true;
      },
      handlePaste: (_v, ev) => {
        const arq = [...(ev.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!arq) return false;
        ev.preventDefault(); inserirImagem(arq); return true;
      },
    },
    onUpdate: ({ editor: e }) => { sincronizando = true; area.value = paraArquivo(e.getHTML()); area.dispatchEvent(new Event('input', { bubbles: true })); sincronizando = false; },
    onTransaction: () => pintarBarra(),
  });
  area.value = paraArquivo(editor.getHTML());

  // Quando o assistente de IA (ou o Desfazer) troca o texto, o editor acompanha
  area.addEventListener('input', () => { if (!sincronizando) editor.commands.setContent(paraEditor(area.value), { emitUpdate: false }); area.value = sincronizando ? area.value : paraArquivo(editor.getHTML()); });

  const BOTOES: (Botao | '|')[] = [
    { r: 'Desfazer', t: ICONE('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), acao: (e) => e.chain().focus().undo().run() },
    { r: 'Refazer', t: ICONE('<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'), acao: (e) => e.chain().focus().redo().run() },
    '|',
    { r: 'Título', t: '<b>T1</b>', acao: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), ativo: (e) => e.isActive('heading', { level: 2 }) },
    { r: 'Subtítulo', t: '<b class="text-xs">T2</b>', acao: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), ativo: (e) => e.isActive('heading', { level: 3 }) },
    '|',
    { r: 'Negrito', t: '<b>B</b>', acao: (e) => e.chain().focus().toggleBold().run(), ativo: (e) => e.isActive('bold') },
    { r: 'Itálico', t: '<i class="font-serif">I</i>', acao: (e) => e.chain().focus().toggleItalic().run(), ativo: (e) => e.isActive('italic') },
    { r: 'Sublinhado', t: '<u>S</u>', acao: (e) => e.chain().focus().toggleUnderline().run(), ativo: (e) => e.isActive('underline') },
    { r: 'Riscado', t: '<s>R</s>', acao: (e) => e.chain().focus().toggleStrike().run(), ativo: (e) => e.isActive('strike') },
    '|',
    { r: 'Lista', t: ICONE('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'), acao: (e) => e.chain().focus().toggleBulletList().run(), ativo: (e) => e.isActive('bulletList') },
    { r: 'Lista numerada', t: ICONE('<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'), acao: (e) => e.chain().focus().toggleOrderedList().run(), ativo: (e) => e.isActive('orderedList') },
    { r: 'Citação', t: ICONE('<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'), acao: (e) => e.chain().focus().toggleBlockquote().run(), ativo: (e) => e.isActive('blockquote') },
    '|',
    { r: 'Alinhar à esquerda', t: ICONE('<path d="M21 6H3M15 12H3M17 18H3"/>'), acao: (e) => e.chain().focus().setTextAlign('left').run(), ativo: (e) => e.isActive({ textAlign: 'left' }) },
    { r: 'Centralizar', t: ICONE('<path d="M21 6H3M17 12H7M19 18H5"/>'), acao: (e) => e.chain().focus().setTextAlign('center').run(), ativo: (e) => e.isActive({ textAlign: 'center' }) },
    '|',
    {
      r: 'Link', t: ICONE('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
      ativo: (e) => e.isActive('link'),
      acao: (e) => {
        const atual = e.getAttributes('link').href as string | undefined;
        const url = prompt('Endereço do link (deixe vazio para tirar o link):', atual ?? 'https://');
        if (url === null) return;
        if (!url.trim() || url.trim() === 'https://') e.chain().focus().extendMarkRange('link').unsetLink().run();
        else e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      },
    },
    {
      r: 'Imagem', classe: 'gap-1.5 px-2.5', t: `${ICONE('<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>')}<span class="text-xs font-bold">Imagem</span>`,
      acao: async (e) => { const r = await abrirGaleria('midia', 'Inserir imagem'); if (r?.valor) e.chain().focus().setImage({ src: r.valor, alt: '' }).run(); },
    },
    { r: 'Vídeo', classe: 'gap-1.5 px-2.5', t: `${ICONE('<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>')}<span class="text-xs font-bold">Vídeo</span>`, acao: (e) => inserirVideo(e) },
    { r: 'Linha divisória', t: ICONE('<path d="M3 12h18"/>'), acao: (e) => e.chain().focus().setHorizontalRule().run() },
  ];

  barra.replaceChildren(...BOTOES.map((b) => {
    if (b === '|') { const s = document.createElement('span'); s.className = 'mx-1 h-5 w-px bg-tinta/15'; return s; }
    const el = document.createElement('button');
    el.type = 'button'; el.title = b.r; el.setAttribute('aria-label', b.r);
    el.className = `editor-botao ${b.classe ?? ''}`;
    el.innerHTML = b.t;
    el.addEventListener('mousedown', (ev) => ev.preventDefault()); // não perde a seleção
    el.addEventListener('click', () => b.acao(editor));
    (el as HTMLButtonElement & { _b?: Botao })._b = b;
    return el;
  }));
  function pintarBarra() {
    barra.querySelectorAll<HTMLButtonElement & { _b?: Botao }>('button').forEach((el) => el.classList.toggle('ativo', !!el._b?.ativo?.(editor)));
  }

  // Vídeo: link do YouTube ou arquivo do computador
  async function inserirVideo(e: Editor) {
    const dlg = document.createElement('dialog');
    dlg.className = 'm-auto w-[min(92vw,30rem)] rounded-3xl p-6 backdrop:bg-tinta/60';
    dlg.innerHTML = `
      <h3 class="text-lg font-extrabold">Inserir vídeo</h3>
      <label class="adm-rotulo mt-4">Link do YouTube<input data-yt class="adm-campo" placeholder="https://www.youtube.com/watch?v=…"></label>
      <p class="my-3 text-center text-xs font-bold text-tinta-suave">ou</p>
      <label class="btn btn-contorno w-full cursor-pointer">Enviar vídeo do computador (até 20 MB)<input type="file" accept="video/*" hidden data-arq></label>
      <p data-st class="mt-2 text-center text-sm font-semibold text-laranja-700" hidden></p>
      <div class="mt-5 flex justify-end gap-2"><button type="button" data-cancelar class="btn btn-contorno">Cancelar</button><button type="button" data-ok class="btn btn-primario">Inserir</button></div>`;
    document.body.append(dlg);
    const fechar = () => { dlg.close(); dlg.remove(); };
    dlg.querySelector('[data-cancelar]')!.addEventListener('click', fechar);
    dlg.querySelector('[data-ok]')!.addEventListener('click', () => {
      const url = dlg.querySelector<HTMLInputElement>('[data-yt]')!.value.trim();
      if (!url) return;
      // Dentro de citação/lista o YouTube não entra: nesse caso vai para o fim do texto
      const ok = e.chain().focus().setYoutubeVideo({ src: url }).run() || e.chain().focus('end').setYoutubeVideo({ src: url }).run();
      if (!ok) { alert('Link do YouTube não reconhecido.'); return; }
      fechar();
    });
    dlg.querySelector<HTMLInputElement>('[data-arq]')!.addEventListener('change', async (ev) => {
      const arq = (ev.target as HTMLInputElement).files?.[0];
      if (!arq) return;
      const st = dlg.querySelector<HTMLElement>('[data-st]')!;
      st.hidden = false; st.textContent = 'Enviando o vídeo…';
      try {
        const src = await enviarMidia(arq);
        e.chain().focus().insertContent({ type: 'video', attrs: { src } }).run();
        fechar();
      } catch (er) { st.textContent = (er as Error).message; }
    });
    dlg.showModal();
  }

  pintarBarra();
  return editor;
}
