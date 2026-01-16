import { ExaSearchForm } from '@/components/exa-search-form';
import { Search, Database } from 'lucide-react';

export default function Home() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-center">Exa Company Search</h1>
        <div className="flex items-center justify-center">
          <Search />
          <Database />
        </div>
      </div>

      <ExaSearchForm />
    </main>
  );
}
