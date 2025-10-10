# Lead Agent

An intelligent lead qualification and response system built with Next.js 15, leveraging the `after()` function for asynchronous background processing and AI-powered lead analysis.

## Overview

This application captures leads through a web form and automatically processes them through a multi-stage pipeline:

1. **Immediate Response** - Returns a success response to the user instantly
2. **Background Processing** - Uses Next.js `after()` to kick off asynchronous tasks:
   - **Qualify Lead** - AI-powered lead qualification and categorization
   - **Query Knowledge Base** - Retrieves relevant context from your knowledge base
   - **Deep Research** - Conducts comprehensive research on the lead
   - **Write Email** - Generates a personalized response email
   - **Human-in-the-Loop** - Sends to Slack for human approval before sending

## Architecture

```
User submits form
     ↓
Immediate response
     ↓
after() → Qualify lead
     ↓
Query knowledge base
     ↓
Deep research
     ↓
Generate email
     ↓
Slack approval (human-in-the-loop)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: Next.js 15 & App Router
- **AI**: Vercel AI SDK with AI Gateway
- **Human-in-the-Loop**: Slack Bolt + Vercel Slack Bolt adapter
- **Deep Research** Exa.ai
- **Form Management**: React Hook Form + Zod validation & shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret
- Vercel AI Gateway API Key

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd lead-agent
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=your-channel-id
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
lead-agent/
├── app/
│   ├── api/
│   │   ├── submit/       # Form submission endpoint with after()
│   │   └── slack/        # Slack webhook handler
│   ├── lead-form.tsx     # Main form component
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   ├── slack.ts          # Slack integration
│   └── types.ts          # TypeScript schemas and types
└── components/ui/        # Reusable UI components
```

## Key Features

### Async Processing with `after()`

The `/api/submit` endpoint leverages Next.js 15's `after()` function to return an immediate response while processing the lead in the background. This ensures a snappy user experience while complex AI operations happen asynchronously.

### AI-Powered Qualification

Leads are automatically categorized (QUALIFIED, FOLLOW_UP, etc.) using GPT-5, with reasoning provided for each qualification decision.

### Human-in-the-Loop Workflow

Generated emails are sent to Slack with approve/reject buttons, ensuring human oversight before any outbound communication.

### Extensible Architecture

- Easy to add new qualification categories
- Pluggable knowledge base (Turbopuffer, Pinecone, Postgres, etc.)
- Configurable research providers (Exa.ai, etc.)
- Email provider agnostic (SendGrid, Mailgun, Resend, etc.)

## Customization

### Adding Knowledge Base Integration

Edit `lib/services.ts` in the `queryKnowledgeBase` function:

```typescript
export async function queryKnowledgeBase(query: string) {
  // Add your vector DB integration here
  // Example: Turbopuffer, Pinecone, Postgres with pgvector
  return 'Context from knowledge base';
}
```

### Adding Deep Research

Edit `lib/services.ts` in the `deepResearch` function:

```typescript
export async function deepResearch(query: string, context: string) {
  // Add your research provider here
  // Example: Exa.ai, Perplexity, etc.
  return 'Results from research';
}
```

### Adding Email Provider

Edit `lib/services.ts` in the `sendEmail` function:

```typescript
export async function sendEmail(email: string) {
  // Add your email provider here
  // Example: SendGrid, Mailgun, Resend, etc.
}
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

Or deploy manually:

```bash
pnpm build
pnpm start
```

Make sure to set all environment variables in your deployment platform.

## License

MIT
