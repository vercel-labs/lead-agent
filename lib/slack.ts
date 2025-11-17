import { App, LogLevel } from '@slack/bolt';

const logLevel =
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

const hasSlackCredentials =
  process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET;

if (!hasSlackCredentials) {
  console.warn(
    '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set. Slack integration will be disabled.'
  );
}

/**
 * Slack App instance
 */
export const slackApp = hasSlackCredentials
  ? new App({
      token: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      logLevel
    })
  : null;

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function sendSlackMessageWithButtons(
  channel: string,
  text: string
): Promise<{ messageTs: string; channel: string }> {
  if (!slackApp) {
    throw new Error(
      'Slack app is not initialized. Please set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables.'
    );
  }

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
