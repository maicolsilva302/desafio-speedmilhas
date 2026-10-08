import { toTrimmedString } from '../common/coercion';

const CARRIERS = [
  { name: 'LATAM', iata: 'LA' },
  { name: 'GOL', iata: 'G3' },
  { name: 'AZUL', iata: 'AD' },
] as const;

export interface Carrier {
  name: string;
  iata: string | null;
}

const MAX_NAME_LENGTH = 40;
const MAX_IATA_LENGTH = 3;

export function carrierFromName(raw: unknown): Carrier | null {
  const name = toTrimmedString(raw, MAX_NAME_LENGTH)?.toUpperCase();

  if (!name) {
    return null;
  }

  const known = CARRIERS.find((carrier) => carrier.name === name);

  return known ? { name: known.name, iata: known.iata } : { name, iata: null };
}

export function carrierFromIata(raw: unknown): Carrier | null {
  const code = toTrimmedString(raw, MAX_NAME_LENGTH)?.toUpperCase();

  if (!code) {
    return null;
  }

  const known = CARRIERS.find((carrier) => carrier.iata === code);

  if (known) {
    return { name: known.name, iata: known.iata };
  }

  return { name: code, iata: code.length <= MAX_IATA_LENGTH ? code : null };
}
