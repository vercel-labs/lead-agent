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
  qualificationSchema,
  ApprovalMode,
  ApprovalRequest
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

/**
 * Qualify the lead
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `You are qualifying leads for a penetration testing company. Analyze the lead and research to determine if they're a good fit for pentesting services.

LEAD DATA: ${JSON.stringify(lead)}

RESEARCH: ${research}

Qualification Criteria:
- QUALIFIED: Company has clear security needs (compliance, funding, complex tech stack, recent breach, hiring security roles)
- FOLLOW_UP: Potential fit but needs more information (unclear budget, timeline, or authority)
- SUPPORT: Asking technical/presales questions, not ready to buy yet
- UNQUALIFIED: No budget, no security needs, or outside target market

Give a detailed reason explaining the qualification decision based on the research findings.`
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
    prompt: `Write a personalized outreach email for a penetration testing services lead.

QUALIFICATION: ${qualification.category}
REASON: ${qualification.reason}

RESEARCH FINDINGS: ${research}

Email Guidelines:
- Keep it concise (3-4 short paragraphs max)
- Reference specific details from the research (funding, compliance needs, recent news, tech stack, etc.)
- Position pentesting as a solution to their specific needs
- For QUALIFIED leads: Propose a discovery call or scoping session
- For FOLLOW_UP leads: Ask clarifying questions to move them forward
- Use a consultative, helpful tone (not salesy)
- Include a clear call-to-action

Write the email body only (no subject line needed).`
  });

  return text;
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  const message = `*New Lead Qualification*\n\n*Email:* ${email}\n*Category:* ${
    qualification.category
  }\n*Reason:* ${qualification.reason}\n\n*Research:*\n${research.slice(
    0,
    500
  )}...\n\n*Please review and approve or reject this email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  return await sendSlackMessageWithButtons(slackChannel, message);
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
 * Get approval mode from environment
 */
function getApprovalMode(): ApprovalMode {
  const mode = process.env.APPROVAL_MODE?.toLowerCase();

  if (mode === 'terminal' || mode === 'none') {
    return mode;
  }

  // Default to slack if credentials exist
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
    return 'slack';
  }

  return 'terminal';
}

/**
 * Terminal-based human feedback
 */
export async function terminalHumanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
): Promise<string> {
  const { randomUUID } = await import('crypto');
  const { approvalStoreService } = await import('./approval-store');

  const approvalId = randomUUID();

  const approvalRequest: ApprovalRequest = {
    id: approvalId,
    research,
    email,
    qualification,
    timestamp: Date.now(),
    status: 'pending',
    mode: 'terminal'
  };

  await approvalStoreService.create(approvalRequest);

  console.log(`\n📋 Approval required: ${approvalId}`);
  console.log(`⏳ Waiting for terminal approval...\n`);

  const status = await approvalStoreService.waitForApproval(approvalId);

  if (status === 'approved') {
    console.log('✅ Email approved!');
    return approvalId;
  } else {
    console.log('❌ Email rejected');
    throw new Error('Email rejected by user');
  }
}

/**
 * Route to appropriate human feedback method
 */
export async function humanFeedbackRouter(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  const mode = getApprovalMode();

  switch (mode) {
    case 'slack':
      return await humanFeedback(research, email, qualification);
    case 'terminal':
      return await terminalHumanFeedback(research, email, qualification);
    case 'none':
      console.log('⚠️  Approval mode set to "none", skipping approval');
      return null;
    default:
      throw new Error(`Unknown approval mode: ${mode}`);
  }
}

/**
 * ------------------------------------------------------------
 * Agent & Tools
 * ------------------------------------------------------------
 */

/**
 * Fetch tool
 */
