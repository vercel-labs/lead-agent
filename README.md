# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

An inbound lead qualification and research agent built with [Next.js](http://nextjs.org/), [AI SDK](https://ai-sdk.dev/), and [Workflow DevKit](https://useworkflow.dev/). Hosted on the [Vercel AI Cloud](https://vercel.com/blog/the-ai-cloud-a-unified-platform-for-ai-workloads).

**_This is meant to serve as a reference architecture to be adapted to the needs of your specific organization._**

## Overview

Lead agent app that captures a lead in a contact sales form and then kicks off a qualification workflow and deep research agent.

- **Immediate Response** - Returns a success response to the user upon submission
- **Workflows** - Uses Workflow DevKit to kick off durable background tasks
  - **Deep Research Agent** - Conducts comprehensive research on the lead with a deep research agent
  - **Qualify Lead** - Uses `generateObject` to categorize the lead based on the lead data and research report
  - **Write Email** - Generates a personalized response email
  - **Human-in-the-Loop** - Terminal-based approval before sending

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)

## Architecture

<img width="1778" height="1958" alt="architecture" src="https://github.com/user-attachments/assets/53943961-4692-4b42-8e8d-47b03a01d233" />

```text
User submits form
     ↓
start(workflow) ← (Workflow DevKit)
     ↓
Research agent ← (AI SDK Agent)
     ↓
Qualify lead ← (AI SDK generateObject)
     ↓
Generate email ← (AI SDK generateText)
     ↓
Terminal approval (human-in-the-loop)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Durable execution**: [Workflow DevKit](http://useworkflow.dev/)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Human-in-the-Loop**: Terminal-based approval
- **Web Search**: [Exa.ai](https://exa.ai/)

## Using this template

This repo contains various empty functions to serve as placeholders. To fully use this template, fill out empty functions in `lib/services.ts`.

Example: Add a custom implementation of searching your own knowledge base in `queryKnowledgeBase`.

Additionally, update prompts to meet the needs of your specific business function.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
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

# Exa API Key
EXA_API_KEY
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application and submit a test lead.

## CLI Usage

### Terminal-Based Approval Workflow

Run the interactive CLI to submit leads and approve emails directly in your terminal:

```bash
npm run cli
```

The CLI will:

1. Prompt you for lead information (name, email, company, message)
2. Run the research agent (displays AI research results)
3. Run qualification (displays category and reasoning)
4. Generate email (displays the AI-generated email)
5. Prompt you to approve or reject the email
6. Log the decision (no actual email sending in this mode)

**Requirements:**

- `AI_GATEWAY_API_KEY` - Required for AI SDK calls
- `EXA_API_KEY` - Required for web research
- No Next.js server needed - runs standalone!

Set these in your `.env` or `.env.local` file:

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### Approval Modes

Configure via `APPROVAL_MODE` environment variable to control how approvals are handled:

- **`terminal`** - Use interactive CLI for approval (default)
- **`none`** - Skip approval step entirely

```bash
# In .env.local
APPROVAL_MODE=terminal
```

## Project Structure

```text
lead-agent/
├── app/
│   ├── api/
│   │   └── submit/       # Form submission endpoint that kicks off workflow
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   └── types.ts          # TypeScript schemas and types
├── components/
│   ├── lead-form.tsx     # Main form component
└── workflows/
    └── inbound/          # Inbound lead workflow
        ├── index.ts      # Exported workflow function
        └── steps.ts      # Workflow steps
```

## Key Features

### Workflow durable execution with `use workflow`

This project uses [Workflow DevKit](https://useworkflow.dev) to kick off a workflow that runs the agent, qualification, and other actions.

### AI-Powered Qualification

Leads are automatically categorized (QUALIFIED, FOLLOW_UP, SUPPORT, etc.) using the latest OpenAI model via the Vercel AI SDK and `generateObject`. Reasoning is also provided for each qualification decision. Edit the qualification categories by changing the `qualificationCategorySchema` in `lib/types.ts`.

### AI SDK Agent class

Uses the [AI SDK Agent class](https://ai-sdk.dev/docs/agents/overview) to create an autonomous research agent. Create new tools for the Agent and edit prompts in `lib/services.ts`.

### Human-in-the-Loop Workflow

Generated emails are presented in the terminal for approval, ensuring human oversight before any outbound communication.

### Extensible Architecture

- Add new qualification categories in the `qualificationCategorySchema` in `types.ts`
- Adjust the prompts and configuration for all AI calls in `lib/services.ts`
- Alter the agent by tuning parameters in `lib/services.ts`
- Add new service functions if needed in `lib/services.ts`
- Follow [Vercel Workflow docs](https://useworkflow.dev) to add new steps to the workflow
- Create new workflows for other qualification flows, outbound outreach, etc.

## License

MIT
