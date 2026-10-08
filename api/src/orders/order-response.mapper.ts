import type { Order, Quote, Search } from '../generated/prisma/client';
import type { SupplierCode } from '../suppliers/supplier.types';

export type QuoteComBusca = Quote & { search: Search };

export interface OrderResponse {
  id: string;
  status: string;
  idempotencyKey: string;
  clientId: string;
  createdAt: string;
  passageiro: {
    nome: string;
    documento: string | null;
    documentoTipo: string | null;
    email: string | null;
  };
  quote: {
    id: string;
    supplier: SupplierCode;
    carrier: string;
    carrierCode: string | null;
  };
  trecho: { origin: string; destination: string; date: string };
  total: {
    miles: number;
    taxesBrl: number;
    serviceFeeBrl: number;
    totalBrl: number;
    currency: string;
  };
}

export function toOrderResponse(order: Order, quote: QuoteComBusca): OrderResponse {
  const taxesBrl = Number(order.taxesBrl);
  const serviceFeeBrl = Number(order.serviceFeeBrl);

  return {
    id: order.id,
    status: order.status,
    idempotencyKey: order.idempotencyKey,
    clientId: order.clientId,
    createdAt: order.createdAt.toISOString(),
    passageiro: {
      nome: order.passengerName,
      documento: order.passengerDocument,
      documentoTipo: order.passengerDocumentType,
      email: order.passengerEmail,
    },
    quote: {
      id: quote.id,
      supplier: quote.supplier as SupplierCode,
      carrier: quote.carrier,
      carrierCode: quote.carrierCode,
    },
    trecho: {
      origin: quote.search.origin,
      destination: quote.search.destination,
      date: quote.search.departureDate,
    },
    total: {
      miles: order.miles,
      taxesBrl,
      serviceFeeBrl,
      totalBrl: Math.round((taxesBrl + serviceFeeBrl) * 100) / 100,
      currency: quote.currency,
    },
  };
}
