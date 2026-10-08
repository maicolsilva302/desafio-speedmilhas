import { DOCUMENTOS, mascararDocumento, type TipoDocumento } from '../lib/mascaras';

export function formatarDocumento(documento: string, tipo: string | null): string {
  return tipo && tipo in DOCUMENTOS
    ? mascararDocumento(documento, tipo as TipoDocumento)
    : documento;
}

export function rotuloDoDocumento(tipo: string | null): string {
  return tipo && tipo in DOCUMENTOS ? DOCUMENTOS[tipo as TipoDocumento].rotulo : 'Documento';
}

export function formatarQuando(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{rotulo}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  );
}
