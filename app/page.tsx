import { LeadForm } from '@/components/lead-form';
import { Bot, Workflow } from 'lucide-react';

export default function Home() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-center">Lead Agent</h1>
        <div className="flex items-center justify-center">
          <Bot />
          <Workflow />
        </div>
      </div>

      <LeadForm />
    </main>
  );
}
