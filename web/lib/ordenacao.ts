import type { StreamQuote } from './types';

export function compararOfertas(a: StreamQuote, b: StreamQuote): number {
  if (a.miles !== b.miles) {
    return a.miles - b.miles;
  }

  const taxaA = a.taxesBrl ?? Number.POSITIVE_INFINITY;
  const taxaB = b.taxesBrl ?? Number.POSITIVE_INFINITY;

  if (taxaA !== taxaB) {
    return taxaA - taxaB;
  }

  if (a.supplier !== b.supplier) {
    return a.supplier.localeCompare(b.supplier);
  }

  return a.supplierIndex - b.supplierIndex;
}

export function mesclarOfertas(
  atuais: StreamQuote[],
  novas: StreamQuote[],
): StreamQuote[] {
  const vistas = new Set(atuais.map((quote) => quote.id));
  const inéditas = novas.filter((quote) => !vistas.has(quote.id));

  if (inéditas.length === 0) {
    return atuais;
  }

  return [...atuais, ...inéditas].sort(compararOfertas);
}
