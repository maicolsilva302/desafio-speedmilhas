'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cityOf, formatDate, nameOf } from '../lib/airports';
import {
  ApiError,
  buscarCotacao,
  criarReserva,
  formatBrl,
  formatMiles,
  novaChaveIdempotencia,
} from '../lib/api';
import {
  DOCUMENTOS,
  limparDocumento,
  mascararDocumento,
  type TipoDocumento,
} from '../lib/mascaras';
import { mensagemDeErro, registrarFalha } from '../lib/mensagens';
import { useAgencia } from '../lib/cliente';
import { marcarReservada } from '../lib/sessao';
import type { OrderResponse, QuoteDetail } from '../lib/types';

const PASSOS = [
  { id: 'passageiro', rotulo: 'Passageiro' },
  { id: 'revisao', rotulo: 'Revisão' },
  { id: 'confirmada', rotulo: 'Confirmação' },
] as const;

type Passo = (typeof PASSOS)[number]['id'];

type Envio =
  | { kind: 'parado' }
  | { kind: 'enviando' }
  | { kind: 'erro'; texto: string; podeRepetir: boolean };

export function BookingFlow({ quoteId }: { quoteId: string }) {
  const agencia = useAgencia();
  const [detalhe, setDetalhe] = useState<QuoteDetail | null>(null);
  const [falhaAoCarregar, setFalhaAoCarregar] = useState<string | null>(null);

  const [passo, setPasso] = useState<Passo>('passageiro');
  const [nome, setNome] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');

  const [envio, setEnvio] = useState<Envio>({ kind: 'parado' });
  const [order, setOrder] = useState<{ dados: OrderResponse; replay: boolean } | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    buscarCotacao(quoteId, controller.signal)
      .then(setDetalhe)
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        registrarFalha('carregar cotação', error);
        setFalhaAoCarregar(
          error instanceof ApiError ? error.code : 'NETWORK',
        );
      });

    return () => controller.abort();
  }, [quoteId]);

  async function confirmar(): Promise<void> {
    if (!detalhe) {
      return;
    }

    if (!agencia) {
      setEnvio({ kind: 'erro', texto: mensagemDeErro('CLIENT_REQUIRED').texto, podeRepetir: false });

      return;
    }

    const limpo = limparDocumento(documento);

    const passageiro = {
      nome: nome.trim(),
      documento: limpo,
      documentoTipo: limpo ? tipoDocumento : undefined,
      email: email.trim(),
    };

    const idempotencyKey = novaChaveIdempotencia();

    setEnvio({ kind: 'enviando' });

    try {
      const resultado = await criarReserva(agencia, {
        quoteId,
        passageiro,
        idempotencyKey,
      });

      marcarReservada(quoteId);
      setOrder({ dados: resultado.order, replay: resultado.replay });
      setEnvio({ kind: 'parado' });
      setPasso('confirmada');
    } catch (error) {
      registrarFalha('reserva', error);

      if (error instanceof ApiError) {
        const mensagem = mensagemDeErro(error.code);

        setEnvio({
          kind: 'erro',
          texto: mensagem.texto,
          podeRepetir: mensagem.acao !== null,
        });

        return;
      }

      setEnvio({
        kind: 'erro',
        texto:
          'A reserva demorou mais do que o esperado. Tentar de novo é seguro: ' +
          'nada será duplicado.',
        podeRepetir: true,
      });
    }
  }

  if (falhaAoCarregar) {
    return <NaoEncontrada code={falhaAoCarregar} />;
  }

  if (!detalhe) {
    return <CarregandoOferta />;
  }

  return (
    <div className="space-y-6">
      <Cabecalho detalhe={detalhe} />

      <Trilha passo={passo} onVoltar={setPasso} concluida={passo === 'confirmada'} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="order-2 lg:order-1">
          {passo === 'passageiro' && (
            <PassoPassageiro
              nome={nome}
              tipoDocumento={tipoDocumento}
              documento={documento}
              email={email}
              onNome={setNome}
              onTipoDocumento={(tipo) => {
                setTipoDocumento(tipo);
                setDocumento('');
              }}
              onDocumento={setDocumento}
              onEmail={setEmail}
              onContinuar={() => {
                setEnvio({ kind: 'parado' });
                setPasso('revisao');
              }}
            />
          )}

          {passo === 'revisao' && (
            <PassoRevisao
              detalhe={detalhe}
              nome={nome}
              tipoDocumento={tipoDocumento}
              documento={documento}
              email={email}
              envio={envio}
              onVoltar={() => setPasso('passageiro')}
              onConfirmar={() => void confirmar()}
            />
          )}

          {passo === 'confirmada' && order && (
            <PassoConfirmada
              order={order.dados}
              replay={order.replay}
              query={detalhe.query}
            />
          )}
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-6">
          <ResumoDaOferta
            detalhe={detalhe}
            mostrarPrazo={passo !== 'confirmada'}
          />
        </aside>
      </div>
    </div>
  );
}

