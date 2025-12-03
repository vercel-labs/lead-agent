import { createHandler } from '@vercel/slack-bolt';
import { slackApp, receiver } from '@/lib/slack';
import { sendEmail } from '@/lib/services';

// Only set up event handlers if Slack is initialized
if (slackApp && receiver) {
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

export const POST =
  slackApp && receiver
    ? createHandler(slackApp, receiver)
    : () =>
        new Response('Slack credentials not configured', {
          status: 503
        });
