# Lead Agent - Comprehensive Documentation

> **⚠️ Note**: This documentation was created for an earlier version that used Vercel Workflow DevKit for durable execution. The codebase has been updated to remove Vercel-specific dependencies and now uses standard async processing. Some sections may reference outdated patterns like `'use workflow'` and `'use step'` directives, or `@vercel/slack-bolt`. Please refer to the current codebase and README.md for the most up-to-date implementation details.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [Component Documentation](#component-documentation)
8. [Service Layer Documentation](#service-layer-documentation)
9. [Workflow System](#workflow-system)
10. [Integration Guide](#integration-guide)
11. [Configuration Guide](#configuration-guide)
12. [Extension Guide](#extension-guide)
13. [Deployment Guide](#deployment-guide)
14. [Data Models & Schemas](#data-models--schemas)
15. [Security & Bot Protection](#security--bot-protection)
16. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is Lead Agent?

Lead Agent is an **intelligent lead qualification and research system** built as a reference architecture for modern AI-powered applications. It demonstrates how to build production-ready AI workflows that combine:

- **Autonomous AI agents** for research and decision-making
- **Durable execution** for reliable background processing
- **Human-in-the-loop** workflows for oversight and control
- **Enterprise integrations** (Slack, CRM, email services)

### Key Capabilities

1. **Automated Lead Capture**: Web form with client-side validation and bot protection
2. **Deep Research**: AI agent autonomously researches leads using multiple tools and data sources
3. **Intelligent Qualification**: AI-powered categorization with reasoning
4. **Personalized Email Generation**: Context-aware email drafting
5. **Human Approval Workflow**: Slack-based review before sending communications
6. **Durable Execution**: Fault-tolerant background processing with automatic retry

### Use Cases

- **Lead qualification** for sales teams
- **Support ticket triage** and routing
- **Partnership inquiry** processing
- **Template for custom AI workflows** in your organization

---

## Architecture & Design Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                          │
│                    (Next.js App Router + React)                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  POST /api/submit│              │  POST /api/slack │         │
│  │  - Bot protection│              │  - Webhook handler│        │
│  │  - Validation    │              │  - Slack events  │         │
│  └────────┬─────────┘              └────────▲─────────┘         │
└───────────┼────────────────────────────────┼───────────────────┘
            │                                │
            ▼                                │
┌─────────────────────────────────────────────┼───────────────────┐
│                  Workflow Layer (Durable)   │                   │
│  ┌──────────────────────────────────────────┼────────────────┐  │
│  │  workflowInbound (use workflow)          │                │  │
│  │    ↓                                     │                │  │
│  │  stepResearch (AI Agent with tools)      │                │  │
│  │    ↓                                     │                │  │
│  │  stepQualify (generateObject)            │                │  │
│  │    ↓                                     │                │  │
│  │  stepWriteEmail (generateText)           │                │  │
│  │    ↓                                     │                │  │
│  │  stepHumanFeedback (Slack approval) ─────┘                │  │
│  │    ↓                                                       │  │
│  │  sendEmail (on approval)                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────┐  ┌──────────────────────────────┐
│   External AI Services      │  │  External Integrations       │
│  - OpenAI GPT-5 (via AI SDK)│  │  - Slack (Bolt framework)    │
│  - Exa.ai (web search)      │  │  - Email provider (stub)     │
│  - AI Gateway (routing)     │  │  - CRM (placeholder)         │
└─────────────────────────────┘  └──────────────────────────────┘
```

### Design Patterns

#### 1. **Durable Workflow Execution Pattern**

**Problem**: Long-running AI operations can fail due to timeouts, infrastructure issues, or API errors.

**Solution**: Use Workflow DevKit with `'use workflow'` and `'use step'` directives.

**Benefits**:
- Each step is independently retryable
- Workflow state is persisted
- Automatic recovery from failures
- HTTP responses don't block on long operations

**Implementation**:
```typescript
// workflows/inbound/index.ts
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  const research = await stepResearch(data);  // Step 1: Isolated, retryable
  const qualification = await stepQualify(data, research);  // Step 2: Isolated, retryable

  if (qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') {
    const email = await stepWriteEmail(data, research, qualification);  // Step 3
    await stepHumanFeedback(data, email, qualification);  // Step 4
  }
};
```

#### 2. **AI Agent with Tool Use Pattern**

**Problem**: AI needs to autonomously gather information from multiple sources to make informed decisions.

**Solution**: Use AI SDK Agent class with custom tools.

**Benefits**:
- Agent decides which tools to use and when
- Can chain multiple tool calls
- Self-limits to prevent infinite loops
- Synthesizes multi-source information

**Implementation**:
```typescript
// lib/services.ts
const researchAgent = new Agent({
  model: 'openai/gpt-5',
  tools: {
    search,                 // Exa.ai web search
    queryKnowledgeBase,     // Internal KB
    fetchUrl,               // Content extraction
    crmSearch,              // CRM lookup
    techStackAnalysis       // Tech stack detection
  },
  stopWhen: [stepCountIs(20)]
});
```

#### 3. **Graceful Degradation Pattern**

**Problem**: Optional integrations (like Slack) shouldn't crash the app if not configured.

**Solution**: Conditional initialization with null checks.

**Benefits**:
- App works with partial configuration
- Clear error messages for missing features
- Easy to test core functionality without all integrations

**Implementation**:
```typescript
// lib/slack.ts
const hasSlackCredentials =
  process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET;

export const slackApp = hasSlackCredentials
  ? new App({ token: process.env.SLACK_BOT_TOKEN, ... })
  : null;

// In usage:
if (!slackApp) {
  console.warn('Slack not configured - skipping approval workflow');
  return;
}
```

#### 4. **Human-in-the-Loop (HITL) Pattern**

**Problem**: Autonomous AI systems need human oversight for critical decisions.

**Solution**: Send decisions to Slack with approve/reject buttons before execution.

**Benefits**:
- Prevents autonomous mistakes
- Builds trust in AI systems
- Captures human feedback for improvement
- Compliance with business policies

**Implementation**:
```typescript
// workflows/inbound/steps.ts
export const stepHumanFeedback = async (data, email, qualification) => {
  'use step';

  const approved = await humanFeedback({
    email: data.email,
    emailContent: email,
    qualification
  });

  if (approved) {
    await sendEmail(data.email, email);
  }
};
```

#### 5. **Immediate Response + Background Processing Pattern**

**Problem**: Users shouldn't wait for long AI operations (which can take minutes).

**Solution**: Return HTTP response immediately, process in background.

**Benefits**:
- Excellent user experience (instant feedback)
- No timeout issues
- Scalable processing
- Can handle bursts of requests

**Implementation**:
```typescript
// app/api/submit/route.ts
export async function POST(request: Request) {
  const data = formSchema.parse(body);

  // Start workflow asynchronously (don't await!)
  workflowInbound(data);

  // Return immediately
  return NextResponse.json({ message: 'Form submitted successfully' });
}
```

#### 6. **Structured Output Generation Pattern**

**Problem**: AI outputs are unpredictable and hard to parse reliably.

**Solution**: Use AI SDK's `generateObject` with Zod schemas.

**Benefits**:
- Type-safe AI responses
- Guaranteed structure validation
- Runtime type checking
- Compile-time type inference

**Implementation**:
```typescript
// lib/services.ts
const { object } = await generateObject({
  model: 'openai/gpt-5',
  schema: qualificationSchema,  // Zod schema enforces structure
  prompt: `Qualify this lead: ${JSON.stringify(data)}`
});

// object is guaranteed to match QualificationResult type
```

#### 7. **Type-Safe Full Stack Pattern**

**Problem**: Type mismatches between client, server, and database.

**Solution**: Single source of truth with Zod schemas + TypeScript inference.

**Benefits**:
- No runtime type errors
- Autocomplete throughout stack
- Refactoring safety
- Self-documenting API contracts

**Implementation**:
```typescript
// lib/types.ts - Single source of truth
export const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  // ...
});

export type FormSchema = z.infer<typeof formSchema>;

// Used in: React Hook Form, API validation, workflow inputs
```

---

## Core Features

### 1. Lead Capture Form

**Location**: `/components/lead-form.tsx`, `/app/page.tsx`

**Functionality**:
- Collects: email (required), name (required), phone (optional), company (optional), message (required)
- Client-side validation with React Hook Form + Zod
- Real-time error messages
- Toast notifications for success/error states
- Bot protection with BotID

**User Flow**:
1. User fills out form
2. Client-side validation checks inputs
3. On submit: BotID verification runs
4. POST to `/api/submit`
5. Success toast shown
6. Form resets for next submission

**Code Example**:
```tsx
// components/lead-form.tsx
const form = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: '',
    name: '',
    phone: '',
    company: '',
    message: ''
  }
});

const onSubmit = async (data: FormSchema) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // Handle response...
};
```

### 2. Deep Research Agent

**Location**: `/lib/services.ts` - `researchAgent`

**Functionality**:
- Autonomous AI agent using OpenAI GPT-5
- Access to 5 different tools
- Max 20 steps to prevent infinite loops
- Generates comprehensive research report

**Available Tools**:

#### Tool 1: `search` - Web Search via Exa.ai
```typescript
search: tool({
  description: 'Search the web for information about a company or topic',
  parameters: z.object({
    query: z.string().describe('Search query'),
    category: z.enum([
      'company', 'research paper', 'news', 'pdf', 'github',
      'tweet', 'personal site', 'linkedin profile', 'financial report'
    ]).optional()
  }),
  execute: async ({ query, category }) => {
    const results = await exa.searchAndContents(query, {
      category,
      numResults: 5,
      text: { maxCharacters: 1000 }
    });
    return results;
  }
})
```

**Use Case**: Find recent news about a company, research papers, LinkedIn profiles, etc.

#### Tool 2: `queryKnowledgeBase` - Internal Knowledge Lookup
```typescript
queryKnowledgeBase: tool({
  description: 'Query your internal knowledge base for product info, pricing, case studies',
  parameters: z.object({
    query: z.string().describe('What to search for in knowledge base')
  }),
  execute: async ({ query }) => {
    // TODO: Implement with Turbopuffer, Pinecone, PostgreSQL, Snowflake, etc.
    return 'Knowledge base not yet implemented';
  }
})
```

**Extension Point**: Connect to your vector database or knowledge management system.

#### Tool 3: `fetchUrl` - URL Content Extraction
```typescript
fetchUrl: tool({
  description: 'Fetch and parse content from a specific URL as markdown',
  parameters: z.object({
    url: z.string().url().describe('URL to fetch')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents([url], { text: true });
    return result.results[0]?.text || 'No content found';
  }
})
```

**Use Case**: Deep-dive into specific company pages, blog posts, documentation.

#### Tool 4: `crmSearch` - CRM Lookup
```typescript
crmSearch: tool({
  description: 'Search your CRM for existing opportunities or contacts',
  parameters: z.object({
    email: z.string().email().optional(),
    company: z.string().optional()
  }),
  execute: async ({ email, company }) => {
    // TODO: Implement Salesforce, HubSpot, Snowflake integration
    return [];
  }
})
```

**Extension Point**: Connect to Salesforce, HubSpot, or custom CRM.

#### Tool 5: `techStackAnalysis` - Technology Detection
```typescript
techStackAnalysis: tool({
  description: 'Analyze a company\'s technology stack',
  parameters: z.object({
    domain: z.string().describe('Company domain to analyze')
  }),
  execute: async ({ domain }) => {
    // TODO: Implement with BuiltWith, Wappalyzer, or custom solution
    return [];
  }
})
```

**Extension Point**: Integrate with BuiltWith API or build custom tech detection.

**Agent Behavior**:
- Agent reads the research prompt
- Decides which tools to use based on available information
- Can make multiple tool calls in sequence
- Synthesizes findings into coherent report
- Automatically stops after 20 steps or when task complete

### 3. Lead Qualification

**Location**: `/lib/services.ts` - `qualify()`

**Functionality**:
- Uses AI SDK's `generateObject` with GPT-5
- Categorizes leads into predefined categories
- Provides reasoning for each decision
- Structured output guaranteed by Zod schema

**Qualification Categories**:
```typescript
// lib/types.ts
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',    // High-value lead, ready for sales
  'UNQUALIFIED',  // Not a good fit
  'SUPPORT',      // Should route to support team
  'FOLLOW_UP'     // Needs more information/nurturing
]);
```

**Customization**:
To add new categories, edit `lib/types.ts`:
```typescript
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',
  'UNQUALIFIED',
  'SUPPORT',
  'FOLLOW_UP',
  'PARTNER',      // New: Partnership inquiry
  'INVESTOR',     // New: Investment inquiry
  'SPAM'          // New: Clearly spam
]);
```

**AI Prompt**:
```typescript
const prompt = `
You are a lead qualification specialist. Analyze this lead and categorize it.

Lead Information:
${JSON.stringify(data)}

Research Report:
${research}

Provide:
1. Category (QUALIFIED, UNQUALIFIED, SUPPORT, or FOLLOW_UP)
2. Detailed reasoning for your decision
`;
```

**Output Schema**:
```typescript
export const qualificationSchema = z.object({
  category: qualificationCategorySchema,
  reason: z.string().describe('Detailed explanation of qualification decision')
});
```

### 4. Personalized Email Generation

**Location**: `/lib/services.ts` - `writeEmail()`

**Functionality**:
- Uses AI SDK's `generateText` with GPT-5
- Context-aware: uses lead data, research, and qualification
- Generates professional, personalized emails
- Adapts tone based on qualification category

**AI Prompt Strategy**:
```typescript
const prompt = `
Write a professional email response to this lead.

Lead Details:
- Name: ${data.name}
- Email: ${data.email}
- Company: ${data.company || 'Not provided'}
- Message: ${data.message}

Research Context:
${research}

Qualification:
- Category: ${qualification.category}
- Reason: ${qualification.reason}

Instructions:
- Be professional and friendly
- Address their specific inquiry
- ${qualification.category === 'QUALIFIED'
    ? 'Express enthusiasm and suggest next steps'
    : 'Be polite and provide helpful guidance'}
- Keep it concise (2-3 paragraphs)
`;
```

**Customization Points**:
- Adjust tone/style in prompt
- Add company-specific information
- Include pricing/product details from knowledge base
- Add legal disclaimers or branding

### 5. Human-in-the-Loop Approval

**Location**: `/lib/services.ts` - `humanFeedback()`, `/lib/slack.ts`

**Functionality**:
- Sends generated email to Slack channel
- Displays lead context and qualification
- Provides approve/reject buttons
- Waits for human decision before proceeding

**Slack Message Structure**:
```typescript
// lib/slack.ts
export const sendSlackMessageWithButtons = async ({
  email,
  emailContent,
  qualification
}) => {
  await slackApp.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📧 New Lead Email for Review' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Lead Email:*\n${email}` },
          { type: 'mrkdwn', text: `*Category:*\n${qualification.category}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Generated Email:*\n${emailContent}` }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve' },
            style: 'primary',
            action_id: 'lead_approved',
            value: email
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Reject' },
            style: 'danger',
            action_id: 'lead_rejected',
            value: email
          }
        ]
      }
    ]
  });
};
```

**Approval Flow**:
1. Email generated by AI
2. Sent to Slack channel with context
3. Human reviewer reads email and context
4. Clicks approve or reject
5. Webhook sent to `/api/slack`
6. If approved: email sent to lead
7. If rejected: logged, no email sent

**Webhook Handler**:
```typescript
// app/api/slack/route.ts
slackApp.action('lead_approved', async ({ ack, body }) => {
  await ack();
  const email = body.actions[0].value;
  console.log(`Lead approved: ${email}`);

  // TODO: Trigger email send
  // In production, lookup email content from database
  await sendEmail(email, 'Email content here');
});

