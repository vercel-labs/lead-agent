import {
  humanFeedback,
  qualify,
  researchAgent,
  writeEmail
} from '@/lib/services';
import { FormSchema, QualificationSchema } from '@/lib/types';

/**
 * step to qualify the lead
 */
export const stepQualify = async (data: FormSchema, research: string) => {
  'use step';

  const qualification = await qualify(data, research);
  return qualification;
};

/**
 * step to research the lead
 */
export const stepResearch = async (data: FormSchema) => {
  'use step';

  const { text: research } = await researchAgent.generate({
    prompt: `Research the lead: ${JSON.stringify(data)}`
  });

  return research;
};

/**
 * step to write an email for the lead
 */
export const stepWriteEmail = async (
  research: string,
  qualification: QualificationSchema
) => {
  'use step';

  const email = await writeEmail(research, qualification);
  return email;
};

/**
 * step to get human feedback for the email
 */
export const stepHumanFeedback = async (
  research: string,
  email: string,
  qualification: QualificationSchema
) => {
  'use step';

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  const slackMessage = await humanFeedback(research, email, qualification);
  return slackMessage;
};
