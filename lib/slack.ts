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
