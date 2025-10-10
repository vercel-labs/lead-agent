import { App, LogLevel } from '@slack/bolt';
import { VercelReceiver } from '@vercel/slack-bolt';

const logLevel =
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

export const receiver = new VercelReceiver({
  logLevel
});

/**
 * Slack App instance
 */
export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
  deferInitialization: true,
  logLevel
});

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function sendSlackMessageWithButtons(
  channel: string,
  text: string
): Promise<{ messageTs: string; channel: string }> {
  // Ensure the app is initialized
  await slackApp.client.auth.test();

  // Send message with blocks including action buttons
  const result = await slackApp.client.chat.postMessage({
    channel,
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👍 Approve',
              emoji: true
            },
            style: 'primary',
            action_id: 'lead_approved'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👎 Reject',
              emoji: true
            },
            style: 'danger',
            action_id: 'lead_rejected'
          }
        ]
      }
    ]
  });

  if (!result.ok || !result.ts) {
    throw new Error(`Failed to send Slack message`);
  }

  return {
    messageTs: result.ts,
    channel: result.channel!
  };
}
