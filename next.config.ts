import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';
import { withWorkflow } from '@vercel/workflow/next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@slack/bolt']
};

export default withWorkflow(withBotId(nextConfig));
