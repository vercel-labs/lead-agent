interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  linkedin_url: string | null;
  organization_name: string | null;
  has_email?: boolean;
  has_direct_phone?: boolean;
}

interface ApolloSearchResponse {
  people: ApolloContact[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export class ApolloClient {
  private apiKey: string;
  private baseUrl = "https://api.apollo.io/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPeople(companyDomain: string): Promise<ApolloContact[]> {
    // Build query parameters - Apollo expects params in URL, not body
    const params = new URLSearchParams({
      "q_organization_domains_list[]": companyDomain,
      per_page: "10",
      "contact_email_status[]": "verified",
    });

    // Add title filters for executives and technical roles
    const titles = [
      "CTO",
      "VP",
      "Chief",
      "Head of Engineering",
      "Director",
      "CEO",
    ];
    titles.forEach((title) => {
      params.append("person_titles[]", title);
    });

    const url = `${this.baseUrl}/mixed_people/api_search?${params.toString()}`;

    console.log("\n=== Apollo API Request ===");
    console.log("Domain:", companyDomain);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({}), // Empty body - params are in URL
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Apollo API Error Response:", errorText);
        throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
      }

      const data: ApolloSearchResponse = await response.json();
      console.log("Apollo API Success!");
      console.log("People found:", data.people?.length || 0);

      // Transform response to capture all fields we need
      const contacts: ApolloContact[] = (data.people || []).map(
        (person: any) => ({
          id: person.id,
          first_name: person.first_name || "",
          last_name: person.last_name || "",
          name:
            person.name ||
            `${person.first_name || ""} ${person.last_name || ""}`.trim(),
          email: null, // Will be populated by enrichment
          phone: null, // Will be populated by enrichment
          title: person.title || null,
          linkedin_url: person.linkedin_url || null,
          organization_name:
            person.organization_name || person.organization?.name || null,
          has_email: person.has_email || false,
          has_direct_phone: person.has_direct_phone || false,
        }),
      );

      if (contacts.length > 0) {
        console.log("First contact sample:", {
          id: contacts[0].id,
          name: contacts[0].name,
          title: contacts[0].title,
          has_email: contacts[0].has_email,
          has_direct_phone: contacts[0].has_direct_phone,
        });
      } else {
        console.log(
          "No contacts found - this might be expected for smaller companies",
        );
      }
      console.log("=== End Apollo API Request ===\n");

      return contacts;
    } catch (error) {
      console.error("Apollo search error:", error);
      throw error;
    }
  }

  async bulkEnrichPeople(
    people: { id: string; first_name: string; last_name: string }[],
  ): Promise<ApolloContact[]> {
    // Build URL with query parameters for reveal flags
    // Note: Only requesting emails - phone requires webhook
    const params = new URLSearchParams({
      reveal_personal_emails: "true",
    });

    const url = `${this.baseUrl}/people/bulk_match?${params.toString()}`;

    // Build details array for bulk enrichment - goes in body
    const details = people.map((person) => ({
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
    }));

    const body = {
      api_key: this.apiKey,
      details: details,
    };

    console.log("\n=== Apollo Bulk Enrichment Request ===");
    console.log("URL:", url);
    console.log("People to enrich:", people.length);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Apollo Enrichment API Error Response:", errorText);
        throw new Error(
          `Apollo enrichment error: ${response.status} - ${errorText}`,
        );
      }

      const data: any = await response.json();
      console.log("Enrichment Success!");
      console.log("Matches found:", data.matches?.length || 0);

      // Parse enriched contacts with full email/phone
      const enrichedContacts: ApolloContact[] = (data.matches || []).map(
        (match: any) => ({
          id: match.id,
          first_name: match.first_name || "",
          last_name: match.last_name || "",
          name: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
          email: match.email || null,
          phone:
            match.phone_numbers?.[0]?.raw_number ||
            match.phone_numbers?.[0]?.sanitized_number ||
            null,
          title: match.title || null,
          linkedin_url: match.linkedin_url || null,
          organization_name:
            match.organization?.name || match.organization_name || null,
        }),
      );

      if (enrichedContacts.length > 0) {
        console.log("First enriched contact:", {
          name: enrichedContacts[0].name,
          email: enrichedContacts[0].email,
          phone: enrichedContacts[0].phone,
          title: enrichedContacts[0].title,
        });
      }
      console.log("=== End Apollo Bulk Enrichment ===\n");

      return enrichedContacts;
    } catch (error) {
      console.error("Apollo enrichment error:", error);
      throw error;
    }
  }

  async bulkEnrichPhonesWithWebhook(
    people: { id: string; first_name: string; last_name: string }[],
    webhookUrl: string,
  ): Promise<void> {
    // Build URL with query parameters for phone reveal and webhook
    const params = new URLSearchParams({
      reveal_phone_number: "true",
      webhook_url: webhookUrl,
    });

    const url = `${this.baseUrl}/people/bulk_match?${params.toString()}`;

    // Build details array for bulk enrichment - goes in body
    const details = people.map((person) => ({
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
    }));

    const body = {
      api_key: this.apiKey,
      details: details,
    };

    console.log("\n=== Apollo Phone Enrichment Request (Webhook) ===");
    console.log("URL:", url);
    console.log("Webhook URL:", webhookUrl);
    console.log("People to enrich:", people.length);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Apollo Phone Enrichment API Error Response:", errorText);
        throw new Error(
          `Apollo phone enrichment error: ${response.status} - ${errorText}`,
        );
      }

      console.log(
        "Phone enrichment request accepted - webhook will be called when ready",
      );
      console.log("=== End Apollo Phone Enrichment Request ===\n");
    } catch (error) {
      console.error("Apollo phone enrichment error:", error);
      throw error;
    }
  }
}

export const apollo = new ApolloClient(process.env.APOLLO_API_KEY || "");
