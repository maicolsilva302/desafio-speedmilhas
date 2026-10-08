'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cityOf, formatDate } from '../lib/airports';
import { ApiError, buscarReservas, formatBrl, formatMiles } from '../lib/api';
import { useAgencia } from '../lib/cliente';
import { registrarFalha } from '../lib/mensagens';
import type { OrderResponse } from '../lib/types';
import { formatarQuando, Linha } from './reserva-campos';

type Estado =
  | { kind: 'carregando' }
  | { kind: 'pronto'; reservas: OrderResponse[] }
  | { kind: 'indisponivel'; code: string };

export function ReservasLista() {
  const agencia = useAgencia();
  const [estado, setEstado] = useState<Estado>({ kind: 'carregando' });

  useEffect(() => {
    if (!agencia) {
      return;
    }

    const controller = new AbortController();

    setEstado({ kind: 'carregando' });

    buscarReservas(agencia, controller.signal)
      .then((reservas) => setEstado({ kind: 'pronto', reservas }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        registrarFalha('carregar reservas', error);
        setEstado({
          kind: 'indisponivel',
          code: error instanceof ApiError ? error.code : 'NETWORK',
        });
      });

    return () => controller.abort();
  }, [agencia]);

  if (estado.kind === 'carregando') {
    return (
      <ul className="space-y-3" aria-hidden>
        {[0, 1].map((linha) => (
          <li
            key={linha}
            className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </ul>
    );
  }

  if (estado.kind === 'indisponivel') {
    return (
      <div
        data-erro={estado.code}
        className="rounded-lg border border-slate-200 bg-white p-8 text-center"
      >
        <p className="font-medium text-slate-900">Não conseguimos carregar agora</p>
        <p className="mt-1 text-sm text-slate-600">
          Suas reservas continuam válidas. Tente de novo em instantes.
        </p>
      </div>
    );
  }

  if (estado.reservas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
        <p className="font-medium text-slate-900">Nenhuma reserva ainda</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
          As reservas desta agência aparecem aqui assim que forem confirmadas.
        </p>

        <Link
          href="/"
          className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Buscar passagens
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {estado.reservas.length} {estado.reservas.length === 1 ? 'reserva' : 'reservas'}
      </p>

      <ul className="space-y-3">
        {estado.reservas.map((reserva) => (
          <CardDeReserva key={reserva.id} reserva={reserva} />
        ))}
      </ul>
    </div>
  );
}

function CardDeReserva({ reserva }: { reserva: OrderResponse }) {
  const { trecho, total, passageiro, quote } = reserva;

  return (
    <li className="entra rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {cityOf(trecho.origin)} → {cityOf(trecho.destination)}
          </p>
          <p className="numeros mt-0.5 text-xs text-slate-500">
            {formatDate(trecho.date)} · {quote.carrier}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="numeros text-xl font-semibold leading-tight text-slate-900">
            {formatMiles(total.miles)}
            <span className="ml-1 text-xs font-normal text-slate-500">milhas</span>
          </p>
          <p className="numeros mt-0.5 text-sm text-slate-600">+ {formatBrl(total.totalBrl)}</p>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
        <Linha rotulo="Passageiro">{passageiro.nome}</Linha>
        <Linha rotulo="Reservada em">
          <span className="numeros">{formatarQuando(reserva.createdAt)}</span>
        </Linha>
      </dl>

      <div className="mt-3 flex justify-end">
        <Link
          href={`/reservas/${reserva.id}`}
          className="text-sm font-medium text-brand-600 underline hover:text-brand-700"
        >
          Ver detalhes
        </Link>
      </div>
    </li>
  );
}