slackApp.action('lead_rejected', async ({ ack, body }) => {
  await ack();
  const email = body.actions[0].value;
  console.log(`Lead rejected: ${email}`);
});
```

### 6. Bot Protection

**Location**: `/instrumentation-client.ts`, `/app/api/submit/route.ts`

**Functionality**:
- Uses BotID library for bot detection
- Client-side fingerprinting
- Server-side verification
- Protects form submissions from automated spam

**Implementation**:
```typescript
// instrumentation-client.ts
import { protect } from 'botid';

export async function register() {
  await protect([
    {
      path: '/api/submit',
      method: 'POST'
    }
  ]);
}

// app/api/submit/route.ts
import { isBotRequest } from 'botid/server';

export async function POST(request: Request) {
  if (isBotRequest(request)) {
    return NextResponse.json(
      { error: 'Bot detected' },
      { status: 403 }
    );
  }
  // Process legitimate request...
}
```

---

## Technology Stack

### Core Framework

**Next.js 16.0.0**
- React framework with App Router
- Server components by default
- Built-in API routes
- Optimized for production deployment on Vercel

**React 19.1.0**
- Latest React with concurrent features
- Server and client components
- Suspense and streaming

**TypeScript 5**
- Full type safety across the stack
- Strict mode enabled
- Compile-time error detection

### AI & Workflows

**Vercel AI SDK 5.0.68**
- `generateObject` - Structured AI outputs with Zod schemas
- `generateText` - Text generation
- `Agent` class - Autonomous agents with tools
- `tool` - Function calling interface
- AI Gateway integration - Model routing and management

**Workflow DevKit 4.0.1-beta.1**
- `'use workflow'` directive - Mark workflow functions
- `'use step'` directive - Mark individual steps
- Durable execution with automatic retry
- State persistence
- Vercel AI Cloud integration

**Exa.ai 1.10.2**
- Web search with category filtering
- URL content extraction as markdown
- Company research capabilities
- Up-to-date information retrieval

### Integration & Communication

**Slack Bolt 4.5.0**
- Event handling (app mentions, button clicks)
- Interactive components (buttons, modals)
- Block Kit message formatting

**@vercel/slack-bolt 1.0.2**
- Vercel adapter for Slack Bolt
- Serverless-compatible Slack apps
- Easy deployment on Vercel

**@slack/web-api 7.11.0**
- Slack Web API client
- Posting messages, uploading files
- User and channel management

### Forms & Validation

**React Hook Form 7.64.0**
- Performant form state management
- Uncontrolled components for better performance
- Built-in validation support
- TypeScript-first API

**Zod 4.1.12**
- Schema validation
- TypeScript type inference
- Runtime type checking
- API contract definition

**@hookform/resolvers 5.2.2**
- Zod integration for React Hook Form
- Seamless validation pipeline

### UI & Styling

**Tailwind CSS 4**
- Utility-first CSS framework
- Custom design system via CSS variables
- Dark mode support
- JIT compilation

**shadcn/ui**
- Radix UI primitives (@radix-ui/*)
- Accessible components
- Copy-paste component library
- Customizable with Tailwind

**Lucide React 0.545.0**
- Icon library
- 1000+ icons
- Tree-shakeable

**Sonner 2.0.7**
- Toast notifications
- Promise-based API
- Accessible and customizable

**next-themes 0.4.6**
- Dark mode implementation
- System preference detection
- No flash on page load

### Security & Utilities

**BotID 1.5.9**
- Bot detection and prevention
- Client-side fingerprinting
- Server-side verification

**clsx 2.1.1** & **tailwind-merge 3.3.1**
- Conditional className merging
- Tailwind class conflict resolution

**class-variance-authority 0.7.1**
- Component variant management
- Type-safe prop variants

---

## Project Structure

```
lead-agent/
├── app/                                    # Next.js App Router
│   ├── api/                               # API Routes
│   │   ├── submit/                        # Form submission endpoint
│   │   │   └── route.ts                   # POST handler, bot check, workflow start
│   │   └── slack/                         # Slack webhook endpoint
│   │       └── route.ts                   # Slack event handler
│   ├── page.tsx                           # Home page (lead form)
│   ├── layout.tsx                         # Root layout (fonts, metadata)
│   ├── globals.css                        # Global styles (Tailwind directives)
│   └── favicon.ico                        # Favicon
│
├── components/                             # React Components
│   ├── lead-form.tsx                      # Main contact form
│   └── ui/                                # shadcn/ui components
│       ├── button.tsx                     # Button component
│       ├── form.tsx                       # Form wrapper
│       ├── input.tsx                      # Input field
│       ├── label.tsx                      # Label component
│       ├── separator.tsx                  # Visual separator
│       ├── sonner.tsx                     # Toast provider
│       └── textarea.tsx                   # Textarea field
│
├── lib/                                    # Core Business Logic
│   ├── services.ts                        # AI services (qualify, research, email)
│   ├── slack.ts                           # Slack integration utilities
│   ├── types.ts                           # Zod schemas & TypeScript types
│   ├── exa.ts                             # Exa.ai client initialization
│   └── utils.ts                           # Utility functions (cn, etc.)
│
├── workflows/                              # Workflow DevKit Workflows
│   └── inbound/                           # Inbound lead workflow
│       ├── index.ts                       # Main workflow function (use workflow)
│       └── steps.ts                       # Individual steps (use step)
│
├── public/                                 # Static Assets
│   └── file.svg                           # Example SVG icon
│
├── .env.example                           # Environment variable template
├── .gitignore                             # Git ignore rules
├── components.json                        # shadcn/ui configuration
├── instrumentation-client.ts              # BotID client setup
├── instrumentation.ts                     # Server instrumentation
├── manifest.json                          # Slack app manifest
├── next.config.ts                         # Next.js configuration
├── package.json                           # Dependencies & scripts
├── pnpm-lock.yaml                         # Dependency lock file
├── postcss.config.mjs                     # PostCSS configuration
├── README.md                              # Project README
├── tailwind.config.ts                     # Tailwind CSS configuration
└── tsconfig.json                          # TypeScript configuration
```

### Directory Purposes

**`/app`** - Next.js App Router structure
- Handles all pages and API routes
- Server components by default
- Automatic code splitting

**`/components`** - Reusable React components
- UI library from shadcn/ui
- Custom components (lead-form)
- Client components when needed

**`/lib`** - Business logic and utilities
- Core service functions
- Type definitions
- Third-party client initialization
- Shared utilities

**`/workflows`** - Durable workflow definitions
- Workflow DevKit workflows
- Background job orchestration
- Retry logic and state management

**`/public`** - Static assets
- Images, fonts, icons
- Served from root path

---

## API Documentation

### POST /api/submit

**Description**: Handles lead form submissions and initiates the qualification workflow.

**Authentication**: None (public endpoint)

**Protection**: BotID verification

**Request**:
```http
POST /api/submit
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+1-555-123-4567",
  "company": "Acme Corp",
  "message": "Interested in your enterprise plan"
}
```

**Request Schema**:
```typescript
{
  email: string;     // Required, valid email format
  name: string;      // Required, 2-50 characters
  phone?: string;    // Optional, regex validated
  company?: string;  // Optional
  message: string;   // Required, 10-500 characters
}
```

**Response** (Success - 200):
```json
{
  "message": "Form submitted successfully"
}
```

**Response** (Bot Detected - 403):
```json
{
  "error": "Bot detected"
}
```

**Response** (Validation Error - 400):
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Response** (Server Error - 500):
```json
{
  "error": "Internal server error"
}
```

**Implementation**:
```typescript
// app/api/submit/route.ts
export async function POST(request: Request) {
  try {
    // 1. Bot detection
    if (isBotRequest(request)) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const data = formSchema.parse(body);

    // 3. Start workflow asynchronously (don't await!)
    workflowInbound(data);

    // 4. Return immediate success response
    return NextResponse.json({ message: 'Form submitted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Workflow Initiated**:
After successful submission, the following workflow runs in the background:
1. Research agent gathers information
2. Lead is qualified
3. Email is generated (if qualified)
4. Slack approval requested (if configured)
5. Email sent (if approved)

**Notes**:
- Response is returned immediately (doesn't wait for workflow)
- Workflow runs durably in the background
- No timeout issues even for long-running operations

---

### POST /api/slack

**Description**: Slack webhook handler for events and interactive components.

**Authentication**: Slack signing secret verification

**Protection**: Slack signature validation

**Events Handled**:

#### 1. App Mention Event
**Trigger**: User mentions the Slack bot (@bot-name)

**Request** (Slack event):
```json
{
  "type": "event_callback",
  "event": {
    "type": "app_mention",
    "user": "U123456",
    "text": "<@BOT_ID> hello",
    "channel": "C123456",
    "ts": "1234567890.123456"
  }
}
```

**Response**: Automated reply in Slack channel

**Handler**:
```typescript
slackApp.event('app_mention', async ({ event, say }) => {
  await say(`Hello <@${event.user}>! 👋`);
});
```

#### 2. Lead Approved Action
**Trigger**: User clicks "Approve" button on email review message

**Request** (Slack interaction):
```json
{
  "type": "block_actions",
  "actions": [
    {
      "action_id": "lead_approved",
      "value": "john@example.com",
      "type": "button"
    }
  ]
}
```

**Handler**:
```typescript
slackApp.action('lead_approved', async ({ ack, body }) => {
  await ack();  // Acknowledge within 3 seconds

  const email = body.actions[0].value;
  console.log(`✅ Lead approved: ${email}`);

  // TODO: Lookup email content from database and send
  await sendEmail(email, emailContent);
});
```

#### 3. Lead Rejected Action
**Trigger**: User clicks "Reject" button on email review message

**Request** (Slack interaction):
```json
{
  "type": "block_actions",
  "actions": [
    {
      "action_id": "lead_rejected",
      "value": "john@example.com",
      "type": "button"
    }
  ]
}
```

**Handler**:
```typescript
slackApp.action('lead_rejected', async ({ ack, body }) => {
  await ack();

  const email = body.actions[0].value;
  console.log(`❌ Lead rejected: ${email}`);

  // Email not sent, rejection logged
});
```

**Response** (Success - 200):
```json
{
  "ok": true
}
```

**Response** (Slack Not Configured - 503):
```json
{
  "error": "Slack integration not configured"
}
```

**Notes**:
- All Slack interactions must be acknowledged within 3 seconds
- Webhook URL must be configured in Slack app settings
- Endpoint is conditionally initialized based on environment variables

---

## Component Documentation

### LeadForm Component

**Location**: `/components/lead-form.tsx`

**Type**: Client Component (`'use client'`)

**Purpose**: Main contact form for lead capture with validation and submission handling.

**Props**: None (standalone component)

**Features**:
- React Hook Form for state management
- Zod validation with real-time error messages
- Toast notifications (Sonner)
- Loading states
- Auto-reset after submission
- BotID protection (automatic)

**Implementation**:
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormSchema } from '@/lib/types';
import { toast } from 'sonner';

export function LeadForm() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      company: '',
      message: ''
    }
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Submission failed');

      toast.success('Form submitted successfully!');
      form.reset();
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields... */}
      </form>
    </Form>
  );
}
```

**Form Fields**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | text | Yes | Valid email format |
| name | text | Yes | 2-50 characters |
| phone | tel | No | Regex pattern for phone numbers |
| company | text | No | Any string |
| message | textarea | Yes | 10-500 characters |

**States**:
- `idle` - Form ready for input
- `submitting` - Request in progress (button disabled)
- `success` - Submission successful (toast shown, form reset)
- `error` - Submission failed (error toast shown)

**Accessibility**:
- Proper label associations
- ARIA attributes
- Keyboard navigation
- Focus management
- Error announcements

**Customization**:
```typescript
// Add new field
const extendedFormSchema = formSchema.extend({
  industry: z.string().optional()
});

