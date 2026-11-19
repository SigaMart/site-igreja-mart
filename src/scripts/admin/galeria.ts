// Galeria de imagens do painel: escolher uma foto do site ou enviar uma nova
// (botão, arrastar e soltar, ou colar com Ctrl+V).
//  - modo 'midia': envia na hora para /api/admin/midia e devolve a URL pública (stories).
//  - modo 'site':  devolve o caminho da foto do site ou o arquivo escolhido, que vai junto com o formulário (blog).

export type Escolha = { valor?: string; arquivo?: File; previa: string; nome: string };
type Foto = { nome: string; foto: string; mini: string };

let fotos: Promise<Foto[]> | null = null;
const carregarFotos = () => (fotos ??= fetch('/dados/fotos.json').then((r) => r.json()).catch(() => { fotos = null; return []; }));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function enviarMidia(arquivo: File): Promise<string> {
  const fd = new FormData();
  fd.append('arquivo', arquivo);
  const r = await fetch('/api/admin/midia/', { method: 'POST', body: fd }).then((x) => x.json());
  if (r.erro) throw new Error(r.erro);
  return r.url;
}

export function abrirGaleria(modo: 'midia' | 'site', titulo = 'Escolher imagem'): Promise<Escolha | null> {
  return new Promise((resolver) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'm-auto w-[min(94vw,52rem)] rounded-3xl p-0 backdrop:bg-tinta/60';
    dlg.innerHTML = `
      <div class="flex items-center justify-between gap-3 border-b border-tinta/8 px-5 py-4">
        <h3 class="text-lg font-extrabold">${esc(titulo)}</h3>
        <button type="button" data-fechar class="btn btn-contorno adm-btn-p">Fechar</button>
      </div>
      <div class="p-5">
        <label data-zona class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-tinta/15 bg-creme px-4 py-6 text-center text-sm transition">
          <b>Arraste uma imagem aqui, cole (Ctrl+V) ou clique para enviar do computador</b>
          <span class="text-xs text-tinta-suave">JPG, PNG ou WebP</span>
          <input type="file" accept="image/*" hidden data-arquivo>
        </label>
        <p data-status class="mt-2 hidden text-center text-sm font-semibold text-laranja-700"></p>
        <p class="mt-5 mb-2 text-sm font-bold">Fotos do site</p>
        <div data-fotos class="grid max-h-[50vh] grid-cols-3 gap-2 overflow-auto sm:grid-cols-5">
          <p class="col-span-full text-sm text-tinta-suave">Carregando…</p>
        </div>
      </div>`;
    document.body.append(dlg);
    const zona = dlg.querySelector<HTMLElement>('[data-zona]')!;
    const status = dlg.querySelector<HTMLElement>('[data-status]')!;
    let feito = false;
    const fim = (r: Escolha | null) => { if (feito) return; feito = true; document.removeEventListener('paste', colar); dlg.close(); dlg.remove(); resolver(r); };

    async function usarArquivo(arq?: File | null) {
      if (!arq) return;
      if (!arq.type.startsWith('image/')) { status.textContent = 'Escolha um arquivo de imagem.'; status.classList.remove('hidden'); return; }
      const previa = URL.createObjectURL(arq);
      if (modo === 'site') return fim({ arquivo: arq, previa, nome: arq.name });
      status.textContent = 'Enviando…'; status.classList.remove('hidden');
      try { fim({ valor: await enviarMidia(arq), previa, nome: arq.name }); }
      catch (e) { status.textContent = (e as Error).message; }
    }
    const colar = (e: ClipboardEvent) => { const arq = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/')); if (arq) { e.preventDefault(); usarArquivo(arq); } };
    document.addEventListener('paste', colar);

    dlg.querySelector<HTMLInputElement>('[data-arquivo]')!.addEventListener('change', (e) => usarArquivo((e.target as HTMLInputElement).files?.[0]));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('border-laranja-500', 'bg-laranja-50'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('border-laranja-500', 'bg-laranja-50'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('border-laranja-500', 'bg-laranja-50'); usarArquivo(e.dataTransfer?.files[0]); });
    dlg.querySelector('[data-fechar]')!.addEventListener('click', () => fim(null));
    dlg.addEventListener('cancel', () => fim(null));

    carregarFotos().then((lista) => {
      const grade = dlg.querySelector<HTMLElement>('[data-fotos]')!;
      grade.replaceChildren(...lista.map((f) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = f.nome;
        b.className = 'aspect-square overflow-hidden rounded-xl ring-laranja-500 ring-offset-2 hover:ring-2 focus:ring-2';
        b.innerHTML = `<img src="${f.mini}" alt="" loading="lazy" class="size-full object-cover">`;
        b.onclick = () => fim(modo === 'site'
          ? { valor: `../../assets/fotos/${f.nome}`, previa: f.mini, nome: f.nome }
          : { valor: f.foto, previa: f.mini, nome: f.nome });
        return b;
      }));
    });
    dlg.showModal();
  });
}

/** Liga um campo de imagem (componente SeletorImagem.astro). */
export function ligarSeletores(raiz: ParentNode = document) {
  raiz.querySelectorAll<HTMLElement>('[data-seletor-imagem]').forEach((el) => {
    if (el.dataset.ligado) return;
    el.dataset.ligado = '1';
    const modo = el.dataset.modo as 'midia' | 'site';
    const valor = el.querySelector<HTMLInputElement>('[data-valor]')!;
    const arquivo = el.querySelector<HTMLInputElement>('[data-arquivo-form]');
    const img = el.querySelector<HTMLImageElement>('[data-previa]')!;
    const vazio = el.querySelector<HTMLElement>('[data-vazio]')!;
    const nome = el.querySelector<HTMLElement>('[data-nome]')!;

    const aplicar = (r: Escolha) => {
      img.src = r.previa; img.hidden = false; vazio.hidden = true; nome.textContent = r.nome;
      if (r.arquivo && arquivo) {
        const dt = new DataTransfer(); dt.items.add(r.arquivo); arquivo.files = dt.files;
        valor.value = '';
      } else {
        valor.value = r.valor ?? '';
        if (arquivo) arquivo.value = '';
      }
      el.dispatchEvent(new CustomEvent('imagem', { bubbles: true, detail: r }));
    };
    el.querySelector('[data-escolher]')!.addEventListener('click', async () => {
      const r = await abrirGaleria(modo);
      if (r) aplicar(r);
    });
    // Arrastar direto em cima do campo
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('ring-2', 'ring-laranja-400'); });
    el.addEventListener('dragleave', () => el.classList.remove('ring-2', 'ring-laranja-400'));
    el.addEventListener('drop', async (e) => {
      e.preventDefault(); el.classList.remove('ring-2', 'ring-laranja-400');
      const arq = e.dataTransfer?.files[0];
      if (!arq?.type.startsWith('image/')) return;
      if (modo === 'site') aplicar({ arquivo: arq, previa: URL.createObjectURL(arq), nome: arq.name });
      else { nome.textContent = 'Enviando…'; try { aplicar({ valor: await enviarMidia(arq), previa: URL.createObjectURL(arq), nome: arq.name }); } catch (er) { nome.textContent = (er as Error).message; } }
    });
  });
}
