import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { start } from '@vercel/workflow-core/runtime';
import { workflowInbound } from '@/workflows/inbound';

export async function POST(request: Request) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();

  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  await start(workflowInbound, [parsedBody.data]);

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}
