import { BookingFlow } from '../../../components/booking-flow';

export const metadata = {
  title: 'Reservar passagem — Speed Milhas',
};

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <BookingFlow quoteId={quoteId} />
    </main>
  );
}
