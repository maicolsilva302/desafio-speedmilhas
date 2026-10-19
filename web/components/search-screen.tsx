'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, search, secondsSince } from '../lib/api';
import { cityOf, formatDate } from '../lib/airports';
import { registrarFalha } from '../lib/mensagens';
import { mesclarOfertas } from '../lib/ordenacao';
import { guardarCache, lerCache, segundosAteExpirar } from '../lib/search-cache';
import { lembrarBusca, reservasFeitas, ultimaBusca } from '../lib/sessao';
import { buscarComStream, type StreamHandlers } from '../lib/stream';
import type {
  Pedido,
  Quote,
  SearchQuery,
  SearchResponse,
  SearchUiState,
  StreamQuote,
} from '../lib/types';
import { ProgressoBusca, SkeletonOfertas } from './progresso-busca';
import { QuoteCard } from './quote-card';
import { SearchForm } from './search-form';
import { EmptyResult, IdleState, IndisponivelState } from './states';

const RETRY_MS = 400;

const FALHA_RAPIDA_MS = 2000;

const PARCEIROS_ESPERADOS = 3;

export function SearchScreen({ initialDate }: { initialDate: string }) {
  const [pedido, setPedido] = useState<(Pedido & { versao: number }) | null>(null);
  const [carregando, setCarregando] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ultimo = ultimaBusca();

    if (ultimo) {
      setPedido({ ...ultimo, versao: 0 });
    }
  }, []);

  const marcarCarregando = useCallback((trecho: string, valor: boolean) => {
    setCarregando((atual) => (atual[trecho] === valor ? atual : { ...atual, [trecho]: valor }));
  }, []);

  function buscar(novo: Pedido): void {
    lembrarBusca(novo);
    setPedido((atual) => ({ ...novo, versao: (atual?.versao ?? 0) + 1 }));
  }

  return (
    <div className="space-y-5">
      <SearchForm
        initialDate={initialDate}
        onSearch={buscar}
        loading={Object.values(carregando).some(Boolean)}
      />

      {!pedido && <IdleState />}

      {pedido && (
        <section aria-label="Ida" className="space-y-3">
          {pedido.volta && <h2 className="text-base font-semibold text-slate-900">Ida</h2>}
          <BuscaTrecho
            trecho="ida"
            query={pedido.ida}
            versao={pedido.versao}
            onCarregando={marcarCarregando}
          />
        </section>
      )}

      {pedido?.volta && (
        <section aria-label="Volta" className="space-y-3 border-t border-slate-200 pt-5">
          <h2 className="text-base font-semibold text-slate-900">Volta</h2>
          <BuscaTrecho
            trecho="volta"
            query={pedido.volta}
            versao={pedido.versao}
            onCarregando={marcarCarregando}
          />
        </section>
      )}
    </div>
  );
}

function BuscaTrecho({
  trecho,
  query,
  versao,
  onCarregando,
}: {
  trecho: string;
  query: SearchQuery;
  versao: number;
  onCarregando: (trecho: string, valor: boolean) => void;
}) {
  const restaurado = useRef<SearchResponse | null>(versao === 0 ? lerCache(query) : null);

  const [state, setState] = useState<SearchUiState>(() =>
    restaurado.current ? { kind: 'pronto', result: restaurado.current } : { kind: 'idle' },
  );

  const [reservadas] = useState<Set<string>>(reservasFeitas);

  const ultimaQuery = useRef<SearchQuery | null>(null);
  const emVoo = useRef<AbortController | null>(null);

  const buscar = useCallback(
    async (query: SearchQuery, manter?: SearchResponse): Promise<void> => {
      emVoo.current?.abort();

      const controller = new AbortController();

      emVoo.current = controller;
      ultimaQuery.current = query;

      const startedAt = Date.now();
      const anterior = manter ?? lerCache(query);

      const atualizar = (
        transformar: (atual: Extract<SearchUiState, { kind: 'buscando' }>) => SearchUiState,
      ): void => {
        if (controller.signal.aborted) {
          return;
        }

        setState((atual) =>
          atual.kind === 'buscando' && atual.startedAt === startedAt
            ? transformar(atual)
            : atual,
        );
      };

      const emAndamento = (): SearchUiState => ({
        kind: 'buscando',
        query,
        startedAt,
        parciais: [],
        concluidos: 0,
        total: PARCEIROS_ESPERADOS,
        anterior,
      });

      setState(emAndamento());

      const handlers: StreamHandlers = {
        onOfertas: (novas: StreamQuote[]) =>
          atualizar((atual) => ({
            ...atual,
            parciais: mesclarOfertas(atual.parciais, novas),
          })),

        onProgresso: (concluidos, total) =>
          atualizar((atual) => ({ ...atual, concluidos, total })),
      };

      for (let tentativa = 0; tentativa < 2; tentativa += 1) {
        const inicioDaTentativa = Date.now();

        try {
          const result = await executar(query, controller.signal, handlers);

          if (controller.signal.aborted) {
            return;
          }

          if (result.suppliers.every((supplier) => supplier.status !== 'error')) {
            guardarCache(query, result);
            setState({ kind: 'pronto', result });

            return;
          }

          if (tentativa === 0) {
            await esperar(RETRY_MS);

            if (controller.signal.aborted) {
              return;
            }

            setState(emAndamento());
            continue;
          }

          setState({ kind: 'indisponivel', query, code: 'UNAVAILABLE' });

          return;
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          registrarFalha('busca', error);

          const code = error instanceof ApiError ? error.code : 'TIMEOUT';

          const rapida = Date.now() - inicioDaTentativa < FALHA_RAPIDA_MS;

          if (tentativa === 0 && rapida && code !== 'VALIDATION_ERROR') {
            await esperar(RETRY_MS);

            if (controller.signal.aborted) {
              return;
            }

            setState(emAndamento());
            continue;
          }

          setState({ kind: 'indisponivel', query, code });

          return;
        }
      }
    },
    [],
  );

  const repetir = useCallback(() => {
    if (ultimaQuery.current) {
      void buscar(ultimaQuery.current);
    }
  }, [buscar]);

  useEffect(() => {
    if (state.kind !== 'pronto') {
      return;
    }

    const restante = segundosAteExpirar(state.result);

    if (!Number.isFinite(restante)) {
      return;
    }

    const result = state.result;
    const id = setTimeout(
      () => void buscar(result.query, result),
      Math.max(0, (restante - 60) * 1000),
    );

    return () => clearTimeout(id);
  }, [state, buscar]);

  const { origin, destination, date } = query;

  useEffect(() => {
    const result = restaurado.current;

    restaurado.current = null;

    if (result) {
      if (result.status === 'partial') {
        void buscar(result.query, result);
      }

      return;
    }

    void buscar({ origin, destination, date });
  }, [buscar, origin, destination, date, versao]);

  useEffect(() => {
    onCarregando(trecho, state.kind === 'buscando');
  }, [onCarregando, trecho, state.kind]);

  useEffect(() => () => onCarregando(trecho, false), [onCarregando, trecho]);

  return (
    <>
      {state.kind === 'buscando' && <EmAndamento state={state} reservadas={reservadas} />}

      {state.kind === 'pronto' &&
        (state.result.quotes.length === 0 ? (
          <EmptyResult query={state.result.query} />
        ) : (
          <Resultado result={state.result} onRetry={repetir} reservadas={reservadas} />
        ))}

      {state.kind === 'indisponivel' && (
        <IndisponivelState code={state.code} onRetry={repetir} loading={false} />
      )}
    </>
  );
}

