export interface Mensagem {
  titulo: string;
  texto: string;
  acao: string | null;
}

const CATALOGO: Record<string, Mensagem> = {
  QUOTE_EXPIRED: {
    titulo: 'Esta oferta expirou',
    texto: 'Os preços em milhas mudam rápido. Refaça a busca para ver os atuais.',
    acao: null,
  },

  QUOTE_NOT_FOUND: {
    titulo: 'Esta oferta não está mais disponível',
    texto: 'Refaça a busca para ver as opções atuais.',
    acao: null,
  },

  QUOTE_NOT_BOOKABLE: {
    titulo: 'Esta oferta não pode ser reservada',
    texto: 'O valor das taxas não foi informado, então não dá para fechar a compra.',
    acao: null,
  },

  CLIENT_REQUIRED: {
    titulo: 'Escolha a agência',
    texto: 'Selecione a agência no topo da página antes de reservar.',
    acao: null,
  },

  ORDER_NOT_FOUND: {
    titulo: 'Reserva não encontrada',
    texto: 'Confira o código da reserva e a agência selecionada.',
    acao: null,
  },

  IDEMPOTENCY_KEY_CONFLICT: {
    titulo: 'Os dados mudaram no meio da reserva',
    texto: 'Feche e comece a reserva de novo para garantir que nada seja duplicado.',
    acao: null,
  },

  NETWORK: {
    titulo: 'Sem conexão no momento',
    texto:
      'Não conseguimos concluir agora. Se você tentar de novo, nada será ' +
      'cobrado nem reservado em duplicidade.',
    acao: 'Tentar de novo',
  },

  VALIDATION_ERROR: {
    titulo: 'Não foi possível fazer esta busca',
    texto: 'Confira origem, destino e data e tente novamente.',
    acao: null,
  },
};

const PADRAO: Mensagem = {
  titulo: 'Não foi possível concluir',
  texto: 'Tente de novo em instantes.',
  acao: 'Tentar de novo',
};

export function mensagemDeErro(code: string): Mensagem {
  return CATALOGO[code] ?? PADRAO;
}

export const BUSCA_SEM_RESULTADO: Mensagem = {
  titulo: 'Nenhuma oferta disponível agora',
  texto:
    'Não encontramos passagens em milhas para esta rota neste momento. ' +
    'Costuma ser passageiro — vale tentar de novo ou escolher outra data.',
  acao: 'Buscar de novo',
};

export function registrarFalha(contexto: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.debug(`[${contexto}]`, error);
}