// Add to component
<FormField
  control={form.control}
  name="industry"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Industry</FormLabel>
      <FormControl>
        <Input placeholder="e.g., Healthcare" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### shadcn/ui Components

**Location**: `/components/ui/`

**Overview**: Pre-built accessible components based on Radix UI primitives, styled with Tailwind CSS.

#### Button Component

**Location**: `/components/ui/button.tsx`

**Usage**:
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants**:
- `default` - Primary button
- `destructive` - Dangerous actions
- `outline` - Secondary button
- `ghost` - Minimal styling
- `link` - Link styling

**Sizes**:
- `sm` - Small
- `default` - Medium
- `lg` - Large
- `icon` - Icon-only button

#### Form Components

**Location**: `/components/ui/form.tsx`

**Components**:
- `Form` - Form context provider
- `FormField` - Individual field wrapper
- `FormItem` - Field container
- `FormLabel` - Field label
- `FormControl` - Input wrapper
- `FormDescription` - Help text
- `FormMessage` - Error message

**Usage**:
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" {...field} />
        </FormControl>
        <FormDescription>We'll never share your email.</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

#### Input Component

**Location**: `/components/ui/input.tsx`

**Usage**:
```tsx
import { Input } from '@/components/ui/input';

<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled" />
```

#### Textarea Component

