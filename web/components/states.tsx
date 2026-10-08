import { cityOf, formatDate } from '../lib/airports';
import { BUSCA_SEM_RESULTADO } from '../lib/mensagens';
import type { SearchQuery } from '../lib/types';

export function IdleState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
      <p className="text-sm text-slate-600">
        Escolha origem, destino e data para comparar ofertas em milhas.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        As ofertas aparecem conforme chegam — você não precisa esperar todas.
      </p>
    </div>
  );
}

export function EmptyResult({ query }: { query: SearchQuery }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
      <p className="font-medium text-slate-900">Nenhuma oferta encontrada</p>
      <p className="mt-1 text-sm text-slate-600">
        Não há passagens em milhas de {cityOf(query.origin)} para{' '}
        {cityOf(query.destination)} em {formatDate(query.date)}.
      </p>
      <p className="mt-3 text-xs text-slate-400">
        Tente outra data ou outro destino.
      </p>
    </div>
  );
}

export function IndisponivelState({
  code,
  onRetry,
  loading,
}: {
  code: string;
  onRetry: () => void;
  loading: boolean;
}) {
  return (
    <div
      data-erro={code}
      className="rounded-lg border border-slate-200 bg-white p-8 text-center"
    >
      <p className="font-medium text-slate-900">{BUSCA_SEM_RESULTADO.titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        {BUSCA_SEM_RESULTADO.texto}
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {BUSCA_SEM_RESULTADO.acao}
      </button>
    </div>
  );
}
