// Gera versão da logo padrão para fundo claro: letras brancas "MART" viram grafite.
import sharp from 'sharp';
const { data, info } = await sharp('src/assets/logo/logo-padrao.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
  if (a < 10) continue;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.35 && max > 120) { // pixel branco/acinzentado
    const k = Math.min(1, (0.35 - sat) / 0.2);
    data[i] = Math.round(r * (1 - k) + 0x2a * k);
    data[i + 1] = Math.round(g * (1 - k) + 0x1d * k);
    data[i + 2] = Math.round(b * (1 - k) + 0x16 * k);
  }
}
await sharp(data, { raw: info }).resize({ width: info.width * 3, kernel: 'lanczos3' }).png().toFile('src/assets/logo/logo-clara.png');
await sharp('src/assets/logo/logo-padrao.png').resize({ width: 948, kernel: 'lanczos3' }).png().toFile('src/assets/logo/logo-padrao-3x.png');
console.log('ok');
