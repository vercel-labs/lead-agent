import { formSchema } from '@/lib/schema';

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }
  const { data } = parsedBody;

  console.log(data);

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}
