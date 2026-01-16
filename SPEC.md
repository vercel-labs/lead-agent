# Building a Rudimentary Sales Pipeline

We're going to build a rudimentary sales pipeline.

## Phase 1: Exa Company Search Interface ✅ COMPLETED

### Overview
Use Exa to search for companies with trust centers and display results in a user-friendly interface with export capabilities.

### Requirements
1. Use Exa search to find a list of 100 companies that have a trust center
2. Show an editable prompt input box (prefilled with the search query)
3. Add a "Run Search" button to trigger the search
4. Display all search results with comprehensive company information
5. Provide CSV export functionality for the results

### User Flow
1. User visits the local website
2. User sees a prefilled search prompt: "list of 100 companies that have a trust center"
3. User can optionally edit the prompt to customize the search
4. User clicks "Run Search" button
5. Exa API searches for companies and returns up to 100 results
6. Results are displayed on the frontend with all available data
7. User can click "Export to CSV" to download results

## Implementation Details

### Files Modified

#### 1. Type Definitions - [lib/types.ts](lib/types.ts)
**Added Exa search types:**
- `exaSearchRequestSchema` - Validates search query (1-5000 characters, allowing detailed natural language prompts)
- `exaSearchResultSchema` - Defines result structure with fields:
  - `url` (string, required)
  - `title` (string, required)
  - `summary` (string, optional)
  - `text` (string, optional)
  - `highlights` (array of strings, optional)
  - `publishedDate` (string, optional)
  - `author` (string, optional)
  - `score` (number, optional)
- `exaSearchResponseSchema` - Wraps results array
- TypeScript types exported for all schemas

#### 2. API Endpoint - [app/api/exa-search/route.ts](app/api/exa-search/route.ts)
**Created new POST endpoint:**
- Route: `/api/exa-search`
- Validates request body using Zod schema
- Calls `exa.searchAndContents()` with configuration:
  - `numResults: 100` - Returns up to 100 companies
  - `type: 'auto'` - Intelligent search type selection
  - `category: 'company'` - Filters for company results
  - `summary: { query }` - Generates summaries for each result
  - `text: { maxCharacters: 1000 }` - Includes text content (up to 1000 chars)
  - `highlights: { query, numSentences: 3 }` - Extracts 3 relevant sentences
- Returns JSON response with results array
- Error handling with appropriate HTTP status codes (400 for validation, 500 for API errors)

#### 3. Frontend Component - [components/exa-search-form.tsx](components/exa-search-form.tsx)
**Created new React component:**

**State Management:**
- `query` - Search prompt (default: "list of 100 companies that have a trust center")
- `isSearching` - Loading state during API calls
- `results` - Array of search results
- `error` - Error message display

**Search Input Section:**
- Editable `<Textarea>` for search query
- Field label: "Search Query"
- Field description: "Modify the query to search for specific types of companies"
- "Run Search" button (disabled when searching or query is empty)
- Loading state shows "Searching..." text

**Results Display:**
- Header with result count and "Export to CSV" button
- Grid of result cards, each showing:
  - **Company name/title** (bold, large font)
  - **URL** (clickable link, opens in new tab)
  - **Summary** (if available)
  - **Highlights** (bulleted list if available)
  - **Text content** (truncated with line-clamp-3)
  - **Metadata** (author, published date)
  - **Score** (displayed in top-right corner)
- Hover effect with shadow transition
- Empty state message when no results found

**CSV Export Functionality:**
- "Export to CSV" button with Download icon
- `escapeCSVField()` function for proper CSV formatting:
  - Escapes double quotes by doubling them
  - Wraps fields in quotes if they contain commas, newlines, or quotes
  - Handles undefined/null values
- `handleExportCSV()` function:
  - Creates CSV with headers: Title, URL, Summary, Text, Highlights, Author, Published Date, Score
  - Converts all results to CSV rows
  - Joins highlights with " | " separator
  - Generates timestamped filename: `exa-search-results-{timestamp}.csv`
  - Creates blob and triggers browser download
  - Shows success toast notification

**Error Handling:**
- Toast notifications for success/error states
- Inline error display below input field
- Network error recovery

