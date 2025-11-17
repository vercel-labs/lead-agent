import { slackApp } from '@/lib/slack';
import { sendEmail } from '@/lib/services';

// Only set up event handlers if Slack is initialized
if (slackApp) {
  slackApp.event('app_mention', async ({ event, client, logger }) => {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `Hello <@${event.user}>!`
    });
  });

  slackApp.action(
    'lead_approved',
    async ({ body, action, ack, client, logger }) => {
      await ack();
      // in production, grab email from database or storage
      await sendEmail('Send email to the lead');
    }
  );

  slackApp.action(
    'lead_rejected',
    async ({ body, action, ack, client, logger }) => {
      await ack();
      // take action for feedback from human
    }
  );
}

export async function POST(request: Request) {
  if (!slackApp) {
    return new Response('Slack credentials not configured', { status: 503 });
  }

  try {
    const body = await request.text();
    const headers = {
      'x-slack-signature': request.headers.get('x-slack-signature') || '',
      'x-slack-request-timestamp':
        request.headers.get('x-slack-request-timestamp') || '',
      'content-type': request.headers.get('content-type') || ''
    };

    // Process the event using Slack Bolt
    const result = await slackApp.processEvent({
      body,
      headers,
      // @ts-ignore - ack and respond are handled by Bolt internally
      ack: async (response: any) => response,
      respond: async (response: any) => response
    });

    return new Response(result?.body || '', {
      status: result?.statusCode || 200,
      headers: result?.headers || {}
    });
  } catch (error) {
    console.error('Error processing Slack event:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
