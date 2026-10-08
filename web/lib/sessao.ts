import type { Pedido } from './types';

let ultimo: Pedido | null = null;

const reservadas = new Set<string>();

export function lembrarBusca(pedido: Pedido): void {
  ultimo = pedido;
}

export function ultimaBusca(): Pedido | null {
  return ultimo;
}

export function marcarReservada(quoteId: string): void {
  reservadas.add(quoteId);
}

export function reservasFeitas(): Set<string> {
  return new Set(reservadas);
}
