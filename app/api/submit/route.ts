import { formSchema } from '@/lib/types';
import { after } from 'next/server';
import {
  researchAgent,
  humanFeedback,
  qualify,
  writeEmail
} from '@/lib/services';
import { checkBotId } from 'botid/server';

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
  const { data } = parsedBody;

  // in a production environment, we would use a queue to process the leads instead of using after
  after(async () => {
    const { text: research } = await researchAgent.generate({
      prompt: `Research the lead: ${JSON.stringify(data)}`
    });

    const qualification = await qualify(data, research);

    if (
      qualification.category === 'QUALIFIED' ||
      qualification.category === 'FOLLOW_UP'
    ) {
      const email = await writeEmail(research, qualification);
      await humanFeedback(research, email, qualification);
    }

    // take other actions here based on other qualification categories
  });

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}
