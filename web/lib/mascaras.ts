const TOKENS: Record<string, RegExp> = {
  '#': /\d/,
  A: /[a-zA-Z]/,
  '*': /[a-zA-Z0-9]/,
};

export function aplicarMascara(valor: string, padrao: string): string {
  let saida = '';
  let indice = 0;

  for (const simbolo of padrao) {
    if (indice >= valor.length) {
      break;
    }

    const regra = TOKENS[simbolo];

    if (!regra) {
      saida += simbolo;

      if (valor[indice] === simbolo) {
        indice += 1;
      }

      continue;
    }

    while (indice < valor.length && !regra.test(valor[indice])) {
      indice += 1;
    }

    if (indice >= valor.length) {
      break;
    }

    saida += valor[indice];
    indice += 1;
  }

  return saida.replace(/[^a-zA-Z0-9]+$/, '');
}

export type TipoDocumento = 'cpf' | 'passaporte';

export interface Documento {
  rotulo: string;
  padrao: string;
  exemplo: string;
  inputMode: 'numeric' | 'text';
  normalizar?: (valor: string) => string;
  valido: (limpo: string) => boolean;
}

export const DOCUMENTOS: Record<TipoDocumento, Documento> = {
  cpf: {
    rotulo: 'CPF',
    padrao: '###.###.###-##',
    exemplo: '000.000.000-00',
    inputMode: 'numeric',
    valido: (limpo) => cpfValido(limpo),
  },

  passaporte: {
    rotulo: 'Passaporte',
    padrao: '*********',
    exemplo: 'AB123456',
    inputMode: 'text',
    normalizar: (valor) => valor.toUpperCase(),
    valido: (limpo) => limpo.length >= 5,
  },
};

export function mascararDocumento(valor: string, tipo: TipoDocumento): string {
  const documento = DOCUMENTOS[tipo];
  const preparado = documento.normalizar ? documento.normalizar(valor) : valor;

  return aplicarMascara(preparado, documento.padrao);
}

export function limparDocumento(valor: string): string {
  return valor.replace(/[^a-zA-Z0-9]/g, '');
}

export function cpfValido(limpo: string): boolean {
  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
    return false;
  }

  const digito = (ate: number): number => {
    let soma = 0;

    for (let i = 0; i < ate; i += 1) {
      soma += Number(limpo[i]) * (ate + 1 - i);
    }

    const resto = (soma * 10) % 11;

    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(limpo[9]) && digito(10) === Number(limpo[10]);
}
