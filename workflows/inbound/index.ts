import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepWriteEmail
} from './steps';

/**
 * Handle the inbound lead processing
 * - research the lead
 * - qualify the lead
 * - if the lead is qualified or follow up:
 *   - write an email for the lead
 *   - get human feedback for the email
 *   - send the email to the human for approval
 * - if the lead is not qualified or follow up:
 *   - take other actions here based on other qualification categories
 */
export const processInboundLead = async (data: FormSchema) => {
  try {
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
  } catch (error) {
    console.error('Error processing inbound lead:', error);
    throw error;
  }
};
