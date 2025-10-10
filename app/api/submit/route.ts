import { formSchema } from '@/lib/types';
import { after } from 'next/server';
import {
  queryKnowledgeBase,
  deepResearch,
  humanFeedback,
  qualify,
  writeEmail
} from '@/lib/services';

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }
  const { data } = parsedBody;

  after(async () => {
    const qualification = await qualify(data);

    if (
      qualification.category === 'QUALIFIED' ||
      qualification.category === 'FOLLOW_UP'
    ) {
      const context = await queryKnowledgeBase(data.message);
      const research = await deepResearch(data.message, context);
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
