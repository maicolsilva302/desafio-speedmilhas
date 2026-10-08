import type { ReactNode } from 'react';
import './globals.css';

import { Topo } from '../components/topo';

export const metadata = {
  title: 'Speed Milhas — Busca de passagens em milhas',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Topo />
        {children}
      </body>
    </html>
  );
}