**Location**: `/components/ui/textarea.tsx`

**Usage**:
```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="Enter your message" rows={5} />
```

---

## Service Layer Documentation

### Location: `/lib/services.ts`

This file contains all core business logic and AI service functions.

---

### qualify()

**Purpose**: Categorize leads using AI-powered analysis.

**Signature**:
```typescript
export async function qualify(
  data: FormSchema,
  research: string
): Promise<QualificationResult>
```

**Parameters**:
- `data` - Lead form data (email, name, company, message)
- `research` - Research report from research agent

**Returns**:
```typescript
{
  category: 'QUALIFIED' | 'UNQUALIFIED' | 'SUPPORT' | 'FOLLOW_UP';
  reason: string;
}
```

**Implementation**:
```typescript
export async function qualify(data: FormSchema, research: string) {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `
      You are a lead qualification specialist.

      Lead Information:
      ${JSON.stringify(data, null, 2)}

      Research Report:
      ${research}

      Categorize this lead as:
      - QUALIFIED: High-value lead ready for sales
      - UNQUALIFIED: Not a good fit for our product
      - SUPPORT: Technical support request
      - FOLLOW_UP: Needs more nurturing

      Provide detailed reasoning for your decision.
    `
  });

  return object;
}
```

**Usage Example**:
```typescript
const qualification = await qualify(
  { email: 'john@acme.com', name: 'John Doe', ... },
  'Research shows Acme Corp is a Series B SaaS company...'
);

console.log(qualification);
// {
//   category: 'QUALIFIED',
//   reason: 'Acme Corp is a fast-growing SaaS company that matches our ICP...'
// }
```

**Customization**:
- Modify prompt to align with your qualification criteria
- Add additional context (pricing, product fit, etc.)
- Change categories in `lib/types.ts`

---

### writeEmail()

**Purpose**: Generate personalized response emails using AI.

**Signature**:
```typescript
export async function writeEmail(
  data: FormSchema,
  research: string,
  qualification: QualificationResult
): Promise<string>
```

**Parameters**:
- `data` - Lead form data
- `research` - Research report
- `qualification` - Qualification result with category and reason

**Returns**: Email content as string

**Implementation**:
```typescript
export async function writeEmail(
  data: FormSchema,
  research: string,
  qualification: QualificationResult
) {
  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `
      Write a professional email response to this lead.

      Lead Information:
      - Name: ${data.name}
      - Email: ${data.email}
      - Company: ${data.company || 'Not provided'}
      - Message: ${data.message}

      Research Context:
      ${research}

      Qualification:
      - Category: ${qualification.category}
      - Reason: ${qualification.reason}

      Guidelines:
      - Be professional and friendly
      - Address their specific inquiry from the message
      - ${qualification.category === 'QUALIFIED'
          ? 'Express enthusiasm and suggest next steps (demo, call, etc.)'
          : qualification.category === 'SUPPORT'
          ? 'Direct them to support resources'
          : 'Be polite and provide helpful guidance'}
      - Keep it concise (2-3 short paragraphs)
      - Sign off appropriately
    `
  });

  return text;
}
```

**Output Example**:
```
Hi John,

Thank you for reaching out! I reviewed your inquiry about our enterprise plan,
and I'm excited to share that our solution would be a great fit for Acme Corp's
needs, especially given your focus on scaling SaaS operations.

I'd love to schedule a 30-minute demo to show you how our platform can help
you achieve your goals. Are you available this week for a quick call?

Looking forward to connecting!

Best regards,
[Your Name]
```

**Customization**:
- Add company-specific templates
- Include product information from knowledge base
- Personalize based on industry/company size
- Add legal disclaimers or terms

---

### humanFeedback()

**Purpose**: Send email draft to Slack for human approval.

**Signature**:
```typescript
export async function humanFeedback(params: {
  email: string;
  emailContent: string;
  qualification: QualificationResult;
}): Promise<boolean>
```

**Parameters**:
- `email` - Lead's email address
- `emailContent` - Generated email text
- `qualification` - Qualification result

**Returns**: `true` if approved, `false` if rejected (in current implementation, this is handled via webhook)

**Implementation**:
```typescript
export async function humanFeedback({
  email,
  emailContent,
  qualification
}: {
  email: string;
  emailContent: string;
  qualification: QualificationResult;
}) {
  if (!slackApp) {
    console.warn('Slack not configured - skipping human feedback');
    return true; // Auto-approve if Slack not configured
  }

  await sendSlackMessageWithButtons({
    email,
    emailContent,
    qualification
  });

  // Note: Actual approval is handled via webhook
  // This function just sends the message
}
```

**Slack Message Preview**:
```
📧 New Lead Email for Review

Lead Email: john@example.com
Category: QUALIFIED

Qualification Reason:
Acme Corp is a fast-growing SaaS company...

Generated Email:
Hi John,

Thank you for reaching out...

[✅ Approve] [❌ Reject]
```

**Notes**:
- Approval is asynchronous via webhook
- In production, email content should be stored in database
- Webhook looks up email content by lead email address

---

### sendEmail()

**Purpose**: Send email to lead (placeholder for actual email service integration).

**Signature**:
```typescript
export async function sendEmail(
  to: string,
  content: string
): Promise<void>
```

**Current Implementation**:
```typescript
export async function sendEmail(to: string, content: string) {
  console.log(`📧 Sending email to ${to}`);
  console.log(`Content: ${content}`);

  // TODO: Integrate with email service provider
  // Examples:
  // - SendGrid
  // - Mailgun
  // - Resend
  // - AWS SES
}
```

**Integration Examples**:

#### Resend (Recommended)
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, content: string) {
  await resend.emails.send({
    from: 'sales@yourdomain.com',
    to,
    subject: 'Re: Your inquiry',
    text: content
  });
}
```

#### SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(to: string, content: string) {
  await sgMail.send({
    to,
    from: 'sales@yourdomain.com',
    subject: 'Re: Your inquiry',
    text: content
  });
}
```

---

### researchAgent

**Purpose**: Autonomous AI agent that researches leads using multiple tools.

**Configuration**:
```typescript
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis
  },
  stopWhen: [stepCountIs(20)]
});
```

