import { apolloEnrichRequestSchema } from "@/lib/types";
import { apollo } from "@/lib/apollo";
import { phoneEnrichmentStore } from "@/lib/phone-enrichment-store";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const parsedBody = apolloEnrichRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.message },
        { status: 400 }
      );
    }

    const { companies, limit, includePhones } = parsedBody.data;

    // Check if API key is configured
    if (!process.env.APOLLO_API_KEY) {
      return NextResponse.json(
        { error: "Apollo API key not configured" },
        { status: 500 }
      );
    }

    // Process companies sequentially with rate limiting
    const results = [];

    console.log(`\n🚀 Starting Apollo enrichment for ${Math.min(companies.length, limit)} companies...`);

    for (let i = 0; i < Math.min(companies.length, limit); i++) {
      const company = companies[i];
      const domain = extractDomain(company.url);

      console.log(`\n[${i + 1}/${Math.min(companies.length, limit)}] Processing: ${company.title}`);
      console.log(`URL: ${company.url}`);
      console.log(`Extracted domain: ${domain}`);

      if (!domain) {
        console.log(`❌ Invalid domain for ${company.title}`);
        results.push({
          company: company.title,
          url: company.url,
          contacts: [],
          error: "Invalid URL - could not extract domain",
        });
        continue;
      }

      try {
        // Step 1: Search for people by domain to get Apollo IDs
        console.log(`🔍 Searching Apollo for domain: ${domain}`);
        const contacts = await apollo.searchPeople(domain);

        let enrichedContacts = contacts;

        // Step 2: If contacts found, enrich them to get emails and phone numbers
        if (contacts.length > 0) {
          console.log(`📧 Enriching ${contacts.length} contacts to get emails & phones...`);

          try {
            // Batch contacts into groups of 10 (API limit)
            const batches = [];
            for (let j = 0; j < contacts.length; j += 10) {
              batches.push(contacts.slice(j, j + 10));
            }

            // Enrich each batch
            const allEnrichedContacts = [];
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex];
              const peopleToEnrich = batch.map((c) => ({
                id: c.id,
                first_name: c.first_name,
                last_name: c.last_name,
              }));

              const enriched = await apollo.bulkEnrichPeople(peopleToEnrich);
              allEnrichedContacts.push(...enriched);

              // Add delay between batches to avoid rate limiting
              if (batchIndex < batches.length - 1) {
                console.log(`⏳ Waiting 500ms before next batch...`);
                await delay(500);
              }
            }

            enrichedContacts = allEnrichedContacts;
            console.log(`✅ Enriched ${enrichedContacts.length} contacts with full details`);
          } catch (enrichError) {
            console.error(`⚠️ Enrichment failed, returning basic contact info:`, enrichError);
            // Continue with non-enriched contacts if enrichment fails
          }
        }

        // Transform to our schema format
        const transformedContacts = enrichedContacts.map((contact) => ({
          name: contact.name,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          title: contact.title || undefined,
          linkedin_url: contact.linkedin_url || undefined,
          organization_name: contact.organization_name || undefined,
        }));

        console.log(`✅ Found ${transformedContacts.length} contacts for ${company.title}`);

        // Step 3: If phone enrichment is requested and we have contacts, trigger webhook
        let phoneJobId: string | undefined;
        if (includePhones && enrichedContacts.length > 0) {
          try {
            // Generate job ID
            phoneJobId = randomUUID();

            // Build webhook URL
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const webhookUrl = `${baseUrl}/api/apollo-webhook?jobId=${phoneJobId}`;

            console.log(`📱 Initiating phone enrichment for ${enrichedContacts.length} contacts...`);
            console.log(`Webhook URL: ${webhookUrl}`);

            // Create job in store
            phoneEnrichmentStore.createJob(
              phoneJobId,
              company.url,
              company.title,
              enrichedContacts.map(c => c.id)
            );

            // Trigger async phone enrichment
            const peopleToEnrich = enrichedContacts.map((c) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
            }));

            await apollo.bulkEnrichPhonesWithWebhook(peopleToEnrich, webhookUrl);

            console.log(`✅ Phone enrichment job ${phoneJobId} created`);
          } catch (phoneError) {
            console.error(`⚠️ Phone enrichment failed:`, phoneError);
            // Continue without phone enrichment - don't block the response
          }
        }

        results.push({
          company: company.title,
          url: company.url,
          contacts: transformedContacts,
          phoneJobId, // Include job ID if phone enrichment was triggered
        });

        // Add delay between companies to avoid rate limiting (500ms)
        if (i < Math.min(companies.length, limit) - 1) {
          console.log(`⏳ Waiting 500ms before next company...`);
          await delay(500);
        }
      } catch (error) {
        console.error(`❌ Error enriching ${company.title}:`, error);
        results.push({
          company: company.title,
          url: company.url,
          contacts: [],
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch contacts",
        });
      }
    }

    console.log(`\n✨ Enrichment complete! Total companies processed: ${results.length}`);
    console.log(`Companies with contacts: ${results.filter(r => r.contacts.length > 0).length}`);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Apollo enrichment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enrichment failed" },
      { status: 500 }
    );
  }
}
