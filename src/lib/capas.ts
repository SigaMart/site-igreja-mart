// Capas de compartilhamento (a imagem que aparece no WhatsApp, Facebook, X...).
// Geradas no build em 1200x630: satori desenha o layout e o sharp converte para JPG.
// Use SOMENTE no build (endpoint src/pages/capas/[...rota].ts).
import satori from 'satori';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { SITE } from '../config/site';

// Caminhos a partir da raiz do projeto (o build empacota este arquivo em outra pasta)
const RAIZ = process.cwd();
const require = createRequire(join(RAIZ, 'package.json'));
const W = 1200, H = 630;
const COR = { creme: '#fff8ef', tinta: '#2a1d16', suave: '#5b4a40', laranja: '#fb8300', laranjaEsc: '#b25200' };
const CW = W - 144; // largura útil das capas de versículo
const DOMINIO = SITE.url.replace(/^https?:\/\//, '');

export type Capa =
  | { tipo: 'pagina'; eyebrow: string; titulo: string; texto?: string; foto: string }
  | { tipo: 'verso'; eyebrow: string; texto: string; referencia: string }
  | { tipo: 'livro'; eyebrow: string; titulo: string; subtitulo?: string; trecho?: string };

// ---------- Fontes e imagens (carregadas uma vez)
const fonte = (pacote: string, arquivo: string) => readFile(require.resolve(`${pacote}/files/${arquivo}`));
let recursos: Promise<{ fontes: any[]; logo: string }> | null = null;
function carregarRecursos() {
  recursos ??= (async () => {
    const [j500, j700, j800, f600] = await Promise.all([
      fonte('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-500-normal.woff'),
      fonte('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-700-normal.woff'),
      fonte('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff'),
      fonte('@fontsource/fraunces', 'fraunces-latin-600-italic.woff'),
    ]);
    const logoArq = join(RAIZ, 'src/assets/logo/logo-clara.png');
    const logo = await sharp(logoArq).resize({ height: 180 }).png().toBuffer();
    return {
      fontes: [
        { name: 'Jakarta', data: j500, weight: 500, style: 'normal' },
        { name: 'Jakarta', data: j700, weight: 700, style: 'normal' },
        { name: 'Jakarta', data: j800, weight: 800, style: 'normal' },
        { name: 'Fraunces', data: f600, weight: 600, style: 'italic' },
      ],
      logo: `data:image/png;base64,${logo.toString('base64')}`,
    };
  })();
  return recursos;
}

/** Caminho no disco de uma imagem importada (ImageMetadata) ou de um arquivo em src/assets */
export function caminhoImagem(img: ImageMetadata | string) {
  if (typeof img === 'string') return join(RAIZ, 'src/assets', img);
  const fs = (img as any).fsPath as string | undefined;
  if (fs) return fs;
  // Em dev o src vem como "/@fs/C:/...jpg?origWidth=..."
  return decodeURIComponent(img.src.replace(/^\/@fs\//, '').split('?')[0]);
}

const fotoBase64 = async (arquivo: string) =>
  `data:image/jpeg;base64,${(await sharp(arquivo).resize(500, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82 }).toBuffer()).toString('base64')}`;

// ---------- Mini "JSX" para o satori
type No = { type: string; props: Record<string, any> };
const h = (type: string, style: Record<string, any>, ...filhos: (No | string | null | false | undefined)[]): No => ({
  type,
  props: { style: { display: 'flex', ...style }, children: filhos.filter(Boolean) },
});
const img = (src: string, style: Record<string, any>): No => ({ type: 'img', props: { src, style } });

export const cortar = (t: string, max: number) => (t.length <= max ? t : t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '') + '…');

const marca = (logo: string, tam = 1) =>
  h('div', { alignItems: 'center', gap: 16 * tam },
    img(logo, { height: 64 * tam }),
    h('div', { flexDirection: 'column', lineHeight: 1.15 },
      h('span', { fontSize: 30 * tam, fontWeight: 800, color: COR.tinta }, SITE.nome),
      h('span', { fontSize: 19 * tam, fontWeight: 500, color: COR.suave }, 'Restauração do Templo'),
    ),
  );

const rodape = () =>
  h('div', { alignItems: 'center', justifyContent: 'space-between', width: CW, fontSize: 21, color: COR.suave, fontWeight: 500 },
    h('span', { alignItems: 'center', gap: 10 },
      h('span', { width: 10, height: 10, borderRadius: 10, background: COR.laranja }),
      'Bairro Fundação · São Caetano do Sul',
    ),
    h('span', { fontWeight: 800, color: COR.laranjaEsc }, DOMINIO),
  );

const eyebrow = (t: string) => h('span', { fontSize: 20, fontWeight: 800, letterSpacing: 3, color: COR.laranjaEsc, textTransform: 'uppercase' }, t);

async function layout(c: Capa, logo: string): Promise<No> {
  if (c.tipo === 'pagina') {
    const tam = c.titulo.length > 46 ? 48 : c.titulo.length > 30 ? 56 : 64;
    return h('div', { width: W, height: H, background: COR.creme, fontFamily: 'Jakarta' },
      h('div', { position: 'relative', width: 700, height: H },
        h('div', { position: 'absolute', left: 64, top: 54, width: 580, height: H - 100, flexDirection: 'column', justifyContent: 'space-between' },
        marca(logo),
        h('div', { flexDirection: 'column', gap: 16 },
          eyebrow(c.eyebrow),
          h('span', { fontSize: tam, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, color: COR.tinta }, c.titulo),
          c.texto ? h('span', { fontSize: 24, fontWeight: 500, lineHeight: 1.4, color: COR.suave }, c.texto) : null,
        ),
        h('div', { alignItems: 'center', gap: 10, fontSize: 21, color: COR.suave, fontWeight: 500 },
          h('span', { width: 10, height: 10, borderRadius: 10, background: COR.laranja }),
          'Bairro Fundação · São Caetano do Sul',
        ),
        ),
      ),
      h('div', { position: 'relative', width: 500, height: H },
        img(await fotoBase64(c.foto), { width: 500, height: H, objectFit: 'cover' }),
        h('div', { position: 'absolute', left: 0, top: 0, width: 8, height: H, background: COR.laranja }),
        h('div', { position: 'absolute', right: 28, bottom: 28, padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', fontSize: 20, fontWeight: 800, color: COR.laranjaEsc }, DOMINIO),
      ),
    );
  }

  // Fundo creme em degradê; o conteúdo fica numa área fixa com margens
  const quadro = (...filhos: (No | null)[]) =>
    h('div', { width: W, height: H, fontFamily: 'Jakarta', backgroundImage: 'linear-gradient(150deg, #fffaf3 0%, #ffe6c7 100%)' },
      h('div', { position: 'absolute', left: 72, top: 50, width: CW, height: H - 96, flexDirection: 'column', justifyContent: 'space-between' }, ...filhos),
    );
  const topo = h('div', { alignItems: 'center', justifyContent: 'space-between', width: CW }, marca(logo, 0.8), eyebrow(c.eyebrow));

  if (c.tipo === 'verso') {
    const t = cortar(c.texto, 300);
    const tam = t.length < 90 ? 52 : t.length < 150 ? 44 : t.length < 220 ? 38 : 32;
    return quadro(
      topo,
      h('div', { flexDirection: 'column', gap: 18, width: CW },
        h('span', { fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 120, lineHeight: 0.6, height: 50, color: COR.laranja }, '“'),
        h('span', { fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 600, fontSize: tam, lineHeight: 1.28, color: COR.tinta }, t),
        h('span', { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: COR.laranjaEsc, textTransform: 'uppercase' }, c.referencia),
      ),
      rodape(),
    );
  }

  return quadro(
    topo,
    h('div', { flexDirection: 'column', gap: 14, width: CW },
      h('span', { fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: COR.tinta }, c.titulo),
      c.subtitulo ? h('span', { fontSize: 24, fontWeight: 700, color: COR.laranjaEsc }, c.subtitulo) : null,
      c.trecho ? h('span', { marginTop: 8, fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 600, fontSize: 32, lineHeight: 1.32, color: COR.suave }, `“${cortar(c.trecho, 170)}”`) : null,
    ),
    rodape(),
  );
}

// ---------- Geração (com cache em disco para builds locais mais rápidos)
const VERSAO = '4';
const PASTA_CACHE = join(RAIZ, 'node_modules/.cache/capas') + '/';

export async function gerarCapa(c: Capa) {
  const chave = createHash('sha1').update(VERSAO + JSON.stringify(c)).digest('hex');
  const arqCache = PASTA_CACHE + chave + '.jpg';
  if (existsSync(arqCache)) return readFile(arqCache);
  const { fontes, logo } = await carregarRecursos();
  const svg = await satori((await layout(c, logo)) as any, { width: W, height: H, fonts: fontes });
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  await mkdir(PASTA_CACHE, { recursive: true }).catch(() => {});
  await writeFile(arqCache, jpg).catch(() => {});
  return jpg;
}
