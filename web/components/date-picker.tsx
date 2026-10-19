'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  INICIAIS_SEMANA,
  gradeDoMes,
  mesmoMes,
  primeiroDoMes,
  rotuloCurto,
  rotuloLongo,
  rotuloMes,
  somarDias,
  somarMeses,
} from '../lib/calendar';

export function DatePicker({
  value,
  min,
  onChange,
  rotuladoPor,
}: {
  value: string;
  min: string;
  onChange: (iso: string) => void;
  rotuladoPor: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() => primeiroDoMes(value));
  const [diaFocado, setDiaFocado] = useState(value);

  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const grade = useRef<HTMLDivElement>(null);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);

    if (devolverFoco) {
      gatilho.current?.focus();
    }
  }, []);

  function alternar(): void {
    if (aberto) {
      fechar(false);

      return;
    }

    setMesVisivel(primeiroDoMes(value));
    setDiaFocado(value);
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function noPonteiro(event: MouseEvent): void {
      if (!raiz.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function naTecla(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        fechar(true);
      }
    }

    document.addEventListener('mousedown', noPonteiro);
    document.addEventListener('keydown', naTecla);

    return () => {
      document.removeEventListener('mousedown', noPonteiro);
      document.removeEventListener('keydown', naTecla);
    };
  }, [aberto, fechar]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    grade.current
      ?.querySelector<HTMLButtonElement>(`[data-dia="${diaFocado}"]`)
      ?.focus();
  }, [aberto, diaFocado]);

  function mover(dias: number): void {
    const destino = somarDias(diaFocado, dias);
    const proximo = destino < min ? min : destino;

    setDiaFocado(proximo);

    if (!mesmoMes(proximo, mesVisivel)) {
      setMesVisivel(primeiroDoMes(proximo));
    }
  }

  function naGrade(event: React.KeyboardEvent): void {
    const passos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const passo = passos[event.key];

    if (passo === undefined) {
      return;
    }

    event.preventDefault();
    mover(passo);
  }

  function escolher(iso: string): void {
    onChange(iso);
    fechar(true);
  }

  function navegarMes(meses: number): void {
    const proximo = primeiroDoMes(somarMeses(mesVisivel, meses));

    setMesVisivel(proximo);
    setDiaFocado(mesmoMes(diaFocado, proximo) ? diaFocado : maiorEntre(proximo, min));
  }

  const casas = gradeDoMes(mesVisivel);
  const temMesAnterior = primeiroDoMes(min) < mesVisivel;
  const hoje = min;

  return (
    <div ref={raiz} className="relative">
      <button
        ref={gatilho}
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-labelledby={rotuladoPor}
        className="numeros flex h-[38px] w-full min-w-[11rem] items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {rotuloCurto(value)}
        <IconeCalendario />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Escolher data da viagem"
          className="absolute left-0 top-full z-20 mt-2 w-[17.5rem] rounded-lg border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60 sm:left-auto sm:right-0"
        >
          <div className="flex items-center justify-between pb-2">
            <SetaMes
              direcao={-1}
              rotulo="Mês anterior"
              onClick={() => navegarMes(-1)}
              disabled={!temMesAnterior}
            />

            <span className="text-sm font-medium text-slate-900">
              {rotuloMes(mesVisivel)}
            </span>

            <SetaMes direcao={1} rotulo="Próximo mês" onClick={() => navegarMes(1)} />
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
            {INICIAIS_SEMANA.map((inicial, indice) => (
              <span
                key={indice}
                className="flex h-7 items-center justify-center text-xs font-medium text-slate-400"
              >
                {inicial}
              </span>
            ))}
          </div>

          <div ref={grade} onKeyDown={naGrade} className="numeros grid grid-cols-7 gap-1">
            {casas.map((iso, indice) =>
              iso === null ? (
                <span key={`vazio-${indice}`} />
              ) : (
                <Dia
                  key={iso}
                  iso={iso}
                  selecionado={iso === value}
                  hoje={iso === hoje}
                  desabilitado={iso < min}
                  focavel={iso === diaFocado}
                  onClick={() => escolher(iso)}
                />
              ),
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-xs text-slate-500">{rotuloLongo(value)}</span>

            <button
              type="button"
              onClick={() => escolher(hoje)}
              disabled={hoje < min}
              className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dia({
  iso,
  selecionado,
  hoje,
  desabilitado,
  focavel,
  onClick,
}: {
  iso: string;
  selecionado: boolean;
  hoje: boolean;
  desabilitado: boolean;
  focavel: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-dia={iso}
      onClick={onClick}
      disabled={desabilitado}
      tabIndex={focavel ? 0 : -1}
      aria-label={rotuloLongo(iso)}
      aria-pressed={selecionado}
      aria-current={hoje ? 'date' : undefined}
      className={[
        'flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1',
        selecionado
          ? 'bg-brand-600 font-medium text-white hover:bg-brand-700'
          : desabilitado
            ? 'cursor-not-allowed text-slate-300'
            : hoje
              ? 'font-semibold text-brand-600 hover:bg-brand-50'
              : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {Number(iso.slice(8))}
    </button>
  );
}

function SetaMes({
  direcao,
  rotulo,
  onClick,
  disabled,
}: {
  direcao: -1 | 1;
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d={direcao === -1 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function IconeCalendario() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 8.5h14M7 3v3M13 3v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function maiorEntre(a: string, b: string): string {
  return a < b ? b : a;
}