**Usage**:
```typescript
const result = await researchAgent.generate({
  prompt: `
    Research this lead thoroughly:

    Name: ${data.name}
    Email: ${data.email}
    Company: ${data.company}
    Message: ${data.message}

    Investigate:
    1. Company background and size
    2. Recent news or funding
    3. Technology stack
    4. Existing relationship with us (check CRM)
    5. Industry trends relevant to their needs

    Provide a comprehensive research report.
  `
});

const research = result.text;
```

**Agent Behavior**:
- Reads the research prompt
- Autonomously decides which tools to use
- Can make multiple tool calls in sequence
- Synthesizes findings into coherent report
- Stops after 20 steps or when task complete

**Example Agent Thought Process**:
```
Step 1: Use search tool to find company website
Step 2: Use fetchUrl to read company About page
Step 3: Use search tool for recent news
Step 4: Use crmSearch to check for existing contacts
Step 5: Use techStackAnalysis to understand their tech
Step 6-10: Deep dive into relevant findings
Step 11: Synthesize all information into report
```

**Output Example**:
```
Based on my research, here's what I found about this lead:

Company Overview:
- Acme Corp is a Series B SaaS company with 150 employees
- Founded in 2019, raised $25M in Series B (March 2024)
- Focus: Project management software for remote teams

Recent Activity:
- Just announced partnership with Salesforce (2 weeks ago)
- Hiring for VP of Engineering (posted yesterday)
- Featured in TechCrunch for innovative approach to async work

Technology Stack:
- Frontend: React, TypeScript
- Backend: Node.js, PostgreSQL
- Cloud: AWS
- Notable: Using Stripe for payments

CRM Check:
- No existing contacts or opportunities
- First time inquiry

Relevance:
- Their message mentions scaling challenges, which aligns with our product
- Company size (150 employees) fits our sweet spot
- Recent funding suggests budget availability
- Tech stack is compatible with our integration offerings

Recommendation: High-priority lead - strong fit for our enterprise plan
```

---

## Workflow System

### Location: `/workflows/inbound/`

The workflow system uses **Workflow DevKit** to create durable, fault-tolerant background processes.

---

### Main Workflow: workflowInbound

**Location**: `/workflows/inbound/index.ts`

**Purpose**: Orchestrate the complete lead qualification process from submission to email approval.

**Signature**:
```typescript
export const workflowInbound = async (data: FormSchema): Promise<void>
```

**Directive**: `'use workflow'` - Marks this function for durable execution

**Implementation**:
```typescript
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  // Step 1: Research the lead
  const research = await stepResearch(data);

  // Step 2: Qualify based on research
  const qualification = await stepQualify(data, research);

  // Step 3 & 4: Only for qualified/follow-up leads
  if (
    qualification.category === 'QUALIFIED' ||
    qualification.category === 'FOLLOW_UP'
  ) {
    const email = await stepWriteEmail(data, research, qualification);
    await stepHumanFeedback(data, email, qualification);
  }
};
```

**Execution Flow**:
```
User submits form
    ↓
POST /api/submit (returns immediately)
    ↓
workflowInbound starts (background)
    ↓
stepResearch (can take 2-5 minutes)
    ↓
stepQualify (15-30 seconds)
    ↓
If QUALIFIED or FOLLOW_UP:
    ↓
stepWriteEmail (15-30 seconds)
    ↓
stepHumanFeedback (sends to Slack, waits for approval)
    ↓
On approval: sendEmail
```

**Durability Guarantees**:
- If Step 1 fails, only Step 1 is retried (not the whole workflow)
- If server crashes during Step 2, workflow resumes from Step 2
- State is persisted between steps
- No duplicate execution of completed steps

---

### Workflow Steps

**Location**: `/workflows/inbound/steps.ts`

Each step is decorated with `'use step'` for isolation and retry capability.

---

#### stepResearch

**Purpose**: Run the research agent to gather information about the lead.

**Signature**:
```typescript
export const stepResearch = async (data: FormSchema): Promise<string>
```

**Implementation**:
```typescript
export const stepResearch = async (data: FormSchema) => {
  'use step';

  const result = await researchAgent.generate({
    prompt: `
      Research this lead thoroughly and provide a comprehensive report.

      Lead Information:
      - Name: ${data.name}
      - Email: ${data.email}
      - Company: ${data.company || 'Not provided'}
      - Phone: ${data.phone || 'Not provided'}
      - Message: ${data.message}

      Investigation areas:
      1. Company background, size, and industry
      2. Recent news, funding, or significant events
      3. Technology stack and infrastructure
      4. Existing relationship with us (check CRM)
      5. Decision maker identification
      6. Pain points mentioned in their message
      7. Budget and authority indicators

      Provide a detailed research report that will help qualify this lead.
    `
  });

  return result.text;
};
```

**Execution Time**: 2-5 minutes (agent can make up to 20 tool calls)

**Output**: Comprehensive research report (500-2000 words)

**Error Handling**: Automatic retry on failure, up to 3 attempts

---

#### stepQualify

**Purpose**: Categorize the lead based on form data and research.

**Signature**:
```typescript
export const stepQualify = async (
  data: FormSchema,
  research: string
): Promise<QualificationResult>
```

**Implementation**:
```typescript
export const stepQualify = async (data: FormSchema, research: string) => {
  'use step';

  return await qualify(data, research);
};
```

**Execution Time**: 15-30 seconds

**Output**: Qualification category + reasoning

**Error Handling**: Automatic retry with exponential backoff

---

#### stepWriteEmail

**Purpose**: Generate personalized email response.

**Signature**:
```typescript
export const stepWriteEmail = async (
  data: FormSchema,
  research: string,
  qualification: QualificationResult
): Promise<string>
```

**Implementation**:
```typescript
export const stepWriteEmail = async (
  data: FormSchema,
  research: string,
  qualification: QualificationResult
) => {
  'use step';

  return await writeEmail(data, research, qualification);
};
```

**Execution Time**: 15-30 seconds

**Output**: Email content (200-500 words)

**Error Handling**: Automatic retry on API failures

---

#### stepHumanFeedback

**Purpose**: Send email draft to Slack for approval and wait for response.

**Signature**:
```typescript
export const stepHumanFeedback = async (
  data: FormSchema,
  email: string,
  qualification: QualificationResult
): Promise<void>
```

**Implementation**:
```typescript
export const stepHumanFeedback = async (
  data: FormSchema,
  email: string,
  qualification: QualificationResult
) => {
  'use step';

  await humanFeedback({
    email: data.email,
    emailContent: email,
    qualification
  });

  // Note: Actual approval is handled asynchronously via webhook
  // In production, this should wait for approval signal
};
```

**Execution Time**: Instant (message send) + indefinite (waiting for human)

**Output**: None (side effect: Slack message sent)

**Note**: In production, this step should wait for approval signal before completing.

---

### Workflow Deployment

**Requirements**:
- Must deploy to Vercel (Workflow DevKit uses Vercel infrastructure)
- Environment variables must be configured
- Workflow functions auto-detected by Next.js config

**Configuration**:
```typescript
// next.config.ts
import { withWorkflow } from 'workflow/next';

const nextConfig = {
  // Your Next.js config
};

export default withWorkflow(nextConfig);
```

**Monitoring**:
- View workflow executions in Vercel dashboard
- Check logs for step execution
- Monitor retry attempts
- Track execution duration

---

## Integration Guide

### Slack Integration

**Prerequisites**:
1. Slack workspace
2. Slack app created in workspace
3. Bot token and signing secret

**Setup Steps**:

#### 1. Create Slack App
```bash
# Go to https://api.slack.com/apps
# Click "Create New App" > "From a manifest"
# Select your workspace
# Paste contents of manifest.json from this repo
```

#### 2. Install App to Workspace
```bash
# In Slack app settings:
# - Go to "Install App"
# - Click "Install to Workspace"
# - Authorize the app
# - Copy the "Bot User OAuth Token"
```

#### 3. Get Signing Secret
```bash
# In Slack app settings:
# - Go to "Basic Information"
# - Under "App Credentials", find "Signing Secret"
# - Copy the secret
```

#### 4. Configure Environment Variables
```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_CHANNEL_ID=C123456789  # Channel ID where messages will be sent
```

**Finding Channel ID**:
```bash
# Right-click on channel in Slack > View channel details
# Scroll to bottom, copy Channel ID
```

#### 5. Update Webhook URLs (Production)
```json
// manifest.json
{
  "features": {
    "bot_user": {
      "display_name": "Lead Agent"
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "app_mentions:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://your-domain.com/api/slack",  // Update this
      "bot_events": [
        "app_mention"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://your-domain.com/api/slack"  // Update this
    }
  }
}
```

#### 6. Customize Slack Messages

**Location**: `/lib/slack.ts`

