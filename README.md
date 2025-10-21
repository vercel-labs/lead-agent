# Lead Agent

An inbound lead qualification and research agent built with Next.js and hosted on the Vercel AI Cloud.

**_This is meant to serve as a reference architecture to be adapted to the needs of your specific organization._**

## Overview

Lead agent app that captures a lead in a contact sales form and then kicks off a qualification workflow & deep research agent.

**Overall this template is a reference architecture for how to build a lead agent on Vercel. Aspects of this project should be adjusted to meet your business' needs.**

1. **Immediate Response** - Returns a success response to the user upon submission
2. **Workflows** - Uses Vercel workflows to kick off durable background tasks
   - **Qualify Lead** - Uses `generateObject` to categorize the lead
   - **Deep Research Agent** - Conducts comprehensive research on the lead with a deep research agent
   - **Write Email** - Generates a personalized response email
   - **Human-in-the-Loop** - Sends to Slack for human approval before sending

## Architecture

```
User submits form
     ↓
start(workflow)
     ↓
Research agent
     ↓
Qualify lead
     ↓
Generate email
     ↓
Slack approval (human-in-the-loop)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: [Next.js App Router](https://nextjs.org)
- **Durable execution**: [Vercel Workflows](http://useworkflow.dev/)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Human-in-the-Loop**: [Slack Bolt + Vercel Slack Bolt adapter](https://vercel.com/templates/ai/slack-agent-template)
- **Web Search** [Exa.ai](https://exa.ai/)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret
  - Reference the [Vercel slack agent template](https://github.com/vercel-partner-solutions/slack-agent-template) for creating a slack app
- [Vercel AI Gateway API Key](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dai_gateway_landing_page&title=Get+an+API+Key)
- [Exa API key](https://exa.ai/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/vercel-labs/lead-agent.git
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

```bash
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

5. Open [http://localhost:3000](http://localhost:3000) to see the application and submit a test lead.

## Project Structure

```
lead-agent/
├── app/
│   ├── api/
│   │   ├── submit/       # Form submission endpoint that kicks off workflow
│   │   └── slack/        # Slack webhook handler (receives slack events)
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   ├── slack.ts          # Slack integration
│   └── types.ts          # TypeScript schemas and types
├── components
│   ├── lead-form.tsx     # Main form component
└── workflows/
    └── inbound/          # Inbound lead workflow
        ├── index.ts      # Exported workflow function
        └── steps.ts      # Workflow steps
```

## Key Features

### Workflow durable execution with `use workflow`

This project uses Vercel Workflows to kick off a workflow that runs the agent, qualification, and other actions.

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

## License

MIT