#### 4. Homepage - [app/page.tsx](app/page.tsx)
**Updated main page:**
- Replaced `LeadForm` import with `ExaSearchForm`
- Changed page title from "Lead Agent" to "Exa Company Search"
- Replaced icons from Bot/Workflow to Search/Database (from lucide-react)
- Renders `<ExaSearchForm />` component

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User views page with prefilled query                        │
│    "list of 100 companies that have a trust center"            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User optionally edits prompt                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User clicks "Run Search" button                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend POST { query: "..." } to /api/exa-search           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. API validates request with Zod schema                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. API calls exa.searchAndContents(query, {                    │
│      numResults: 100,                                           │
│      type: 'auto',                                              │
│      category: 'company',                                       │
│      summary: { query },                                        │
│      text: { maxCharacters: 1000 },                             │
│      highlights: { query, numSentences: 3 }                     │
│    })                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Exa returns array of company results                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. API returns { results: [...] }                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Frontend displays results in card layout                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. User views company data (name, URL, summary, etc.)         │
│                                                                 │
│ 11. User clicks "Export to CSV" to download results            │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Requirements
- `EXA_API_KEY` - Must be set in `.env.local` (already configured)
- No other environment variables required for this flow

### Testing Checklist

**Initial Load:**
- ✅ Page displays with title "Exa Company Search"
- ✅ Search query textarea is prefilled with "list of 100 companies that have a trust center"
- ✅ "Run Search" button is enabled

**Search Functionality:**
- ✅ Clicking "Run Search" triggers API call
- ✅ Button shows "Searching..." during API call
- ✅ Button is disabled during search
- ✅ Input is disabled during search
- ✅ Success toast shows "Found X results"
- ✅ Results display with all available data fields

**Edit Query:**
- ✅ User can modify the search prompt
- ✅ Modified query is sent to API
- ✅ Results update based on new query

**Results Display:**
- ✅ Each result card shows: title, URL, summary, highlights, text, author, date, score
- ✅ URLs are clickable and open in new tab
- ✅ Hover effect adds shadow to cards
- ✅ Result count displays correctly
- ✅ Export button appears when results exist

**CSV Export:**
- ✅ "Export to CSV" button is visible
- ✅ Clicking button downloads CSV file
- ✅ Filename format: `exa-search-results-{timestamp}.csv`
- ✅ CSV contains headers: Title, URL, Summary, Text, Highlights, Author, Published Date, Score
- ✅ All data is properly escaped for CSV format
- ✅ Highlights are joined with " | " separator
- ✅ Success toast shows "CSV file downloaded successfully"

**Error Handling:**
- ✅ Empty query shows validation error
- ✅ Network errors display error message
- ✅ API errors show appropriate error toast
- ✅ Inline error appears below input field

**Edge Cases:**
- ✅ Zero results shows empty state message
- ✅ Missing optional fields (summary, highlights, etc.) handled gracefully
- ✅ Long company names/URLs don't break layout
- ✅ Special characters in data are properly escaped in CSV

### Files Not Modified (Legacy)
The following files remain in the codebase but are not used in the new flow:
- [components/lead-form.tsx](components/lead-form.tsx) - Old form component
- [app/api/submit/route.ts](app/api/submit/route.ts) - Old workflow trigger
- [workflows/inbound/index.ts](workflows/inbound/index.ts) - Workflow orchestration
- [workflows/inbound/steps.ts](workflows/inbound/steps.ts) - Research/qualify/email steps

These can be referenced for future features or removed in a cleanup phase.

## Phase 2: Apollo Contact Enrichment ✅ COMPLETED

### Overview
Enrich Exa search results with decision-maker contacts from Apollo.io. For each company found via Exa, find CTOs, VPs, Directors, and other executives with their email addresses.

### Requirements
1. Add "Enrich with Apollo" button to search results
2. Extract company domains from Exa result URLs
3. Use Apollo API to find decision-makers at each company
4. Retrieve contact emails for each person found
5. Display contact information alongside company data
6. Include contacts in CSV export

### Implementation Details

#### Files Created/Modified

**1. Apollo Client - [lib/apollo.ts](lib/apollo.ts)**

Created new `ApolloClient` class with two-step enrichment flow:

**Step 1: Search for People** (`searchPeople()`)
- Endpoint: `/api/v1/mixed_people/api_search`
- Parameters (URL query string):
  - `q_organization_domains_list[]` - Company domain
  - `per_page: "10"` - Limit to 10 contacts per company
  - `contact_email_status[]: "verified"` - Only contacts with verified emails
  - `person_titles[]` - Filter for: CTO, VP, Chief, Head of Engineering, Director, CEO