**Modify Message Format**:
```typescript
export const sendSlackMessageWithButtons = async ({
  email,
  emailContent,
  qualification
}) => {
  await slackApp.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📧 New Lead Email for Review'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Lead Email:*\n${email}`
          },
          {
            type: 'mrkdwn',
            text: `*Category:*\n${qualification.category}`
          },
          {
            type: 'mrkdwn',
            text: `*Reason:*\n${qualification.reason}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Generated Email:*\n\`\`\`\n${emailContent}\n\`\`\``
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Approve & Send'
            },
            style: 'primary',
            action_id: 'lead_approved',
            value: email
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Reject'
            },
            style: 'danger',
            action_id: 'lead_rejected',
            value: email
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✏️ Edit'
            },
            action_id: 'lead_edit',
            value: email
          }
        ]
      }
    ]
  });
};
```

**Testing Slack Integration**:
```bash
# Local development (use ngrok for webhook URL)
ngrok http 3000

# Update manifest.json with ngrok URL
# https://abc123.ngrok.io/api/slack

# Test in Slack:
# 1. Mention the bot: @Lead Agent hello
# 2. Submit a test lead via form
# 3. Check if message appears in configured channel
# 4. Click approve/reject buttons
```

---

### Email Service Integration

**Current State**: Placeholder function in `/lib/services.ts`

**Recommended Providers**:

#### Option 1: Resend (Modern, Developer-Friendly)

**Installation**:
```bash
pnpm add resend
```

**Configuration**:
```bash
# .env.local
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=sales@yourdomain.com
```

**Implementation**:
```typescript
// lib/services.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, content: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Re: Your inquiry',
      text: content,
      html: `<div style="white-space: pre-wrap;">${content}</div>`
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}
```

#### Option 2: SendGrid (Enterprise)

**Installation**:
```bash
pnpm add @sendgrid/mail
```

**Configuration**:
```bash
# .env.local
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=sales@yourdomain.com
```

**Implementation**:
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(to: string, content: string) {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Re: Your inquiry',
    text: content,
    html: `<div style="white-space: pre-wrap;">${content}</div>`
  });
}
```

#### Option 3: AWS SES (Cost-Effective at Scale)

**Installation**:
```bash
pnpm add @aws-sdk/client-ses
```

**Implementation**:
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'us-east-1' });

export async function sendEmail(to: string, content: string) {
  const command = new SendEmailCommand({
    Source: 'sales@yourdomain.com',
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: 'Re: Your inquiry' },
      Body: { Text: { Data: content } }
    }
  });

  await ses.send(command);
}
```

---

### CRM Integration

**Current State**: Placeholder tool in research agent

**Purpose**: Check for existing contacts/opportunities before treating as new lead

**Recommended CRMs**:

#### Salesforce Integration

**Installation**:
```bash
pnpm add jsforce
```

**Implementation**:
```typescript
// lib/services.ts
import jsforce from 'jsforce';

const sfConnection = new jsforce.Connection({
  loginUrl: process.env.SALESFORCE_LOGIN_URL
});

await sfConnection.login(
  process.env.SALESFORCE_USERNAME!,
  process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!
);

// Update crmSearch tool
crmSearch: tool({
  description: 'Search Salesforce CRM for existing opportunities or contacts',
  parameters: z.object({
    email: z.string().email().optional(),
    company: z.string().optional()
  }),
  execute: async ({ email, company }) => {
    const contacts = await sfConnection.sobject('Contact').find({
      Email: email
    });

    const accounts = company
      ? await sfConnection.sobject('Account').find({
          Name: { $like: `%${company}%` }
        })
      : [];

    return {
      existingContacts: contacts,
      existingAccounts: accounts
    };
  }
})
```

#### HubSpot Integration

**Installation**:
```bash
pnpm add @hubspot/api-client
```

**Implementation**:
```typescript
import { Client } from '@hubspot/api-client';

const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

crmSearch: tool({
  description: 'Search HubSpot CRM',
  parameters: z.object({
    email: z.string().email().optional()
  }),
  execute: async ({ email }) => {
    const contacts = await hubspot.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
      }]
    });

    return contacts.results;
  }
})
```

---

### Knowledge Base Integration

**Current State**: Placeholder tool in research agent

**Purpose**: Query internal product docs, case studies, pricing info

**Recommended Solutions**:

#### Option 1: Turbopuffer (AI-Native Vector DB)

**Installation**:
```bash
pnpm add turbopuffer
```

**Implementation**:
```typescript
import { Turbopuffer } from 'turbopuffer';

const tpuf = new Turbopuffer({ apiKey: process.env.TURBOPUFFER_API_KEY });

queryKnowledgeBase: tool({
  description: 'Query internal knowledge base for product info, case studies, pricing',
  parameters: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    const results = await tpuf.query({
      namespace: 'knowledge_base',
      vector: await embedQuery(query), // Use OpenAI embeddings
      topK: 5
    });

    return results.map(r => r.text).join('\n\n');
  }
})
```

#### Option 2: Pinecone (Popular Vector DB)

**Installation**:
```bash
pnpm add @pinecone-database/pinecone
```

**Implementation**:
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('knowledge-base');

queryKnowledgeBase: tool({
  description: 'Query knowledge base',
  parameters: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    const embedding = await getEmbedding(query);
    const results = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true
    });

    return results.matches.map(m => m.metadata.text).join('\n\n');
  }
})
```

---

## Configuration Guide

### Environment Variables

**Required Variables**:

```bash
# Vercel AI Gateway (Required for all AI functionality)
AI_GATEWAY_API_KEY=your_ai_gateway_key_here

# Exa.ai (Required for research agent web search)
EXA_API_KEY=your_exa_api_key_here
```

**Optional Variables** (App works without these):

```bash
# Slack Integration (Optional - app degrades gracefully)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=C123456789

# Email Service (Optional - currently placeholder)
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=sales@yourdomain.com

# CRM Integration (Optional - currently placeholder)
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_USERNAME=your-username
SALESFORCE_PASSWORD=your-password
SALESFORCE_SECURITY_TOKEN=your-token

# Knowledge Base (Optional - currently placeholder)
TURBOPUFFER_API_KEY=your_turbopuffer_key
```

**Getting API Keys**:

1. **AI Gateway**: https://vercel.com/ai/api-keys
2. **Exa.ai**: https://exa.ai/ (sign up, get API key from dashboard)
3. **Slack**: https://api.slack.com/apps (create app, install to workspace)
4. **Resend**: https://resend.com/ (sign up, generate API key)

---

### Tailwind Configuration

**Location**: `/tailwind.config.ts`

**Current Configuration**:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... more color variables
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: []
};

export default config;
```

**Customizing Theme**:

Edit `/app/globals.css`:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
  }
}
```

---

### TypeScript Configuration

**Location**: `/tsconfig.json`

**Current Configuration**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Path Aliases**:
- `@/` maps to project root
- Import example: `import { Button } from '@/components/ui/button'`

---

## Extension Guide

### Adding New Qualification Categories

**Step 1**: Update Zod schema in `/lib/types.ts`

```typescript
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',
  'UNQUALIFIED',
  'SUPPORT',
  'FOLLOW_UP',
  'PARTNER',      // New category
  'INVESTOR',     // New category
  'RECRUITMENT'   // New category
]);
```

**Step 2**: Update qualification prompt in `/lib/services.ts`

```typescript
export async function qualify(data: FormSchema, research: string) {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `
      Categorize this lead:
      - QUALIFIED: Ready for sales
      - UNQUALIFIED: Not a fit
      - SUPPORT: Technical support
      - FOLLOW_UP: Needs nurturing
      - PARTNER: Partnership inquiry
      - INVESTOR: Investment inquiry
      - RECRUITMENT: Job application

      Lead: ${JSON.stringify(data)}
      Research: ${research}
    `
  });

  return object;
}
```

**Step 3**: Update workflow logic if needed

```typescript
// workflows/inbound/index.ts
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  const research = await stepResearch(data);
  const qualification = await stepQualify(data, research);

  // Route to different teams based on category
  if (qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') {
    // Sales flow
    const email = await stepWriteEmail(data, research, qualification);
    await stepHumanFeedback(data, email, qualification);
  } else if (qualification.category === 'SUPPORT') {
    // Support ticket flow
    await createSupportTicket(data, research);
  } else if (qualification.category === 'PARTNER') {
    // Partnership flow
    await notifyPartnershipsTeam(data, research);
  }
  // ... more routing logic
};
```

---

### Adding New Tools to Research Agent

**Step 1**: Define tool in `/lib/services.ts`

