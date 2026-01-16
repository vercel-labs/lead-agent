[9/10] Processing: Trust 100
URL: https://trust100.com/
Extracted domain: trust100.com
🔍 Searching Apollo for domain: trust100.com

=== Apollo API Request ===
URL: https://api.apollo.io/api/v1/mixed_people/api_search?q_organization_domains_list%5B%5D=trust100.com&per_page=10&contact_email_status%5B%5D=verified&person_titles%5B%5D=CTO&person_titles%5B%5D=VP&person_titles%5B%5D=Chief&person_titles%5B%5D=Head+of+Engineering&person_titles%5B%5D=Director&person_titles%5B%5D=CEO
Domain: trust100.com
API Key (first 10 chars): 6W9sL0CD4v...
Response Status: 200
Apollo API Success!
People found: 2
First contact sample: { name: undefined, email: undefined, title: 'CFO' }
=== End Apollo API Request ===

✅ Found 2 contacts for Trust 100
⏳ Waiting 500ms before next request...


here's a sample output from our script. These are finding people, but this endpoint `mixed_people/api_search` DOES NOT return email and phone number. 

## We need to use another API endpoint to get email.

Changes to be made: 

Where this object is defined:
`
      console.log("Apollo API Success!");
      console.log("People found:", data.people?.length || 0);
      if (data.people && data.people.length > 0) {
        console.log("First contact sample:", {
          name: data.people[0].name,
          email: data.people[0].email,
          title: data.people[0].title,
        });
`

We should return `id`, `organization_name`, `has_email`, `first_name`, `last_name_obfuscated`, `has_direct_phone`, `title`, `organization` (nested) `name`

These will be returned from the API call. 

Then use the bulk people enrichment call to query information for multiple people (if contacts found) at each company: 

https://docs.apollo.io/reference/bulk-people-enrichment

note:
Use the Bulk People Enrichment endpoint to enrich data for up to 10 people with a single API call. To enrich data for only 1 person, use the People Enrichment endpoint instead.

Apollo relies on the information you pass via the endpoint's parameters to identify the correct people to enrich. When you provide more information, Apollo is more likely to find matches within its database. If you only provide general information, such as a name without a domain or email address, you might receive a 200 response, but the response will indicate that no records have been enriched. The details for each person should be passed as an object with the details[] array.

By default, this endpoint does not return personal emails or phone numbers. Use the reveal_personal_emails and reveal_phone_number parameters to retrieve emails and phone numbers. If you set either of these parameters to true, Apollo will attempt to provide emails or phone numbers for all matches.

Note there is a webhook parameter you need to specify? I'm not sure what that is. 

OUTPUT: 

After the first API call, use the `id` (apollo id) returned for each person and any identifiable information and use the personal enrichment API to get phone numbers and details. 

Add this information / display it to the user!


    
- 