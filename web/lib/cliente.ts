import { useEffect, useState } from 'react';

const CHAVE = 'speedmilhas:agencia';
const EVENTO = 'speedmilhas:agencia';

export interface Agencia {
  id: string;
  name: string;
}

export function agenciaAtual(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function trocarAgencia(id: string): void {
  try {
    window.localStorage.setItem(CHAVE, id);
  } catch {
    return;
  }

  window.dispatchEvent(new Event(EVENTO));
}

export function useAgencia(): string | null {
  const [agencia, setAgencia] = useState<string | null>(null);

  useEffect(() => {
    const atualizar = () => setAgencia(agenciaAtual());

    atualizar();

    window.addEventListener(EVENTO, atualizar);
    window.addEventListener('storage', atualizar);

    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);

  return agencia;
}