```typescript
const competitorAnalysis = tool({
  description: 'Analyze mentions of competitors in company materials',
  parameters: z.object({
    company: z.string().describe('Company name to analyze'),
    competitors: z.array(z.string()).describe('List of competitor names')
  }),
  execute: async ({ company, competitors }) => {
    // Implementation
    const mentions = [];

    for (const competitor of competitors) {
      const results = await exa.searchAndContents(
        `${company} ${competitor}`,
        { category: 'company', numResults: 3 }
      );

      if (results.results.length > 0) {
        mentions.push({
          competitor,
          mentions: results.results.length,
          context: results.results[0].text
        });
      }
    }

    return mentions;
  }
});
```

**Step 2**: Add tool to research agent

```typescript
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis,
    competitorAnalysis  // New tool added here
  },
  stopWhen: [stepCountIs(20)]
});
```

**Step 3**: Update research prompt to leverage new tool

```typescript
export const stepResearch = async (data: FormSchema) => {
  'use step';

  const result = await researchAgent.generate({
    prompt: `
      Research this lead:
      ${JSON.stringify(data)}

      Include:
      1. Company background
      2. Recent news
      3. Tech stack
      4. CRM check
      5. Competitor analysis (compare to: Salesforce, HubSpot, Pipedrive)  // New
    `
  });

  return result.text;
};
```

---

### Creating New Workflows

**Example**: Outbound outreach workflow

**Step 1**: Create new workflow directory

```bash
mkdir -p workflows/outbound
touch workflows/outbound/index.ts
touch workflows/outbound/steps.ts
```

**Step 2**: Define workflow in `workflows/outbound/index.ts`

```typescript
'use client';

import { stepResearchProspect } from './steps';
import { stepGenerateOutreach } from './steps';
import { stepScheduleSend } from './steps';

export const workflowOutbound = async (prospectData: {
  email: string;
  company: string;
  role: string;
}) => {
  'use workflow';

  // Research the prospect
  const research = await stepResearchProspect(prospectData);

  // Generate personalized outreach
  const outreach = await stepGenerateOutreach(prospectData, research);

  // Schedule for optimal send time
  await stepScheduleSend(prospectData.email, outreach);
};
```

**Step 3**: Define steps in `workflows/outbound/steps.ts`

```typescript
import { researchAgent, writeEmail } from '@/lib/services';

export const stepResearchProspect = async (prospectData: {
  email: string;
  company: string;
  role: string;
}) => {
  'use step';

  const result = await researchAgent.generate({
    prompt: `Research this prospect for cold outreach:
      Email: ${prospectData.email}
      Company: ${prospectData.company}
      Role: ${prospectData.role}
    `
  });

  return result.text;
};

export const stepGenerateOutreach = async (
  prospectData: any,
  research: string
) => {
  'use step';

  // Use AI to generate outreach email
  return await writeEmail(prospectData, research, {
    category: 'OUTBOUND',
    reason: 'Cold outreach'
  });
};

export const stepScheduleSend = async (email: string, content: string) => {
  'use step';

  // Schedule email for optimal time
  const optimalTime = calculateOptimalSendTime(email);
  await scheduleEmail(email, content, optimalTime);
};
```

**Step 4**: Create API endpoint to trigger workflow

```typescript
// app/api/outreach/route.ts
import { workflowOutbound } from '@/workflows/outbound';

export async function POST(request: Request) {
  const data = await request.json();

  // Start workflow asynchronously
  workflowOutbound(data);

  return NextResponse.json({ message: 'Outreach scheduled' });
}
```

---

### Customizing Email Templates

**Basic Customization** in `/lib/services.ts`:

```typescript
export async function writeEmail(
  data: FormSchema,
  research: string,
  qualification: QualificationResult
) {
  // Define templates based on qualification
  const templates = {
    QUALIFIED: `
      You are writing to a high-value lead.
      Tone: Enthusiastic and professional
      Include: Specific value propositions, call to action for demo
      Length: 2-3 paragraphs
    `,
    SUPPORT: `
      You are responding to a support request.
      Tone: Helpful and empathetic
      Include: Links to documentation, support ticket creation
      Length: 1-2 paragraphs
    `,
    FOLLOW_UP: `
      You are nurturing a lead that needs more information.
      Tone: Friendly and educational
      Include: Relevant resources, case studies
      Length: 2 paragraphs
    `
  };

  const templateInstructions = templates[qualification.category] || templates.FOLLOW_UP;

  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `
      ${templateInstructions}

      Lead Information:
      Name: ${data.name}
      Company: ${data.company}
      Message: ${data.message}

      Research: ${research}

      Write a personalized email response.
      Sign off as: [Your Name], [Your Title]
    `
  });

  return text;
}
```

**Advanced: Template with Placeholders**:

```typescript
const emailTemplates = {
  QUALIFIED: `
Hi {{name}},

Thank you for your interest in our {{product_name}}! Based on your message about {{inquiry_topic}}, I believe we can help {{company}} achieve {{value_proposition}}.

{{case_study_reference}}

I'd love to schedule a quick 30-minute demo to show you how {{specific_feature}} can {{benefit}}. Are you available {{suggested_times}}?

Looking forward to connecting!

Best regards,
{{sender_name}}
{{sender_title}}
  `
};

export async function writeEmail(
  data: FormSchema,
  research: string,
  qualification: QualificationResult
) {
  // Use AI to fill placeholders
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: z.object({
      product_name: z.string(),
      inquiry_topic: z.string(),
      value_proposition: z.string(),
      case_study_reference: z.string(),
      specific_feature: z.string(),
      benefit: z.string(),
      suggested_times: z.string()
    }),
    prompt: `
      Based on this lead and research, fill in email template placeholders:
      Lead: ${JSON.stringify(data)}
      Research: ${research}
    `
  });

  // Replace placeholders
  let email = emailTemplates[qualification.category];
  email = email.replace('{{name}}', data.name);
  email = email.replace('{{company}}', data.company || 'your organization');

  for (const [key, value] of Object.entries(object)) {
    email = email.replace(`{{${key}}}`, value);
  }

  return email;
}
```

---

## Deployment Guide

### Deploying to Vercel (Recommended)

**One-Click Deploy**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,SLACK_CHANNEL_ID,EXA_API_KEY)

**Manual Deploy**:

1. **Install Vercel CLI**:
```bash
pnpm add -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Link Project**:
```bash
vercel link
```

4. **Set Environment Variables**:
```bash
vercel env add AI_GATEWAY_API_KEY
vercel env add EXA_API_KEY
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET
vercel env add SLACK_CHANNEL_ID
```

5. **Deploy**:
```bash
vercel --prod
```

**Post-Deployment**:

1. **Update Slack Webhook URLs** in `manifest.json`:
```json
{
  "settings": {
    "event_subscriptions": {
      "request_url": "https://your-vercel-domain.vercel.app/api/slack"
    },
    "interactivity": {
      "request_url": "https://your-vercel-domain.vercel.app/api/slack"
    }
  }
}
```

2. **Re-upload manifest to Slack**:
   - Go to https://api.slack.com/apps
   - Select your app
   - Go to "App Manifest"
   - Paste updated manifest
   - Save changes

3. **Test the deployment**:
   - Visit your Vercel URL
   - Submit a test lead
   - Check Vercel logs for workflow execution
   - Verify Slack message appears

---

### Production Checklist

**Before Going Live**:

- [ ] All environment variables configured
- [ ] Slack app installed and webhook URLs updated
- [ ] Email service provider integrated and tested
- [ ] Domain configured (optional, but recommended)
- [ ] Bot protection enabled (BotID)
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Analytics integrated (Google Analytics, Mixpanel, etc.)
- [ ] Rate limiting configured on API routes
- [ ] CORS configured if needed
- [ ] SSL/TLS certificates (automatic on Vercel)
- [ ] Privacy policy and terms of service links added
- [ ] GDPR compliance measures (if applicable)
- [ ] Database for storing email content (if using approval workflow)
- [ ] Backup and disaster recovery plan
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated

**Recommended Production Enhancements**:

1. **Database Integration** for email storage:
```typescript
// Store email content when generating
const email = await stepWriteEmail(data, research, qualification);
await db.emails.create({
  leadEmail: data.email,
  content: email,
  status: 'pending_approval'
});

// Retrieve when approved
slackApp.action('lead_approved', async ({ ack, body }) => {
  await ack();
  const leadEmail = body.actions[0].value;

  const emailRecord = await db.emails.findOne({ leadEmail, status: 'pending_approval' });
  await sendEmail(leadEmail, emailRecord.content);
  await db.emails.update({ leadEmail }, { status: 'sent' });
});
```

2. **Error Tracking** with Sentry:
```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0
});
```

3. **Rate Limiting**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h')
});

// In API route
const { success } = await ratelimit.limit(request.ip);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

---

## Data Models & Schemas

### Location: `/lib/types.ts`

All data models are defined using Zod for runtime validation and TypeScript type inference.

---

### FormSchema

**Purpose**: Lead form data validation

**Definition**:
```typescript
export const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .optional()
    .or(z.literal('')),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500)
});

