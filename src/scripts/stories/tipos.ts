// Tipos dos Web Stories da MART (usados no build e no navegador).

export type Slide = {
  /** URL da foto de fundo (já otimizada no build). Sem foto, usa o degradê. */
  foto?: string;
  /** Degradê/cor CSS usado quando não há foto. */
  fundo?: string;
  /** 0 a 80: quanto escurecer a foto para o texto aparecer. */
  escurecer?: number;
  eyebrow?: string;
  titulo?: string;
  texto?: string;
  /** Versículo em destaque (letra serifada) */
  verso?: { texto: string; referencia: string };
  botao?: { rotulo: string; href: string };
  alinhar?: 'left' | 'center';
  vpos?: 'top' | 'center' | 'bottom';
  /** Cor do texto (padrão: branco) */
  cor?: string;
  /** Segundos na tela (padrão: 6) */
  duracao?: number;
};

export type Story = {
  id: string;
  titulo: string;
  capa: string;
  slides: Slide[];
};