- Returns: Apollo IDs, names, titles, organization names, flags (`has_email`, `has_direct_phone`)
- Note: Does NOT return actual email addresses, only IDs

**Step 2: Bulk Enrichment** (`bulkEnrichPeople()`)
- Endpoint: `/api/v1/people/bulk_match`
- Parameters:
  - URL query: `reveal_personal_emails: 'true'` (enables email retrieval)
  - Body: `{ api_key, details: [{ id, first_name, last_name }] }`
- Batch limit: 10 people per request
- Returns: Full contact details including email addresses
- Note: Phone numbers require webhook (not implemented - email-only approach)

**Interface:**
```typescript
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
```

**2. Type Definitions - [lib/types.ts](lib/types.ts)**

Added Apollo-specific schemas:
- `apolloContactSchema` - Contact with name, email, phone, title, LinkedIn, organization
- `apolloEnrichRequestSchema` - Request with companies array and limit (1-20)
- `apolloEnrichResponseSchema` - Response with results array (company, URL, contacts, optional error)
- `enrichedExaResultSchema` - Extends Exa result with optional `apolloContacts` array

**3. API Endpoint - [app/api/apollo-enrich/route.ts](app/api/apollo-enrich/route.ts)**

Created POST endpoint: `/api/apollo-enrich`

**Request Format:**
```json
{
  "companies": [
    { "title": "Company Name", "url": "https://company.com" }
  ],
  "limit": 10
}
```

**Processing Flow:**
1. Validate request with Zod schema
2. Check for `APOLLO_API_KEY` environment variable
3. For each company (up to limit):
   - Extract domain from URL using `extractDomain()` helper
   - Call `apollo.searchPeople(domain)` to get Apollo IDs
   - If contacts found:
     - Batch into groups of 10 (API limit)
     - Call `apollo.bulkEnrichPeople()` for each batch
     - Wait 500ms between batches (rate limiting)
   - Transform to response schema
   - Wait 500ms before next company (rate limiting)
4. Return enriched results

**Response Format:**
```json
{
  "results": [
    {
      "company": "Company Name",
      "url": "https://company.com",
      "contacts": [
        {
          "name": "John Doe",
          "email": "john@company.com",
          "phone": null,
          "title": "CTO",
          "linkedin_url": "https://linkedin.com/in/johndoe",
          "organization_name": "Company Name"
        }
      ],
      "error": "optional error message"
    }
  ]
}
```

**Error Handling:**
- Invalid domains → Skip company with error message
- Enrichment failures → Return basic contact info without emails
- API errors → Log and continue with other companies

**4. Frontend Component - [components/exa-search-form.tsx](components/exa-search-form.tsx)**

**New State:**
- `enrichedResults` - Stores results with Apollo contacts
- `isEnriching` - Loading state for Apollo enrichment
- `enrichmentLimit` - Number slider (1-20 companies)

**New UI Elements:**

**Enrichment Controls (after search results):**
- Number slider to select how many companies to enrich (default: 10)
- "Enrich with Apollo" button
- Shows "Enriching X companies..." during processing
- Disabled when no results or already enriching

**Contact Display (in result cards):**
- New "Contacts" section below company info
- Each contact shows:
  - Name (bold)
  - Email (clickable mailto: link)
  - Phone number (clickable tel: link) - if available
  - Job title
  - LinkedIn URL (clickable link, opens in new tab)
- Empty state: "No contacts found" when enrichment returns 0 contacts

**CSV Export Updates:**
- New columns: Contact Names, Contact Emails, Contact Phone Numbers, Contact Titles, Contact LinkedIn URLs
- Multiple contacts joined with " | " separator
- Example: `John Doe | Jane Smith` in Contact Names column
- Handles missing/null values gracefully

**5. Environment Variables - [.env.example](.env.example)**

