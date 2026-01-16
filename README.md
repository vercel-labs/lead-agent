# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

An inbound lead qualification and research agent built with [Next.js](http://nextjs.org/), [AI SDK](https://ai-sdk.dev/), [Workflow DevKit](https://useworkflow.dev/), and the [Vercel Slack Adapter](https://github.com/vercel-labs/slack-bolt). Hosted on the [Vercel AI Cloud](https://vercel.com/blog/the-ai-cloud-a-unified-platform-for-ai-workloads).

**_This is meant to serve as a reference architecture to be adapted to the needs of your specific organization._**

## Overview

Lead agent app that captures a lead in a contact sales form and then kicks off a qualification workflow and deep research agent. It integrates with Slack to send and receive messages for human-in-the-loop feedback.

- **Immediate Response** - Returns a success response to the user upon submission
- **Workflows** - Uses Workflow DevKit to kick off durable background tasks
  - **Deep Research Agent** - Conducts comprehensive research on the lead with a deep research agent
  - **Qualify Lead** - Uses `generateObject` to categorize the lead based on the lead data and research report
  - **Write Email** - Generates a personalized response email
  - **Human-in-the-Loop** - Sends to Slack for human approval before sending
  - **Slack Webhook** - Catches a webhook event from Slack to approve or deny the email

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,SLACK_CHANNEL_ID,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)

## Architecture

<img width="1778" height="1958" alt="architecture" src="https://github.com/user-attachments/assets/53943961-4692-4b42-8e8d-47b03a01d233" />

```
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
Slack approval (human-in-the-loop) ← (Slack integration)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Durable execution**: [Workflow DevKit](http://useworkflow.dev/)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Human-in-the-Loop**: [Slack Bolt + Vercel Slack Bolt adapter](https://vercel.com/templates/ai/slack-agent-template)
- **Web Search**: [Exa.ai](https://exa.ai/)

## Slack Integration

This repo uses [Slack's Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/) with the [Vercel Slack Bolt adapter](https://vercel.com/changelog/build-slack-agents-with-vercel-slack-bolt).

Slack's Bolt is the recommended way to build Slack apps with the latest platform features. While Bolt was designed for traditional long-running Node servers, Vercel's `@vercel/slack-bolt` adapter allows use of it in a serverless environment. Combining Slack's Bolt with Vercel's adapter reduces complexity and makes it easy to subscribe to Slack events and perform actions in your app.

## Using this template

This repo contains various empty functions to serve as placeholders. To fully use this template, fill out empty functions in `lib/services.ts`.

Example: Add a custom implementation of searching your own knowledge base in `queryKnowledgeBase`.

Additionally, update prompts to meet the needs of your specific business function.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret
  - Reference the [Vercel Slack agent template docs](https://github.com/vercel-partner-solutions/slack-agent-template) for creating a Slack app
  - You can set the permissions and configuration for your Slack app in the `manifest.json` file in the root of this repo. Paste this manifest file into the Slack dashboard when creating the app
  - **Be sure to update the request URL for interactivity and event subscriptions to be your production domain URL**
  - If Slack environment variables are not set, the app will still run with the Slack bot disabled
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

- **`slack`** - Use Slack for approval (default if Slack credentials are set)
- **`terminal`** - Use interactive CLI for approval (great for development and testing)
- **`none`** - Skip approval step entirely

```bash
# In .env.local
APPROVAL_MODE=terminal
```

The system automatically detects the approval mode:

- If Slack credentials are set and `APPROVAL_MODE` is not specified, defaults to Slack
- If `APPROVAL_MODE=terminal`, uses CLI approval
- If `APPROVAL_MODE=none`, skips the approval step

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

Generated emails are sent to Slack with approve/reject buttons, ensuring human oversight before any outbound communication.

The Slack message is defined with [Slack's Block Kit](https://docs.slack.dev/block-kit/). It can be edited in `lib/slack.ts`.

### Extensible Architecture

- Add new qualification categories in the `qualificationCategorySchema` in `types.ts`
- Adjust the prompts and configuration for all AI calls in `lib/services.ts`
- Alter the agent by tuning parameters in `lib/services.ts`
- Add new service functions if needed in `lib/services.ts`
- Follow [Vercel Workflow docs](https://useworkflow.dev) to add new steps to the workflow
- Create new workflows for other qualification flows, outbound outreach, etc.

## License

MIT
