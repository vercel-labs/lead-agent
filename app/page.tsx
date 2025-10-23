import { LeadForm } from '@/components/lead-form';
import { Bot, Workflow } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-center">Lead Agent</h1>
          <div className="flex items-center justify-center">
            <Bot />
            <Workflow />
          </div>
        </div>
        <Link
          href="https://github.com/vercel-labs/lead-agent"
          className="text-center mt-2 underline"
        >
          GitHub Repository
        </Link>
      </div>

      <LeadForm />
    </main>
  );
}