Added required variable:
```bash
APOLLO_API_KEY=your_apollo_api_key_here
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User searches with Exa and gets company results             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User adjusts enrichment limit slider (1-20 companies)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User clicks "Enrich with Apollo" button                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend POST to /api/apollo-enrich with:                   │
│    { companies: [{ title, url }], limit: 10 }                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. For each company:                                            │
│    a. Extract domain from URL (e.g., "company.com")            │
│    b. POST to Apollo mixed_people/api_search                   │
│       - Filter by domain, titles, verified emails              │
│       - Returns: Apollo IDs, names, titles                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. If contacts found:                                           │
│    a. Batch contacts into groups of 10                         │
│    b. For each batch:                                           │
│       - POST to Apollo people/bulk_match                       │
│       - With reveal_personal_emails=true                       │
│       - Body: { api_key, details: [{ id, first_name, ... }] } │
│       - Returns: Full contact details with emails              │
│       - Wait 500ms before next batch                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Return enriched results:                                     │
│    { results: [{ company, url, contacts: [...] }] }            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Frontend displays contacts in each company card             │
│    - Shows name, email, title, LinkedIn                        │
│    - Updates CSV export to include contact data                │
└─────────────────────────────────────────────────────────────────┘
```

### Apollo API Endpoints Used

**Endpoint 1: People Search**
- URL: `https://api.apollo.io/api/v1/mixed_people/api_search`
- Method: POST
- Auth: `X-Api-Key` header
- Purpose: Find people by company domain
- Returns: Basic info (IDs, names, titles, flags)
- Does NOT return: Actual email addresses or phone numbers

**Endpoint 2: Bulk Enrichment**
- URL: `https://api.apollo.io/api/v1/people/bulk_match`
- Method: POST
- Auth: `x-api-key` header (lowercase!)
- Purpose: Enrich up to 10 people with full contact details
- Query params: `reveal_personal_emails=true` (phone requires webhook)
- Body: `{ api_key, details: [{ id, first_name, last_name }] }`
- Returns: Email addresses, phone numbers, full profiles

### Rate Limiting Strategy

**Between Batches:**
- 500ms delay when enriching multiple batches for single company
- Prevents overwhelming Apollo API with rapid requests

**Between Companies:**
- 500ms delay after processing each company
- Ensures sequential processing with breathing room

**Example Timeline (3 companies, 10 contacts each):**
```
Company 1: Search (1s) → Enrich batch (1s) → Wait 500ms
Company 2: Search (1s) → Enrich batch (1s) → Wait 500ms
Company 3: Search (1s) → Enrich batch (1s)
Total: ~7.5 seconds for 3 companies
```

### Technical Challenges & Solutions

**Challenge 1: API Parameter Format**
- Problem: Apollo requires array parameters in URL like `person_titles[]`
- Solution: Use `URLSearchParams.append()` for array values
- Code:
```typescript
titles.forEach((title) => {
  params.append("person_titles[]", title);
});
```

**Challenge 2: Two-Step Enrichment**
- Problem: Search endpoint doesn't return emails
- Solution: Use search to get IDs, then bulk enrichment to get emails
- Benefit: Can filter by titles in search, then only pay for enrichment

**Challenge 3: Batch Size Limit**
- Problem: Bulk enrichment limited to 10 people per request
- Solution: Batch contacts into groups of 10 and enrich sequentially
- Code:
```typescript
for (let j = 0; j < contacts.length; j += 10) {
  batches.push(contacts.slice(j, j + 10));
}
```

**Challenge 4: Phone Numbers Require Webhooks**
- Problem: `reveal_phone_number=true` requires `webhook_url` parameter
- Apollo processes phone enrichment asynchronously
- Solution: Email-only approach (no phone numbers)
- Future: Could implement webhook system for async phone enrichment

**Challenge 5: Domain Extraction**
- Problem: Exa returns full URLs, Apollo needs domains
- Solution: `extractDomain()` helper using URL API
- Code:
```typescript
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "";
  }
}
```

### Testing Checklist

**Enrichment Flow:**
- ✅ "Enrich with Apollo" button appears after Exa search
- ✅ Enrichment limit slider works (1-20)
- ✅ Button shows "Enriching X companies..." during processing
- ✅ Button disabled during enrichment
- ✅ Success toast shows "Enriched X companies with Apollo contacts"

**Contact Display:**
- ✅ Contacts section appears in company cards
- ✅ Each contact shows: name, email, title, LinkedIn
- ✅ Email links work (mailto:)
- ✅ Phone links work (tel:) - when available
- ✅ LinkedIn URLs open in new tab
- ✅ "No contacts found" shows for companies with 0 results

