import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema
} from '@/lib/types';

/**
 * Qualify the lead
 */
export async function qualify(lead: FormSchema): Promise<QualificationSchema> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `Qualify the lead and give a reason for the qualification based on the following information: ${JSON.stringify(
      lead
    )}`
  });

  return object;
}

/**
 * Write an email
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema
) {
  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `Write an email for a ${
      qualification.category
    } lead based on the following information: ${JSON.stringify(research)}`
  });

  return text;
}

/**
 * Query the knowledge base
 */
export async function queryKnowledgeBase(query: string) {
  /**
   * Query the knowledge base for the given query
   * - ex: pull from turbopuffer, pinecone, postgres, snowflake, etc.
   * Return the context from the knowledge base
   */
  return 'Context from knowledge base';
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  /**
   * Send the research and qualification to the human for approval in slack
   */
}

/**
 * Send an email
 */
export async function sendEmail(email: string) {
  /**
   * send email using provider like sendgrid, mailgun, resend etc.
   */
}

/**
 * Deep research
 */
export async function deepResearch(query: string, context: string) {
  /**
   * Deep research using exa.ai
   * Return the results in markdown format
   */
  return 'Results from research';
}