export type FormSchema = z.infer<typeof formSchema>;
```

**TypeScript Type** (inferred):
```typescript
type FormSchema = {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  message: string;
}
```

**Usage**:
```typescript
// Validation
const result = formSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}

// Type-safe access
const validated: FormSchema = formSchema.parse(data);
console.log(validated.email); // Type-safe
```

---

### QualificationCategorySchema

**Purpose**: Define valid qualification categories

**Definition**:
```typescript
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',
  'UNQUALIFIED',
  'SUPPORT',
  'FOLLOW_UP'
]);

export type QualificationCategory = z.infer<typeof qualificationCategorySchema>;
```

**TypeScript Type**:
```typescript
type QualificationCategory = 'QUALIFIED' | 'UNQUALIFIED' | 'SUPPORT' | 'FOLLOW_UP';
```

---

### QualificationSchema

**Purpose**: AI-generated qualification result

**Definition**:
```typescript
export const qualificationSchema = z.object({
  category: qualificationCategorySchema,
  reason: z.string().describe('Detailed explanation of the qualification decision')
});

export type QualificationResult = z.infer<typeof qualificationSchema>;
```

**TypeScript Type**:
```typescript
type QualificationResult = {
  category: 'QUALIFIED' | 'UNQUALIFIED' | 'SUPPORT' | 'FOLLOW_UP';
  reason: string;
}
```

**Example**:
```typescript
{
  category: 'QUALIFIED',
  reason: 'Lead is from a Series B company with 150 employees, demonstrating strong product-market fit. Their inquiry specifically mentions scaling challenges that our enterprise plan addresses. Recent funding round indicates budget availability.'
}
```

---

## Security & Bot Protection

### BotID Integration

**Purpose**: Prevent automated form submissions and spam

**How It Works**:
1. Client-side fingerprinting collects device signals
2. Signals sent with form submission
3. Server-side verification checks if request is from bot
4. Legitimate requests allowed, bot requests blocked

**Client-Side Setup** (`/instrumentation-client.ts`):
```typescript
import { protect } from 'botid';

export async function register() {
  await protect([
    {
      path: '/api/submit',
      method: 'POST'
    }
  ]);
}
```

**Server-Side Verification** (`/app/api/submit/route.ts`):
```typescript
import { isBotRequest } from 'botid/server';

export async function POST(request: Request) {
  if (isBotRequest(request)) {
    return NextResponse.json(
      { error: 'Bot detected' },
      { status: 403 }
    );
  }

  // Process legitimate request
}
```

**Signals Collected**:
- Browser fingerprint
- Mouse movement patterns
- Keystroke dynamics
- Screen resolution
- Timezone
- WebGL fingerprint
- Canvas fingerprint

**Privacy**: BotID uses privacy-preserving techniques and doesn't track users across sites.

---

### Additional Security Measures

#### 1. Input Validation
```typescript
// All inputs validated with Zod schemas
const data = formSchema.parse(body); // Throws on invalid data
```

#### 2. Rate Limiting (Recommended)
```typescript
// Add with Upstash Redis
const { success } = await ratelimit.limit(request.ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

#### 3. CORS Configuration
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' }
        ]
      }
    ];
  }
};
```

#### 4. Environment Variable Security
- Never commit `.env.local` to git
- Use Vercel's encrypted environment variables
- Rotate API keys regularly
- Use different keys for development/production

#### 5. Slack Signature Verification
```typescript
// Automatic in @vercel/slack-bolt
// Verifies all Slack requests are authentic
```

---

## Troubleshooting

### Common Issues

#### 1. "Bot detected" on Form Submission

**Cause**: BotID fingerprinting failed or not initialized

**Solutions**:
- Ensure `instrumentation-client.ts` is present
- Check browser console for BotID errors
- Verify Next.js instrumentation is enabled
- Try in different browser (some privacy tools interfere)

#### 2. Workflow Not Starting

**Symptoms**: Form submits successfully but no workflow execution

**Debugging**:
```typescript
// Add logging in /app/api/submit/route.ts
console.log('Starting workflow for:', data.email);
workflowInbound(data);
console.log('Workflow started');

// Check Vercel logs
vercel logs
```

**Common Causes**:
- Missing environment variables
- Workflow DevKit not configured correctly
- Not deployed to Vercel (required for workflows)

#### 3. Slack Messages Not Appearing

**Symptoms**: No errors but messages don't appear in Slack

**Check**:
```typescript
// 1. Verify Slack credentials
console.log('Slack configured:', !!slackApp);
console.log('Channel ID:', process.env.SLACK_CHANNEL_ID);

// 2. Check Slack app permissions
// - chat:write
// - app_mentions:read

// 3. Verify bot is in channel
// Add bot to channel: /invite @Lead Agent

// 4. Check Slack API errors
try {
  await slackApp.client.chat.postMessage({...});
} catch (error) {
  console.error('Slack error:', error.data);
}
```

#### 4. AI Generation Errors

**Symptoms**: "Model not available" or API errors

**Debugging**:
```typescript
// Check AI Gateway configuration
console.log('AI Gateway key present:', !!process.env.AI_GATEWAY_API_KEY);

// Try simpler model first
const { object } = await generateObject({
  model: 'openai/gpt-4o',  // Instead of gpt-5
  schema: qualificationSchema,
  prompt: '...'
});
```

**Common Causes**:
- Invalid AI Gateway API key
- Model quota exceeded
- Network/API timeout

#### 5. Research Agent Timeout

**Symptoms**: stepResearch fails or takes too long

**Solutions**:
```typescript
// Reduce max steps
const researchAgent = new Agent({
  model: 'openai/gpt-5',
  tools: { ... },
  stopWhen: [stepCountIs(10)]  // Reduced from 20
});

// Or reduce tool complexity
// Disable expensive tools temporarily
const researchAgent = new Agent({
  model: 'openai/gpt-5',
  tools: {
    search,
    // queryKnowledgeBase,  // Disabled
    // techStackAnalysis,   // Disabled
  },
  stopWhen: [stepCountIs(20)]
});
```

#### 6. Email Not Sending

**Symptoms**: Approval clicked but email not delivered

**Debugging**:
```typescript
// Add detailed logging in sendEmail()
export async function sendEmail(to: string, content: string) {
  console.log(`📧 Attempting to send email to: ${to}`);
  console.log(`Content length: ${content.length} chars`);

  try {
    // Your email service code
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
}
```

**Common Causes**:
- Email service not integrated (placeholder function)
- Invalid API credentials
- Email content not stored in database
- Webhook handler not retrieving content correctly

---

### Debug Mode

**Enable Verbose Logging**:

```typescript
// lib/services.ts
const DEBUG = process.env.DEBUG === 'true';

export async function qualify(data: FormSchema, research: string) {
  if (DEBUG) {
    console.log('=== QUALIFICATION DEBUG ===');
    console.log('Input data:', JSON.stringify(data, null, 2));
    console.log('Research length:', research.length);
  }

  const { object } = await generateObject({...});

  if (DEBUG) {
    console.log('Qualification result:', object);
  }

  return object;
}
```

**Environment Variable**:
```bash
# .env.local
DEBUG=true
```

---

### Performance Monitoring

**Add Timing Logs**:

```typescript
// workflows/inbound/steps.ts
export const stepResearch = async (data: FormSchema) => {
  'use step';

  const startTime = Date.now();
  console.log('🔍 Starting research...');

  const result = await researchAgent.generate({...});

  const duration = Date.now() - startTime;
  console.log(`✅ Research completed in ${duration}ms`);

  return result.text;
};
```

**Expected Durations**:
- `stepResearch`: 30-300 seconds (depends on tool usage)
- `stepQualify`: 5-15 seconds
- `stepWriteEmail`: 5-15 seconds
- `stepHumanFeedback`: <1 second (message send)

---

### Getting Help

**Resources**:
- [Next.js Documentation](https://nextjs.org/docs)
- [AI SDK Documentation](https://ai-sdk.dev)
- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Slack Bolt Documentation](https://slack.dev/bolt-js)
- [Vercel Support](https://vercel.com/support)

**Community**:
- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [AI SDK GitHub](https://github.com/vercel/ai)

---

## Conclusion

This documentation covers the complete Lead Agent system. Use it as a reference for:
- Understanding the architecture
- Customizing for your needs
- Extending with new features
- Troubleshooting issues
- Deploying to production

**Next Steps**:
1. Clone the repository
2. Set up environment variables
3. Run locally and test
4. Customize qualification categories and prompts
5. Integrate with your CRM and email provider
6. Deploy to Vercel
7. Monitor and iterate

**Remember**: This is a reference architecture meant to be adapted. Feel free to modify any part of the system to fit your specific requirements.

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**License**: MIT
