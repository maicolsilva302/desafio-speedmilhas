'use client';

import { useEffect, useState } from 'react';

const TETO_MS = 6000;

export function ProgressoBusca({
  concluidos,
  total,
  startedAt,
  compacto = false,
}: {
  concluidos: number;
  total: number;
  startedAt: number;
  compacto?: boolean;
}) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 250);

    return () => clearInterval(id);
  }, []);

  const porEntrega = total > 0 ? concluidos / total : 0;
  const porTempo = Math.min((agora - startedAt) / TETO_MS, 1);
  const fracao = Math.min(Math.max(porEntrega, porTempo * 0.9), 0.95);

  return (
    <div className={compacto ? '' : 'space-y-2'}>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="inline-block size-2 animate-pulse rounded-full bg-brand-600" />
        <span>{compacto ? 'Procurando mais opções…' : 'Procurando as melhores ofertas…'}</span>
      </div>

      <div
        className={`h-1 w-full overflow-hidden rounded-full bg-slate-100 ${
          compacto ? 'mt-2' : ''
        }`}
        role="progressbar"
        aria-label="Progresso da busca"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
          style={{ width: `${fracao * 100}%` }}
        />
      </div>
    </div>
  );
}

export function SkeletonOfertas() {
  return (
    <ul className="space-y-3" aria-hidden>
      {[0, 1, 2].map((linha) => (
        <li key={linha} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="space-y-2 text-right">
              <div className="ml-auto h-7 w-28 animate-pulse rounded bg-slate-200" />
              <div className="ml-auto h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
