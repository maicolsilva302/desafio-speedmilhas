'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cityOf, formatDate, nameOf } from '../lib/airports';
import { ApiError, buscarReserva, formatBrl, formatMiles } from '../lib/api';
import { useAgencia } from '../lib/cliente';
import { mensagemDeErro, registrarFalha } from '../lib/mensagens';
import type { OrderResponse } from '../lib/types';
import { formatarDocumento, formatarQuando, Linha, rotuloDoDocumento } from './reserva-campos';

type Estado =
  | { kind: 'carregando' }
  | { kind: 'pronto'; reserva: OrderResponse }
  | { kind: 'erro'; code: string };

export function ReservaDetalhe({ id }: { id: string }) {
  const agencia = useAgencia();
  const [estado, setEstado] = useState<Estado>({ kind: 'carregando' });

  useEffect(() => {
    if (!agencia) {
      return;
    }

    const controller = new AbortController();

    setEstado({ kind: 'carregando' });

    buscarReserva(agencia, id, controller.signal)
      .then((reserva) => setEstado({ kind: 'pronto', reserva }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        registrarFalha('carregar reserva', error);
        setEstado({ kind: 'erro', code: error instanceof ApiError ? error.code : 'NETWORK' });
      });

    return () => controller.abort();
  }, [agencia, id]);

  if (estado.kind === 'carregando') {
    return <div className="mt-6 h-72 animate-pulse rounded-lg bg-white" aria-hidden />;
  }

  if (estado.kind === 'erro') {
    const mensagem = mensagemDeErro(estado.code);

    return (
      <div
        data-erro={estado.code}
        className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center"
      >
        <p className="font-medium text-slate-900">{mensagem.titulo}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{mensagem.texto}</p>
        <Link
          href="/reservas"
          className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Ver minhas reservas
        </Link>
      </div>
    );
  }

  const { reserva } = estado;
  const { trecho, total, passageiro, quote } = reserva;

  return (
    <div className="mt-3">
      <h1 className="text-2xl font-semibold text-slate-900">
        {cityOf(trecho.origin)} → {cityOf(trecho.destination)}
      </h1>
      <p className="mt-1 text-sm text-slate-600">{formatDate(trecho.date)}</p>

      <dl className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <Linha rotulo="Código">
          <span className="numeros text-xs">{reserva.id}</span>
        </Linha>
        <Linha rotulo="Status">{reserva.status === 'CONFIRMED' ? 'Confirmada' : reserva.status}</Linha>
        <Linha rotulo="Origem">
          {trecho.origin} · {nameOf(trecho.origin)}
        </Linha>
        <Linha rotulo="Destino">
          {trecho.destination} · {nameOf(trecho.destination)}
        </Linha>
        <Linha rotulo="Companhia">{quote.carrier}</Linha>
        <Linha rotulo="Passageiro">{passageiro.nome}</Linha>
        {passageiro.documento && (
          <Linha rotulo={rotuloDoDocumento(passageiro.documentoTipo)}>
            <span className="numeros">
              {formatarDocumento(passageiro.documento, passageiro.documentoTipo)}
            </span>
          </Linha>
        )}
        {passageiro.email && <Linha rotulo="E-mail">{passageiro.email}</Linha>}
        <Linha rotulo="Milhas">
          <span className="numeros">{formatMiles(total.miles)}</span>
        </Linha>
        <Linha rotulo="Taxa de embarque">
          <span className="numeros">{formatBrl(total.taxesBrl)}</span>
        </Linha>
        <Linha rotulo="Taxa de serviço">
          <span className="numeros">{formatBrl(total.serviceFeeBrl)}</span>
        </Linha>
        <Linha rotulo="Total em reais">
          <span className="numeros">{formatBrl(total.totalBrl)}</span>
        </Linha>
        <Linha rotulo="Reservada em">
          <span className="numeros">{formatarQuando(reserva.createdAt)}</span>
        </Linha>
      </dl>
    </div>
  );
}