**CSV Export:**
- ✅ Contact Names column contains all contact names (pipe-separated)
- ✅ Contact Emails column contains all emails (pipe-separated)
- ✅ Contact Phone Numbers column (empty for email-only approach)
- ✅ Contact Titles column contains job titles (pipe-separated)
- ✅ Contact LinkedIn URLs column (pipe-separated)
- ✅ Multiple contacts properly joined with " | " separator
- ✅ Missing values handled gracefully (empty strings)

**Error Handling:**
- ✅ Invalid URLs skip enrichment with error message
- ✅ Companies with no contacts show empty contacts array
- ✅ Enrichment failures fallback to basic contact info
- ✅ Missing APOLLO_API_KEY returns 500 error
- ✅ Network errors display error toast

**Edge Cases:**
- ✅ Small companies with 0 contacts handled gracefully
- ✅ Companies with >10 contacts properly batched
- ✅ Rate limiting prevents API throttling
- ✅ Concurrent enrichment requests prevented by disabled button

### Environment Requirements
- `APOLLO_API_KEY` - Required for Apollo.io API access
- `EXA_API_KEY` - Required for Exa search (from Phase 1)

### Architecture Decisions

**Why Two-Step Enrichment?**
- Search endpoint allows filtering by titles (CTOs, VPs, etc.)
- Only pay for enrichment on relevant contacts
- More cost-effective than enriching all employees

**Why Email-Only (No Phone)?**
- Phone enrichment requires async webhook implementation
- Adds significant complexity (webhook endpoint, job tracking, polling)
- Emails are sufficient for initial outreach
- Phone numbers can be added later if needed

**Why Batch Processing?**
- Apollo limits bulk enrichment to 10 people per request
- Sequential batching with delays prevents rate limiting
- Provides predictable, reliable enrichment flow

**Why Client-Side Enrichment Trigger?**
- User controls when to spend API credits
- Can adjust number of companies to enrich
- Separates concerns: Exa for discovery, Apollo for enrichment

### Cost Considerations

**Apollo API Credits:**
- Search: ~1 credit per company
- Enrichment: ~1 credit per contact revealed
- Example: 10 companies × 5 contacts average = 60 credits total
- Rate limiting prevents accidental overspending

**Optimization Strategy:**
- Default limit: 10 companies (configurable)
- Only enrich when user clicks button
- Skip companies with invalid domains
- Batch to minimize API calls

## Future Phases

### Phase 3: Lead Qualification (Planned)
- Use AI to analyze companies and determine fit for services
- Score leads based on company size, industry, tech stack
- Generate personalized outreach angles based on research

### Phase 4: Approval Workflow (Planned)
- Human-in-the-loop approval via Slack or terminal
- Review and approve/reject emails before sending
- Track approval status and decisions

### Phase 5: Email Outreach (Planned)
- Send approved emails to qualified leads
- Track email delivery and responses
- Follow-up automation

## Technical Stack

**Frontend:**
- Next.js 16 (App Router, React 19)
- TypeScript for type safety
- Tailwind CSS v4 for styling
- shadcn/ui components (Button, Textarea, Field, etc.)
- React Hook Form (for future forms)
- Zod for schema validation
- Sonner for toast notifications
- Lucide React for icons

**Backend:**
- Next.js API Routes
- Exa API for company search
- Zod for request/response validation

**Data Flow:**
- Client-side state management with React useState
- RESTful API endpoints
- JSON request/response format
- CSV export via browser download API

## Architecture Decisions

### Why `exa.searchAndContents()` over `exa.search()`?
- Returns full content (text, summary, highlights) in one API call
- No need for separate `getContents()` call
- Better performance for rich results display
- Simplifies backend code

### Why Replace Form Instead of Adding New Page?
- User requested full replacement
- Simpler architecture with single purpose
- Easier to maintain and test
- Old code remains in git history for reference

### Why Client-Side State Over Form Library?
- Simple one-field search doesn't need react-hook-form complexity
- Direct control over search trigger timing
- Easier to manage results display state
- Fewer dependencies

### CSV Export Implementation
- Client-side generation for privacy (no server logging of results)
- Proper CSV escaping prevents data corruption
- Timestamped filenames prevent overwrites
- Blob API provides clean download UX
