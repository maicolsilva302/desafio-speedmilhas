import Link from 'next/link';

import { ReservaDetalhe } from '../../../components/reserva-detalhe';

export const metadata = {
  title: 'Reserva — Speed Milhas',
};

export default async function ReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link
        href="/reservas"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <span aria-hidden>←</span> Minhas reservas
      </Link>

      <ReservaDetalhe id={id} />
    </main>
  );
}