function Cabecalho({ detalhe }: { detalhe: QuoteDetail }) {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <span aria-hidden>←</span> Voltar para a busca
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Reservar passagem</h1>
      <p className="mt-1 text-sm text-slate-600">
        {cityOf(detalhe.query.origin)} → {cityOf(detalhe.query.destination)} ·{' '}
        {formatDate(detalhe.query.date)}
      </p>
    </div>
  );
}

function Trilha({
  passo,
  onVoltar,
  concluida,
}: {
  passo: Passo;
  onVoltar: (destino: Passo) => void;
  concluida: boolean;
}) {
  const atual = PASSOS.findIndex((item) => item.id === passo);

  return (
    <ol className="flex items-center gap-2">
      {PASSOS.map((item, indice) => {
        const feito = indice < atual;
        const agora = indice === atual;
        const podeVoltar = feito && !concluida;

        const bolinha = (
          <span
            className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              agora
                ? 'bg-brand-600 text-white'
                : feito
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {feito ? '✓' : indice + 1}
          </span>
        );

        const rotulo = (
          <span
            className={`text-xs font-medium ${
              agora ? 'text-slate-900' : feito ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {item.rotulo}
          </span>
        );

        return (
          <li key={item.id} className="flex flex-1 items-center gap-2">
            {podeVoltar ? (
              <button
                type="button"
                onClick={() => onVoltar(item.id)}
                className="flex items-center gap-2 rounded transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {bolinha}
                {rotulo}
              </button>
            ) : (
              <span
                className="flex items-center gap-2"
                aria-current={agora ? 'step' : undefined}
              >
                {bolinha}
                {rotulo}
              </span>
            )}

            {indice < PASSOS.length - 1 && (
              <span
                aria-hidden
                className={`h-px flex-1 transition-colors ${
                  feito ? 'bg-brand-200' : 'bg-slate-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PassoPassageiro({
  nome,
  tipoDocumento,
  documento,
  email,
  onNome,
  onTipoDocumento,
  onDocumento,
  onEmail,
  onContinuar,
}: {
  nome: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  onNome: (valor: string) => void;
  onTipoDocumento: (tipo: TipoDocumento) => void;
  onDocumento: (valor: string) => void;
  onEmail: (valor: string) => void;
  onContinuar: () => void;
}) {
  const config = DOCUMENTOS[tipoDocumento];
  const limpo = limparDocumento(documento);

  const nomeOk = nome.trim().length >= 3;
  const documentoOk = limpo.length === 0 || config.valido(limpo);
  const valido = nomeOk && documentoOk;

  const aviso = !nomeOk
    ? 'Informe o nome para continuar.'
    : !documentoOk
      ? tipoDocumento === 'cpf'
        ? 'Confira o CPF — ele parece incompleto ou inválido.'
        : 'O passaporte parece curto demais.'
      : '';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (valido) {
          onContinuar();
        }
      }}
      className="rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="text-base font-semibold text-slate-900">Quem vai viajar</h2>
      <p className="mt-1 text-sm text-slate-500">
        O nome precisa ser igual ao do documento apresentado no embarque.
      </p>

      <div className="mt-4 space-y-3">
        <CampoTexto
          rotulo="Nome do passageiro"
          value={nome}
          onChange={onNome}
          placeholder="Como está no documento"
          autoComplete="name"
          autoFocus
          required
        />

        <div>
          <span className="mb-1 flex items-baseline gap-2 text-xs font-medium text-slate-600">
            Documento
            <span className="font-normal text-slate-400">opcional</span>
          </span>

          <SeletorDeTipo tipo={tipoDocumento} onTipo={onTipoDocumento} />

          <input
            value={documento}
            onChange={(event) =>
              onDocumento(mascararDocumento(event.target.value, tipoDocumento))
            }
            placeholder={config.exemplo}
            inputMode={config.inputMode}
            aria-label={config.rotulo}
            aria-invalid={!documentoOk}
            className={`mt-2 h-[38px] w-full rounded-md border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
              documentoOk
                ? 'border-slate-300 hover:border-slate-400 focus:border-brand-600'
                : 'border-warn-200 focus:border-warn-700'
            }`}
          />
        </div>

        <CampoTexto
          rotulo="E-mail"
          dica="opcional"
          value={email}
          onChange={onEmail}
          placeholder="para receber a confirmação"
          type="email"
          autoComplete="email"
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{aviso}</p>

        <button
          type="submit"
          disabled={!valido}
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}

function SeletorDeTipo({
  tipo,
  onTipo,
}: {
  tipo: TipoDocumento;
  onTipo: (tipo: TipoDocumento) => void;
}) {
  const tipos = Object.keys(DOCUMENTOS) as TipoDocumento[];

  return (
    <div className="inline-flex rounded-md border border-slate-300 p-0.5">
      {tipos.map((candidato) => {
        const ativo = candidato === tipo;

        return (
          <label
            key={candidato}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-medium transition-colors ${
              ativo
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="tipo-documento"
              value={candidato}
              checked={ativo}
              onChange={() => onTipo(candidato)}
              className="sr-only"
            />
            {DOCUMENTOS[candidato].rotulo}
          </label>
        );
      })}
    </div>
  );
}

function PassoRevisao({
  detalhe,
  nome,
  tipoDocumento,
  documento,
  email,
  envio,
  onVoltar,
  onConfirmar,
}: {
  detalhe: QuoteDetail;
  nome: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  envio: Envio;
  onVoltar: () => void;
  onConfirmar: () => void;
}) {
  const enviando = envio.kind === 'enviando';
  const bloqueio = motivoDeBloqueio(detalhe);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">Confira antes de reservar</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <Linha rotulo="Origem">
          <span className="numeros">{detalhe.query.origin}</span>
          <span className="font-normal text-slate-500"> · {nameOf(detalhe.query.origin)}</span>
        </Linha>
        <Linha rotulo="Destino">
          <span className="numeros">{detalhe.query.destination}</span>
          <span className="font-normal text-slate-500">
            {' '}
            · {nameOf(detalhe.query.destination)}
          </span>
        </Linha>
        <Linha rotulo="Ida">
          <span className="numeros">{formatDate(detalhe.query.date)}</span>
        </Linha>

        <Linha rotulo="Passageiro">{nome.trim()}</Linha>
        {documento.trim() && (
          <Linha rotulo={DOCUMENTOS[tipoDocumento].rotulo}>
            <span className="numeros">{documento.trim()}</span>
          </Linha>
        )}
        {email.trim() && <Linha rotulo="E-mail">{email.trim()}</Linha>}
        <Linha rotulo="Companhia">{detalhe.quote.carrier}</Linha>
        <Linha rotulo="Milhas">
          <span className="numeros">{formatMiles(detalhe.quote.miles)}</span>
        </Linha>
        {detalhe.quote.taxesBrl !== null && (
          <Linha rotulo="Taxa de embarque">
            <span className="numeros">{formatBrl(detalhe.quote.taxesBrl)}</span>
          </Linha>
        )}
        {detalhe.quote.serviceFeeBrl !== null && (
          <Linha rotulo="Taxa de serviço">
            <span className="numeros">{formatBrl(detalhe.quote.serviceFeeBrl)}</span>
          </Linha>
        )}
        {detalhe.quote.totalBrl !== null && (
          <Linha rotulo="Total em reais">
            <span className="numeros">{formatBrl(detalhe.quote.totalBrl)}</span>
          </Linha>
        )}
      </dl>

      {envio.kind === 'erro' && (
        <p
          role="alert"
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            envio.podeRepetir
              ? 'border-warn-200 bg-warn-50 text-warn-900'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {envio.texto}
        </p>
      )}

      {bloqueio && (
        <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {bloqueio}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onVoltar}
          disabled={enviando}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={onConfirmar}
          disabled={bloqueio !== null || enviando}
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando
            ? 'Reservando…'
            : envio.kind === 'erro' && envio.podeRepetir
              ? 'Tentar de novo'
              : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  );
}

function PassoConfirmada({
  order,
  replay,
  query,
}: {
  order: OrderResponse;
  replay: boolean;
  query: QuoteDetail['query'];
}) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-5 ring-1 ring-brand-100">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-brand-600 text-sm text-white"
          aria-hidden
        >
          ✓
        </span>
        <h2 className="text-base font-semibold text-slate-900">Reserva confirmada</h2>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Linha rotulo="Código">
          <span className="numeros text-xs">{order.id}</span>
        </Linha>
        <Linha rotulo="Trecho">
          <span className="numeros">
            {query.origin} → {query.destination}
          </span>
        </Linha>
        <Linha rotulo="Ida">
          <span className="numeros">{formatDate(query.date)}</span>
        </Linha>
        <Linha rotulo="Passageiro">{order.passageiro.nome}</Linha>

        {documentoDaReserva(order) && (
          <Linha rotulo={rotuloDoDocumento(order)}>
            <span className="numeros">{documentoDaReserva(order)}</span>
          </Linha>
        )}

        <Linha rotulo="Companhia">{order.quote.carrier}</Linha>
        <Linha rotulo="Total">
          <span className="numeros">
            {formatMiles(order.total.miles)} milhas + {formatBrl(order.total.totalBrl)}
          </span>
        </Linha>
      </dl>

      <p className="mt-2 text-xs text-slate-500">
        {nameOf(query.origin)} → {nameOf(query.destination)}
      </p>

      {replay && (
        <p className="mt-4 rounded-md border border-warn-200 bg-warn-50 px-3 py-2 text-xs text-warn-900">
          Reconhecemos esta requisição como repetição da anterior e devolvemos a
          reserva original. Nenhuma reserva nova foi criada.
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Link
          href={`/reservas/${order.id}`}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          Ver reserva
        </Link>

        <Link
          href="/"
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Buscar outra passagem
        </Link>
      </div>
    </div>
  );
}

function ResumoDaOferta({
  detalhe,
  mostrarPrazo,
}: {
  detalhe: QuoteDetail;
  mostrarPrazo: boolean;
}) {
  const { quote, query } = detalhe;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Sua escolha
      </p>

      <Trecho query={query} />

      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="font-semibold text-slate-900">{quote.carrier}</span>
        {quote.carrierCode && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {quote.carrierCode}
          </span>
        )}
      </div>

      <p className="numeros mt-2 text-2xl font-semibold leading-tight text-slate-900">
        {formatMiles(quote.miles)}
        <span className="ml-1 text-xs font-normal text-slate-500">milhas</span>
      </p>

      <p className="numeros mt-0.5 text-sm text-slate-600">
        {quote.taxesBrl === null
          ? 'taxa não informada'
          : `+ ${formatBrl(quote.totalBrl ?? quote.taxesBrl)} em taxas`}
      </p>

      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        via parceiro {quote.supplier}
      </p>

      {mostrarPrazo && <Prazo expiresAt={quote.expiresAt} />}
    </div>
  );
}

function Trecho({ query }: { query: QuoteDetail['query'] }) {
  return (
    <dl className="mt-3 space-y-2.5">
      <Parada papel="Origem" code={query.origin} />
      <Parada papel="Destino" code={query.destination} />

      <div>
        <dt className="text-[0.6875rem] uppercase tracking-wide text-slate-400">Ida</dt>
        <dd className="numeros text-sm text-slate-900">{formatDate(query.date)}</dd>
      </div>
    </dl>
  );
}

function Parada({ papel, code }: { papel: string; code: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-wide text-slate-400">{papel}</dt>
      <dd className="text-sm text-slate-900">
        <span className="numeros font-semibold">{code}</span>
        <span className="text-slate-500"> · {nameOf(code)}</span>
      </dd>
    </div>
  );
}

function Prazo({ expiresAt }: { expiresAt: string }) {
  const [restante, setRestante] = useState<number | null>(null);

  useEffect(() => {
    setRestante(segundosAte(expiresAt));
    const id = setInterval(() => setRestante(segundosAte(expiresAt)), 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  if (restante === null) {
    return null;
  }

  if (restante <= 0) {
    return (
      <p className="mt-3 rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
        Esta oferta expirou. Faça a busca de novo para ver os preços atuais.
      </p>
    );
  }

  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const apertado = restante <= 60;

  return (
    <p
      className={`numeros mt-3 rounded-md px-2.5 py-2 text-xs ${
        apertado ? 'bg-warn-50 text-warn-900' : 'bg-slate-50 text-slate-500'
      }`}
    >
      Preço garantido por {minutos}:{String(segundos).padStart(2, '0')}
    </p>
  );
}

function segundosAte(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function documentoDaReserva(order: OrderResponse): string {
  const { documento, documentoTipo } = order.passageiro;

  if (!documento) {
    return '';
  }

  return documentoTipo && documentoTipo in DOCUMENTOS
    ? mascararDocumento(documento, documentoTipo as TipoDocumento)
    : documento;
}

function rotuloDoDocumento(order: OrderResponse): string {
  const tipo = order.passageiro.documentoTipo;

  return tipo && tipo in DOCUMENTOS ? DOCUMENTOS[tipo as TipoDocumento].rotulo : 'Documento';
}

function motivoDeBloqueio(detalhe: QuoteDetail): string | null {
  switch (detalhe.availability) {
    case 'not_bookable':
      return 'Sem o valor das taxas não dá para fechar a compra desta oferta.';

    case 'expired':
      return 'Esta oferta expirou. Faça a busca de novo para ver os preços atuais.';

    default:
      return segundosAte(detalhe.quote.expiresAt) > 0
        ? null
        : 'Esta oferta expirou. Faça a busca de novo para ver os preços atuais.';
  }
}

function CarregandoOferta() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="h-64 animate-pulse rounded-lg bg-white" />
        <div className="h-48 animate-pulse rounded-lg bg-white" />
      </div>
    </div>
  );
}

function NaoEncontrada({ code }: { code: string }) {
  return (
    <div
      data-erro={code}
      className="rounded-lg border border-slate-200 bg-white p-10 text-center"
    >
      <p className="font-medium text-slate-900">Não encontramos esta oferta</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
        Ofertas em milhas duram pouco. Faça a busca de novo para ver as opções
        disponíveis agora.
      </p>

      <Link
        href="/"
        className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Ir para a busca
      </Link>
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{rotulo}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  );
}

function CampoTexto({
  rotulo,
  dica,
  value,
  onChange,
  ...resto
}: {
  rotulo: string;
  dica?: string;
  value: string;
  onChange: (valor: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline gap-2 text-xs font-medium text-slate-600">
        {rotulo}
        {dica && <span className="font-normal text-slate-400">{dica}</span>}
      </span>

      <input
        {...resto}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[38px] w-full rounded-md border border-slate-300 px-3 text-sm transition-colors hover:border-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
