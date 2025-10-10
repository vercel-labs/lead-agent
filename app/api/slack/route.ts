import { createHandler } from '@vercel/slack-bolt';
import { slackApp, receiver } from '@/lib/slack';

slackApp.event('app_mention', async ({ event, client, logger }) => {
  await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.ts,
    text: `Hello <@${event.user}>!`
  });
});

const handler = createHandler(slackApp, receiver);
export const POST = handler;
