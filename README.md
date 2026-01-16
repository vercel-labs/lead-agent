# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

An inbound lead qualification and research agent built with [Next.js](http://nextjs.org/), [AI SDK](https://ai-sdk.dev/), and [Workflow DevKit](https://useworkflow.dev/). Hosted on the [Vercel AI Cloud](https://vercel.com/blog/the-ai-cloud-a-unified-platform-for-ai-workloads).

## Overview

App that takes user prompt to search for companies using the Exa API. Company data is enriched with the Apollo API. This can be adjusted for the number of relevant companies required.

This is deployed with Vercel, and adapted from their lead-agent repository. (It's forked!)

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)


## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- [Vercel AI Gateway API Key](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dai_gateway_landing_page&title=Get+an+API+Key)
- [Exa API key](https://exa.ai/)
- [Apollo API key]

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

#Apollo API key
APOLLO_API_KEY
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application and submit a test lead.


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