async function executar(
  query: SearchQuery,
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<SearchResponse> {
  try {
    return await buscarComStream(query, handlers, signal);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    registrarFalha('stream indisponível, usando POST /search', error);

    const { response } = await search(query, signal);

    return response;
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function EmAndamento({
  state,
  reservadas,
}: {
  state: Extract<SearchUiState, { kind: 'buscando' }>;
  reservadas: Set<string>;
}) {
  if (state.anterior) {
    return (
      <div className="space-y-4">
        <Cabecalho
          query={state.anterior.query}
          total={state.anterior.quotes.length}
          direita={<span className="text-slate-400">atualizando…</span>}
        />

        <ListaDeOfertas
          quotes={state.anterior.quotes}
          reservadas={reservadas}
        />

        <ProgressoBusca
          concluidos={state.concluidos}
          total={state.total}
          startedAt={state.startedAt}
          compacto
        />
      </div>
    );
  }

  if (state.parciais.length > 0) {
    return (
      <div className="space-y-4">
        <Cabecalho query={state.query} total={state.parciais.length} />

        <ListaDeOfertas
          quotes={state.parciais}
          reservadas={reservadas}
        />

        <ProgressoBusca
          concluidos={state.concluidos}
          total={state.total}
          startedAt={state.startedAt}
          compacto
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressoBusca
        concluidos={state.concluidos}
        total={state.total}
        startedAt={state.startedAt}
      />

      <SkeletonOfertas />
    </div>
  );
}

function Resultado({
  result,
  onRetry,
  reservadas,
}: {
  result: SearchResponse;
  onRetry: () => void;
  reservadas: Set<string>;
}) {
  return (
    <div className="space-y-4">
      <Cabecalho
        query={result.query}
        total={result.quotes.length}
        direita={
          result.cached && result.cachedAt ? (
            <>
              em cache há {secondsSince(result.cachedAt)}s ·{' '}
              <button
                type="button"
                onClick={onRetry}
                className="underline hover:text-slate-700"
              >
                atualizar
              </button>
            </>
          ) : (
            `${(result.elapsedMs / 1000).toFixed(1)}s`
          )
        }
      />

      <ListaDeOfertas
        quotes={result.quotes}
        reservadas={reservadas}
      />

      {result.status === 'partial' && (
        <p className="text-center text-xs text-slate-500">
          Pode haver mais opções para esta data.{' '}
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-brand-600 underline hover:text-brand-700"
          >
            Buscar de novo
          </button>
        </p>
      )}
    </div>
  );
}

function Cabecalho({
  query,
  total,
  direita,
}: {
  query: SearchQuery;
  total: number;
  direita?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-sm font-medium text-slate-900">
        {total} {total === 1 ? 'opção' : 'opções'} de {cityOf(query.origin)} para{' '}
        {cityOf(query.destination)} em {formatDate(query.date)}
      </h2>

      {direita && <p className="numeros text-xs text-slate-500">{direita}</p>}
    </div>
  );
}

function ListaDeOfertas({
  quotes,
  reservadas,
}: {
  quotes: Quote[];
  reservadas: Set<string>;
}) {
  const milhasDaMelhor = quotes[0]?.miles ?? 0;
  const milhasDaPior = quotes[quotes.length - 1]?.miles ?? 0;

  return (
    <ul className="space-y-3">
      {quotes.map((quote, indice) => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          melhorPreco={indice === 0}
          milhasDaMelhor={milhasDaMelhor}
          milhasDaPior={milhasDaPior}
          reservada={reservadas.has(quote.id)}
        />
      ))}
    </ul>
  );
}