export const fetchUrl = tool({
  description: 'Return visible text from a public URL as Markdown.',
  inputSchema: z.object({
    url: z.string().describe('Absolute URL, including http:// or https://')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents(url, {
      text: true
    });
    return result;
  }
});

/**
 * Pentesting lead finder tool
 */
export const findPentestingLeads = tool({
  description:
    'Find companies that likely need pentesting services based on industry, funding, compliance requirements, or recent security events',
  inputSchema: z.object({
    industry: z
      .string()
      .optional()
      .describe('Industry to target (e.g. "healthcare", "finance", "SaaS")'),
    signal: z
      .enum([
        'recent_funding',
        'compliance_requirement',
        'data_breach',
        'ipo_filing',
        'hiring_security',
        'government_contract'
      ])
      .optional()
      .describe('Signal indicating pentesting need')
  }),
  execute: async ({ industry, signal }) => {
    // Build search query based on signals
    const queries = [];

    if (signal === 'recent_funding') {
      queries.push(
        `${industry || ''} Series A funding announcement security audit pentesting`.trim()
      );
    } else if (signal === 'compliance_requirement') {
      queries.push(
        `${industry || ''} SOC 2 compliance penetration testing`.trim()
      );
      queries.push(
        `${industry || ''} ISO 27001 security assessment`.trim()
      );
    } else if (signal === 'data_breach') {
      queries.push(
        `${industry || ''} data breach incident response penetration test`.trim()
      );
    } else if (signal === 'ipo_filing') {
      queries.push(
        `${industry || ''} IPO filing S-1 security penetration testing`.trim()
      );
    } else if (signal === 'hiring_security') {
      queries.push(
        `${industry || ''} hiring CISO security engineer penetration testing`.trim()
      );
    } else if (signal === 'government_contract') {
      queries.push('government RFP penetration testing cybersecurity');
    } else {
      // Default: companies looking for pentesting
      queries.push(
        `${industry || ''} penetration testing services needed`.trim()
      );
    }

    // Use Exa to search for leads
    const results = await Promise.all(
      queries.map(async (query) => {
        try {
          const searchResults = await exa.searchAndContents(query, {
            numResults: 3,
            type: 'keyword',
            category: 'company',
            summary: true
          });
          return searchResults;
        } catch (error) {
          console.error(`Search failed for query: ${query}`, error);
          return { results: [] };
        }
      })
    );

    // Format results as lead intelligence
    const leads = results.flatMap((result: any) =>
      (result.results || []).map((item: any) => ({
        company: item.title,
        url: item.url,
        summary: item.summary || item.text?.slice(0, 300),
        relevance: signal || 'general'
      }))
    );

    return leads.length > 0
      ? leads
      : 'No pentesting leads found for the given criteria. Try different industry or signal.';
  }
});

/**
 * Tech-stack analysis tool
 */
export const techStackAnalysis = tool({
  description: 'Return tech stack analysis for a domain.',
  inputSchema: z.object({
    domain: z.string().describe('Domain, e.g. "vercel.com"')
  }),
  execute: async ({ domain }) => {
    // fetch the tech stack for the domain
    return [];
  }
});

/**
 * Search tool
 */
const search = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    keywords: z
      .string()
      .describe(
        'The entity to search for (e.g. "Apple") — do not include any Vercel specific keywords'
      ),
    resultCategory: z
      .enum([
        'company',
        'research paper',
        'news',
        'pdf',
        'github',
        'tweet',
        'personal site',
        'financial report'
      ])
      .describe('The category of the result you are looking for')
  }),
  execute: async ({ keywords, resultCategory }) => {
    /**
     * Deep research using exa.ai
     * Return the results in markdown format
     */
    const result = await exa.searchAndContents(keywords, {
      numResults: 2,
      type: 'keyword',
      category: resultCategory,
      summary: true
    });
    return result;
  }
});

/**
 * Query the knowledge base
 */
const queryKnowledgeBase = tool({
  description: 'Query the knowledge base for the given query.',
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }: { query: string }) => {
    /**
     * Query the knowledge base for the given query
     * - ex: pull from turbopuffer, pinecone, postgres, snowflake, etc.
     * Return the context from the knowledge base
     */
    return 'Context from knowledge base for the given query';
  }
});

/**
 * Research agent
 *
 * This agent is used to research the lead and return a comprehensive report
 */
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  system: `
  You are a researcher specializing in finding potential pentesting clients. You are given a lead and you need to research them to determine if they're a good fit for penetration testing services.

  You can use the tools provided to you to find information about the lead:
  - search: Searches the web for information about companies, news, funding, etc.
  - queryKnowledgeBase: Queries the knowledge base for the given query
  - fetchUrl: Fetches the contents of a public URL
  - findPentestingLeads: Finds companies that likely need pentesting based on signals like funding, compliance, breaches, etc.
  - techStackAnalysis: Analyzes the tech stack of the given domain

  Focus on finding:
  1. Company size and industry (healthcare, finance, SaaS are high-value)
  2. Recent funding rounds or IPO filings (triggers security audits)
  3. Compliance requirements (SOC 2, ISO 27001, HIPAA, PCI-DSS)
  4. Recent security incidents or data breaches
  5. Job postings for security roles (CISO, Security Engineer)
  6. Tech stack complexity (more complex = more attack surface)

  Synthesize the information you find into a comprehensive report that helps qualify the lead for pentesting services.
  `,
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    findPentestingLeads,
    techStackAnalysis
    // add other tools here
  },
  stopWhen: [stepCountIs(20)] // stop after max 20 steps
});
