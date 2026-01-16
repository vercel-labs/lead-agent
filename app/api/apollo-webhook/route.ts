import { phoneEnrichmentStore } from "@/lib/phone-enrichment-store";
import { ApolloContact } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extract jobId from query parameters
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      console.error("Webhook received without jobId");
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    console.log(`\n=== Apollo Webhook Received ===`);
    console.log(`Job ID: ${jobId}`);

    // Parse Apollo's webhook payload
    const data: any = await request.json();

    console.log(`Matches in payload: ${data.matches?.length || 0}`);

    // Transform Apollo matches to ApolloContact format
    const enrichedContacts: ApolloContact[] = (data.matches || []).map(
      (match: any) => ({
        name: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
        email: match.email || undefined,
        phone:
          match.phone_numbers?.[0]?.raw_number ||
          match.phone_numbers?.[0]?.sanitized_number ||
          undefined,
        title: match.title || undefined,
        linkedin_url: match.linkedin_url || undefined,
        organization_name:
          match.organization?.name || match.organization_name || undefined,
      })
    );

    // Count how many contacts have phone numbers
    const phonesFound = enrichedContacts.filter((c) => c.phone).length;
    console.log(`Phone numbers found: ${phonesFound}/${enrichedContacts.length}`);

    // Update job in store
    phoneEnrichmentStore.updateJob(jobId, enrichedContacts);

    console.log(`=== Webhook Processing Complete ===\n`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
