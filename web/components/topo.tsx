'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { listarAgencias } from '../lib/api';
import { trocarAgencia, useAgencia, type Agencia } from '../lib/cliente';
import { registrarFalha } from '../lib/mensagens';

export function Topo() {
  const agencia = useAgencia();
  const [agencias, setAgencias] = useState<Agencia[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    listarAgencias(controller.signal)
      .then((lista) => {
        setAgencias(lista);

        const atual = lista.find((item) => item.id === agencia);

        if (!atual && lista[0]) {
          trocarAgencia(lista[0].id);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          registrarFalha('carregar agências', error);
        }
      });

    return () => controller.abort();
  }, [agencia]);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="text-base font-semibold text-slate-900">
          Speed Milhas
        </Link>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            Agência
            <select
              value={agencia ?? ''}
              onChange={(event) => trocarAgencia(event.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {agencias.length === 0 && <option value="">Carregando…</option>}
              {agencias.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <Link
            href="/reservas"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Minhas reservas
          </Link>
        </div>
      </div>
    </header>
  );
}
