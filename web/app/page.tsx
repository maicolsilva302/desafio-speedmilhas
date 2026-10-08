import { SearchScreen } from '../components/search-screen';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Buscar passagens</h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare passagens em milhas de três fornecedores em uma busca só.
        </p>
      </header>

      <SearchScreen />
    </main>
  );
}
