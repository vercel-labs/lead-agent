# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

An inbound lead qualification and research agent built with [Next.js](http://nextjs.org/), [AI SDK](https://ai-sdk.dev/), and [Slack Bolt](https://slack.dev/bolt-js).

**_This is meant to serve as a reference architecture to be adapted to the needs of your specific organization._**

## Overview

Lead agent app that captures a lead in a contact sales form and then kicks off a qualification workflow and deep research agent. It integrates with Slack to send and receive messages for human-in-the-loop feedback.

- **Immediate Response** - Returns a success response to the user upon submission
- **Background Processing** - Processes leads asynchronously without blocking the user
  - **Deep Research Agent** - Conducts comprehensive research on the lead with a deep research agent
  - **Qualify Lead** - Uses `generateObject` to categorize the lead based on the lead data and research report
  - **Write Email** - Generates a personalized response email
  - **Human-in-the-Loop** - Sends to Slack for human approval before sending
  - **Slack Webhook** - Catches a webhook event from Slack to approve or deny the email

## Deployment

This application can be deployed to any Node.js hosting platform that supports Next.js applications.

## Architecture

<img width="1778" height="1958" alt="architecture" src="https://github.com/user-attachments/assets/53943961-4692-4b42-8e8d-47b03a01d233" />

```
User submits form
     ↓
Background processing starts
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
- **AI**: [AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Human-in-the-Loop**: [Slack Bolt](https://slack.dev/bolt-js)
- **Web Search**: [Exa.ai](https://exa.ai/)

## Using this template

This repo contains various empty functions to serve as placeholders. To fully use this template, fill out empty functions in `lib/services.ts`.

Example: Add a custom implementation of searching your own knowledge base in `queryKnowledgeBase`.

Additionally, update prompts to meet the needs of your specific business function.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret (optional)
  - You can set the permissions and configuration for your Slack app in the `manifest.json` file in the root of this repo
  - Create a Slack app at https://api.slack.com/apps and paste the manifest file
  - **Be sure to update the request URL for interactivity and event subscriptions to your domain URL**
  - If Slack environment variables are not set, the app will still run with the Slack bot disabled
- [AI Gateway API Key](https://vercel.com/ai-gateway) or OpenAI API key
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
│   │   ├── submit/       # Form submission endpoint that starts background processing
│   │   └── slack/        # Slack webhook handler (receives slack events)
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   ├── slack.ts          # Slack integration
│   └── types.ts          # TypeScript schemas and types
├── components/
│   ├── lead-form.tsx     # Main form component
└── workflows/
    └── inbound/          # Inbound lead processing
        ├── index.ts      # Main processing function
        └── steps.ts      # Individual processing steps
```

## Key Features

### Asynchronous Background Processing

This project processes lead submissions asynchronously in the background, allowing for immediate user feedback while performing complex AI operations.

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
- Add new processing steps in `workflows/inbound/steps.ts`
- Create new processing flows for other qualification flows, outbound outreach, etc.

## License

MIT
