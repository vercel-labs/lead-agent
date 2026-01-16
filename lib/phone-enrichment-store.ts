import { ApolloContact } from "./types";

interface PhoneEnrichmentJob {
  jobId: string;
  companyUrl: string;
  companyName: string;
  contactIds: string[]; // Apollo person IDs being enriched
  status: "pending" | "completed" | "failed";
  enrichedContacts: ApolloContact[];
  createdAt: number;
  completedAt?: number;
  error?: string;
}

class PhoneEnrichmentStore {
  private jobs: Map<string, PhoneEnrichmentJob> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start automatic cleanup every 10 minutes
    this.startAutoCleanup();
  }

  createJob(
    jobId: string,
    companyUrl: string,
    companyName: string,
    contactIds: string[]
  ): void {
    const job: PhoneEnrichmentJob = {
      jobId,
      companyUrl,
      companyName,
      contactIds,
      status: "pending",
      enrichedContacts: [],
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    console.log(`Created phone enrichment job ${jobId} for ${companyName}`);
  }

  updateJob(jobId: string, contacts: ApolloContact[]): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found for update`);
      return;
    }

    job.status = "completed";
    job.enrichedContacts = contacts;
    job.completedAt = Date.now();

    this.jobs.set(jobId, job);
    console.log(
      `Updated job ${jobId} with ${contacts.length} enriched contacts`
    );
  }

  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found for failure update`);
      return;
    }

    job.status = "failed";
    job.error = error;
    job.completedAt = Date.now();

    this.jobs.set(jobId, job);
    console.error(`Job ${jobId} failed: ${error}`);
  }

  getJob(jobId: string): PhoneEnrichmentJob | undefined {
    return this.jobs.get(jobId);
  }

  findJobByContactIds(contactIds: string[]): PhoneEnrichmentJob | undefined {
    // Find a job that contains any of the provided contact IDs
    for (const job of this.jobs.values()) {
      const hasMatch = job.contactIds.some((id) => contactIds.includes(id));
      if (hasMatch) {
        return job;
      }
    }
    return undefined;
  }

  cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour in milliseconds
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < oneHourAgo) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old phone enrichment jobs`);
    }
  }

  private startAutoCleanup(): void {
    // Run cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, 10 * 60 * 1000);
  }

  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const phoneEnrichmentStore = new PhoneEnrichmentStore();
