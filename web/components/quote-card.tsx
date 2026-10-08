import Link from 'next/link';

import { formatBrl, formatMiles } from '../lib/api';
import type { Quote } from '../lib/types';

export function QuoteCard({
  quote,
  melhorPreco,
  milhasDaMelhor,
  milhasDaPior,
  reservada,
}: {
  quote: Quote;
  melhorPreco: boolean;
  milhasDaMelhor: number;
  milhasDaPior: number;
  reservada: boolean;
}) {
  const proporcao = milhasDaPior > 0 ? quote.miles / milhasDaPior : 1;
  const diferenca = quote.miles - milhasDaMelhor;

  return (
    <li
      className={`entra rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm ${
        melhorPreco ? 'border-brand-600 ring-1 ring-brand-100' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">{quote.carrier}</span>

        {quote.carrierCode && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {quote.carrierCode}
          </span>
        )}

        {melhorPreco && (
          <span className="rounded bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
            Melhor preço
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                melhorPreco ? 'bg-brand-600' : 'bg-slate-300'
              }`}
              style={{ width: `${Math.max(4, proporcao * 100)}%` }}
            />
          </div>

          <p className="numeros mt-2 text-xs text-slate-500">
            via parceiro {quote.supplier}
            {diferenca > 0 && (
              <span className="text-slate-400">
                {' · '}+{formatMiles(diferenca)} vs. a melhor
              </span>
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="numeros text-2xl font-semibold leading-tight text-slate-900">
            {formatMiles(quote.miles)}
            <span className="ml-1 text-xs font-normal text-slate-500">milhas</span>
          </p>

          {quote.taxesBrl === null ? (
            <p className="numeros mt-0.5 text-sm font-medium text-warn-700">
              taxa não informada
            </p>
          ) : (
            <p className="numeros mt-0.5 text-sm text-slate-600">
              + {formatBrl(quote.totalBrl ?? quote.taxesBrl)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {!quote.bookable
            ? 'Sem o valor das taxas não dá para fechar a compra.'
            : reservada
              ? 'Você já reservou esta oferta.'
              : ''}
        </p>

        {quote.bookable ? (
          <Link
            href={`/reservar/${quote.id}`}
            className="shrink-0 rounded-md border border-brand-600 px-4 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            Reservar
          </Link>
        ) : (
          <span
            aria-disabled
            className="shrink-0 cursor-not-allowed rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-400"
          >
            Reservar
          </span>
        )}
      </div>
    </li>
  );
}
