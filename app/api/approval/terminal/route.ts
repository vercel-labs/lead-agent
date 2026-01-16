import { approvalStoreService } from '@/lib/approval-store';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const updateSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
  feedback: z.string().optional()
});

/**
 * GET - Fetch pending approvals
 */
export async function GET() {
  const pending = await approvalStoreService.getPending();
  return Response.json({ pending });
}

/**
 * POST - Update approval status
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const { id, approved, feedback } = parsed.data;

  await approvalStoreService.update(
    id,
    approved ? 'approved' : 'rejected',
    feedback
  );

  return Response.json({ success: true });
}
