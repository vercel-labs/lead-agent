# Lead Agent

An inbound lead qualification and research agent built with Next.js and hosted on the Vercel AI Cloud.

## Overview

Lead agent app that captures a lead in a contact sales form and then kicks off a qualification workflow & agent.

**Overall this template is a reference architecture for how to build a lead agent on Vercel. Aspects of this project should be adjusted to meet your business' needs.**

1. **Immediate Response** - Returns a success response to the user upon submission
2. **Background Processing** - Uses Next.js `after()` to kick off asynchronous tasks:
   - **Qualify Lead** - Uses `generateObject` to categorize the lead
   - **Query Knowledge Base** - Retrieves relevant context from your knowledge base
   - **Deep Research** - Conducts comprehensive research on the lead with a deep research agent
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
Research agent
     ↓
Generate email
     ↓
Slack approval (human-in-the-loop)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: Next.js App Router
- **AI**: Vercel AI SDK with AI Gateway
- **Human-in-the-Loop**: Slack Bolt + Vercel Slack Bolt adapter
- **Deep Research** Exa.ai
- **Form Management**: React Hook Form + Zod validation & shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret
  - Reference the [Vercel slack agent template](https://github.com/vercel-partner-solutions/slack-agent-template) for creating a slack app
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
cp .env.example .env.local
```

Configure the following variables:

```env
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY

# Slack Bot
SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET
SLACK_CHANNEL_ID

# Exa API Key
EXA_API_KEY
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
└── components/ui/        # shadcn/ui
```

## Key Features

### Async Processing with `after()`

The `/api/submit` endpoint leverages Next.js' `after()` function to return an immediate response while processing the lead in the background. This ensures a snappy user experience while complex AI operations happen asynchronously. **In a production environment, we recommend using a queue or durable execution workflow for this instead.**

### AI-Powered Qualification

Leads are automatically categorized (QUALIFIED, FOLLOW_UP, etc.) using GPT-5, with reasoning provided for each qualification decision.

### AI SDK Agent class

Uses the AI SDK Agent class to create an autonomous research agent.

### Human-in-the-Loop Workflow

Generated emails are sent to Slack with approve/reject buttons, ensuring human oversight before any outbound communication.

### Extensible Architecture

- Add new qualification categories in the `qualificationCategorySchema` in `types.ts`
- Adjust the prompts and configuration for all AI calls
- Add new service functions if needed

## Customization

Most of the logic lives in the `services.ts` and `api/submit/route.ts` files.

### Adjusting agent

Edit the `researchAgent` in `lib/services.ts`.

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
