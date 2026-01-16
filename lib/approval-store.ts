import { ApprovalRequest } from './types';
import fs from 'fs/promises';
import path from 'path';

// In-memory store for approval requests
const approvalStore = new Map<string, ApprovalRequest>();

// File path for persistence (development only)
const STORE_FILE = path.join(process.cwd(), '.approvals.json');

export const approvalStoreService = {
  /**
   * Create new approval request
   */
  async create(request: ApprovalRequest): Promise<void> {
    approvalStore.set(request.id, request);
    await this.persist();
  },

  /**
   * Get approval request by ID
   */
  async get(id: string): Promise<ApprovalRequest | undefined> {
    return approvalStore.get(id);
  },

  /**
   * Update approval status
   */
  async update(
    id: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ): Promise<void> {
    const request = approvalStore.get(id);
    if (request) {
      request.status = status;
      approvalStore.set(id, request);
      await this.persist();
    }
  },

  /**
   * Get pending approvals
   */
  async getPending(): Promise<ApprovalRequest[]> {
    return Array.from(approvalStore.values()).filter(
      (r) => r.status === 'pending'
    );
  },

  /**
   * Wait for approval (polling)
   */
  async waitForApproval(
    id: string,
    timeoutMs = 300000
  ): Promise<'approved' | 'rejected'> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const request = await this.get(id);
      if (request && request.status !== 'pending') {
        return request.status;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
    }
    throw new Error('Approval timeout');
  },

  /**
   * Persist to file (development only)
   */
  async persist(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      try {
        const data = Object.fromEntries(approvalStore.entries());
        await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2));
      } catch (error) {
        // Ignore write errors in development
      }
    }
  },

  /**
   * Load from file (development only)
   */
  async load(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      try {
        const data = await fs.readFile(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        for (const [id, request] of Object.entries(parsed)) {
          approvalStore.set(id, request as ApprovalRequest);
        }
      } catch (error) {
        // File doesn't exist yet
      }
    }
  }
};
