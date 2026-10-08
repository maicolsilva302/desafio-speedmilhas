import Link from 'next/link';

import { ReservasLista } from '../../components/reservas-lista';

export const metadata = {
  title: 'Minhas reservas — Speed Milhas',
};

export default function ReservasPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <span aria-hidden>←</span> Voltar para a busca
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Minhas reservas</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        As reservas feitas pela agência selecionada no topo da página.
      </p>

      <ReservasLista />
    </main>
  );
}
