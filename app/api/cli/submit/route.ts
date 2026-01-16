import { formSchema } from '@/lib/types';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';

/**
 * POST - Submit lead from CLI and start workflow
 */
export async function POST(request: Request) {
  const body = await request.json();

  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  const workflowId = await start(workflowInbound, [parsedBody.data]);

  return Response.json(
    { message: 'Workflow started', workflowId },
    { status: 200 }
  );
}
