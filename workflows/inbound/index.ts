import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepWriteEmail
} from './steps';

/**
 * workflow to handle the inbound lead
 * - research the lead
 * - qualify the lead
 * - if the lead is qualified or follow up:
 *   - write an email for the lead
 *   - get human feedback for the email
 *   - send the email to the human for approval
 * - if the lead is not qualified or follow up:
 *   - take other actions here based on other qualification categories
 */
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  const research = await stepResearch(data);
  const qualification = await stepQualify(data, research);

  if (
    qualification.category === 'QUALIFIED' ||
    qualification.category === 'FOLLOW_UP'
  ) {
    const email = await stepWriteEmail(research, qualification);
    await stepHumanFeedback(research, email, qualification);
  }

  // take other actions here based on other qualification categories
};
