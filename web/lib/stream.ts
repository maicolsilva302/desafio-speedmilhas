import { API_URL, ApiError, CLIENT_TIMEOUT_MS } from './api';
import type { SearchQuery, SearchResponse, StreamQuote } from './types';

export interface StreamHandlers {
  onOfertas: (quotes: StreamQuote[]) => void;
  onProgresso: (concluidos: number, total: number) => void;
}

export async function buscarComStream(
  query: SearchQuery,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const params = new URLSearchParams({
    origin: query.origin,
    destination: query.destination,
    date: query.date,
  }).toString();

  const response = await fetch(`${API_URL}/search/stream?${params}`, {
    headers: { accept: 'text/event-stream' },
    signal: combined,
  });

  if (!response.ok || !response.body) {
    throw new ApiError('stream indisponível', 'STREAM_UNAVAILABLE');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let envelope: SearchResponse | null = null;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let corte = buffer.indexOf('\n\n');

      while (corte !== -1) {
        const evento = parseSse(buffer.slice(0, corte));

        buffer = buffer.slice(corte + 2);

        if (evento?.type === 'ofertas') {
          handlers.onOfertas((evento.data as { quotes: StreamQuote[] }).quotes);
        } else if (evento?.type === 'progresso') {
          const { concluidos, total } = evento.data as {
            concluidos: number;
            total: number;
          };

          handlers.onProgresso(concluidos, total);
        } else if (evento?.type === 'done') {
          envelope = evento.data as SearchResponse;
        }

        corte = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }

  if (!envelope) {
    throw new ApiError('stream encerrado sem resultado', 'STREAM_INCOMPLETE');
  }

  return envelope;
}

interface EventoSse {
  type: string;
  data: unknown;
}

function parseSse(bruto: string): EventoSse | null {
  let type = 'message';
  const dados: string[] = [];

  for (const linha of bruto.split('\n')) {
    if (linha.startsWith('event:')) {
      type = linha.slice(6).trim();
    } else if (linha.startsWith('data:')) {
      dados.push(linha.slice(5).trim());
    }
  }

  if (dados.length === 0) {
    return null;
  }

  try {
    return { type, data: JSON.parse(dados.join('\n')) as unknown };
  } catch {
    return null;
  }
}
