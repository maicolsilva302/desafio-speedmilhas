export const AIRPORTS = [
  { code: 'GRU', city: 'São Paulo', name: 'São Paulo — Guarulhos' },
  { code: 'GIG', city: 'Rio de Janeiro', name: 'Rio de Janeiro — Galeão' },
  { code: 'BSB', city: 'Brasília', name: 'Brasília' },
  { code: 'SSA', city: 'Salvador', name: 'Salvador' },
  { code: 'REC', city: 'Recife', name: 'Recife' },
  { code: 'POA', city: 'Porto Alegre', name: 'Porto Alegre' },
  { code: 'CNF', city: 'Belo Horizonte', name: 'Belo Horizonte — Confins' },
  { code: 'FOR', city: 'Fortaleza', name: 'Fortaleza' },
] as const;

export function cityOf(code: string): string {
  return AIRPORTS.find((airport) => airport.code === code)?.city ?? code;
}

export function nameOf(code: string): string {
  return AIRPORTS.find((airport) => airport.code === code)?.name ?? code;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');

  return `${day}/${month}/${year}`;
}
