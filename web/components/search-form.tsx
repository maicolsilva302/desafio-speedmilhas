'use client';

import { useEffect, useRef, useState } from 'react';

import { AIRPORTS } from '../lib/airports';
import { somarDias } from '../lib/calendar';
import { aquecer } from '../lib/prefetch';
import type { Pedido } from '../lib/types';
import { DatePicker } from './date-picker';

export function SearchForm({
  initialDate,
  onSearch,
  loading,
}: {
  initialDate: string;
  onSearch: (pedido: Pedido) => void;
  loading: boolean;
}) {
  const [origin, setOrigin] = useState('GRU');
  const [destination, setDestination] = useState('GIG');
  const [date, setDate] = useState(initialDate);
  const [idaEVolta, setIdaEVolta] = useState(false);
  const [returnDate, setReturnDate] = useState(() => somarDias(initialDate, 3));
  const returnDateInvalid = idaEVolta && returnDate < date;

  const jaBuscou = useRef(false);

  useEffect(() => {
    if (!destination || loading || jaBuscou.current) {
      return;
    }

    const id = setTimeout(() => void aquecer({ origin, destination, date }), 700);

    return () => clearTimeout(id);
  }, [origin, destination, date, loading]);

  function trocarOrigem(nova: string): void {
    setOrigin(nova);

    if (destination === nova) {
      setDestination('');
    }
  }

  function submeter(event: React.FormEvent): void {
    event.preventDefault();

    if (!destination) {
      return;
    }

    jaBuscou.current = true;
    onSearch({
      ida: { origin, destination, date },
      volta: idaEVolta ? { origin: destination, destination: origin, date: returnDate } : null,
    });
  }

  return (
    <form onSubmit={submeter} className="rounded-lg border border-slate-200 bg-white p-4">
      <fieldset className="mb-3 flex gap-4 text-sm text-slate-700">
        <legend className="sr-only">Tipo de viagem</legend>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="tipo-viagem"
            checked={!idaEVolta}
            onChange={() => setIdaEVolta(false)}
          />
          Somente ida
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="tipo-viagem"
            checked={idaEVolta}
            onChange={() => setIdaEVolta(true)}
          />
          Ida e volta
        </label>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Origem">
          <Seletor value={origin} onChange={trocarOrigem} />
        </Campo>

        <Campo rotulo="Destino">
          <Seletor
            value={destination}
            onChange={setDestination}
            placeholder="Selecione o destino"
            bloqueado={origin}
          />
        </Campo>

        <div>
          <span
            id="rotulo-ida"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Ida
          </span>

          <DatePicker
            value={date}
            min={initialDate}
            onChange={setDate}
            rotuladoPor="rotulo-ida"
          />
        </div>

        {idaEVolta && (
          <div>
            <span
              id="rotulo-volta"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Volta
            </span>

            <DatePicker
              value={returnDate}
              min={initialDate}
              onChange={setReturnDate}
              rotuladoPor="rotulo-volta"
            />
          </div>
        )}

        {returnDateInvalid && (
          <p role="alert" className="text-sm text-warn-700 sm:col-span-2">
            A data de volta não pode ser anterior à data de ida.
          </p>
        )}

        <div className="flex items-end sm:col-span-2 sm:justify-end">
          <button
            type="submit"
            disabled={loading || !destination || returnDateInvalid}
            className="h-[38px] w-full whitespace-nowrap rounded-md bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? 'Buscando…' : 'Buscar passagens'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Seletor({
  value,
  onChange,
  placeholder,
  bloqueado,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  bloqueado?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[38px] w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
    >
      {placeholder && <option value="">{placeholder}</option>}

      {AIRPORTS.map((airport) => (
        <option
          key={airport.code}
          value={airport.code}
          disabled={airport.code === bloqueado}
        >
          {airport.code} — {airport.name}
        </option>
      ))}
    </select>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{rotulo}</span>
      {children}
    </label>
  );
}
