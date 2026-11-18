// Gera favicon, ícones e imagem padrão de compartilhamento (Open Graph).
// Rode com: node scripts/gerar-imagens.mjs
import sharp from 'sharp';

const logo = 'src/assets/logo/logo-clara.png';
const pub = (f) => `public/${f}`;

// Favicons (logo sobre fundo creme, com margem)
for (const [tam, nome] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icone-192.png'], [512, 'icone-512.png']]) {
  const interno = Math.round(tam * 0.84);
  const img = await sharp(logo).resize(interno, interno, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: tam, height: tam, channels: 4, background: '#fffaf4' } })
    .composite([{ input: img, gravity: 'center' }]).png().toFile(pub(nome));
}

// Open Graph 1200x630
const logoOg = await sharp(logo).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const texto = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#fffaf4"/>
  <rect x="0" y="600" width="1200" height="30" fill="#fb8300"/>
  <text x="440" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="#2a1d16">Igreja MART</text>
  <text x="440" y="310" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#5b4a40">Ministério Apostólico Restauração do Templo</text>
  <text x="440" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#b25200">São Caetano do Sul · SP</text>
  <text x="440" y="450" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#5b4a40">Dom 18h · Ter 20h · Qua 15h30</text>
</svg>`);
await sharp(texto).composite([{ input: logoOg, left: 90, top: 160 }]).jpeg({ quality: 88 }).toFile(pub('og-padrao.jpg'));
console.log('Imagens geradas em public/');
