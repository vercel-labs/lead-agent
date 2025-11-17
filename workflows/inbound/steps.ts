import {
  humanFeedback,
  qualify,
  researchAgent,
  writeEmail
} from '@/lib/services';
import { FormSchema, QualificationSchema } from '@/lib/types';

/**
 * Qualify the lead based on research
 */
export const stepQualify = async (data: FormSchema, research: string) => {
  const qualification = await qualify(data, research);
  return qualification;
};

/**
 * Research the lead using AI agent
 */
export const stepResearch = async (data: FormSchema) => {
  const { text: research } = await researchAgent.generate({
    prompt: `Research the lead: ${JSON.stringify(data)}`
  });

  return research;
};

/**
 * Write an email for the lead
 */
export const stepWriteEmail = async (
  research: string,
  qualification: QualificationSchema
) => {
  const email = await writeEmail(research, qualification);
  return email;
};

/**
 * Get human feedback for the email via Slack
 */
export const stepHumanFeedback = async (
  research: string,
  email: string,
  qualification: QualificationSchema
) => {
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  const slackMessage = await humanFeedback(research, email, qualification);
  return slackMessage;
};
