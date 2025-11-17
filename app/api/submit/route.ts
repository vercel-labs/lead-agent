import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { processInboundLead } from '@/workflows/inbound';

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

  // Process lead asynchronously in the background
  processInboundLead(parsedBody.data).catch((error) => {
    console.error('Error processing lead:', error);
  });

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}
