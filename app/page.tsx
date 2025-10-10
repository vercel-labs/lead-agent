import { LeadForm } from './lead-form';

export default function Home() {
  return (
    <div className="items-center justify-items-center min-h-screen p-8">
      <main className="flex flex-col row-start-2 items-center sm:items-start">
        <LeadForm />
      </main>
    </div>
  );
}
