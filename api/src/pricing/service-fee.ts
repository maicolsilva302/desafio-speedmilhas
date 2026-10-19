export const SERVICE_FEE_PERCENT = 7;

export interface Pricing {
  taxesBrl: number;
  serviceFeeBrl: number;
  totalBrl: number;
}

export function serviceFeeCents(taxesCents: number): number {
  return Math.ceil((taxesCents * SERVICE_FEE_PERCENT) / 100);
}

export function priceOf(taxesBrl: number): Pricing {
  const taxesCents = Math.round(taxesBrl * 100);
  const feeCents = serviceFeeCents(taxesCents);

  return {
    taxesBrl: taxesCents / 100,
    serviceFeeBrl: feeCents / 100,
    totalBrl: (taxesCents + feeCents) / 100,
  };
}
