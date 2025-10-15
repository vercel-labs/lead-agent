import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@slack/bolt']
};

export default withBotId(nextConfig);
