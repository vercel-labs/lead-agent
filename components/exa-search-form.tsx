'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field';
import { toast } from 'sonner';
import { Download, Users, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  ExaSearchResponse,
  ExaSearchResult,
  EnrichedExaResult,
  ApolloEnrichResponse
} from '@/lib/types';
import { Slider } from '@/components/ui/slider';

const DEFAULT_QUERY = 'list of 100 companies that have a trust center';

export function ExaSearchForm() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ExaSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apolloLimit, setApolloLimit] = useState(10);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedResults, setEnrichedResults] = useState<EnrichedExaResult[] | null>(
    null
  );
  const [includePhones, setIncludePhones] = useState(false);
  const [phoneEnrichmentPending, setPhoneEnrichmentPending] = useState(false);
  const [phoneJobIds, setPhoneJobIds] = useState<Map<string, string>>(new Map());

  async function handleSearch() {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/exa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: ExaSearchResponse = await response.json();
      setResults(data.results);
      toast.success(`Found ${data.results.length} results`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }

  function escapeCSVField(field: string | undefined | null): string {
    if (!field) return '';
    // Escape double quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    // Wrap in quotes if contains comma, newline, or quote
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      return `"${escaped}"`;
    }
    return escaped;
  }

  async function handleApolloEnrich() {
    if (!results || results.length === 0) {
      toast.error('No search results to enrich');
      return;
    }

    setIsEnriching(true);
    setError(null);

    try {
      // Take top N companies based on score
      const topCompanies = results
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, apolloLimit)
        .map((r) => ({ title: r.title, url: r.url }));

      // Call Apollo API
      const response = await fetch('/api/apollo-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: topCompanies,
          limit: apolloLimit,
          includePhones
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Enrichment failed');
      }

      const data: ApolloEnrichResponse = await response.json();

      // Merge Apollo contacts into Exa results
      const merged: EnrichedExaResult[] = results.map((exaResult) => {
        const apolloData = data.results.find((r) => r.url === exaResult.url);
        return {
          ...exaResult,
          apolloContacts: apolloData?.contacts || []
        };
      });

      setEnrichedResults(merged);
      const enrichedCount = data.results.filter((r) => r.contacts.length > 0).length;
      toast.success(
        `Enriched ${enrichedCount} of ${apolloLimit} companies with Apollo data`
      );

      // Check if phone enrichment was requested and start polling
      if (includePhones) {
        const jobIds = new Map<string, string>();
        data.results.forEach((result: any) => {
          if (result.phoneJobId) {
            jobIds.set(result.phoneJobId, result.url);
          }
        });

        if (jobIds.size > 0) {
          setPhoneJobIds(jobIds);
          setPhoneEnrichmentPending(true);
          pollPhoneEnrichment(jobIds);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enrichment failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEnriching(false);
    }
  }

  async function pollPhoneEnrichment(jobIds: Map<string, string>) {
    const maxAttempts = 30; // 60 seconds total
    let attempts = 0;

    const poll = async () => {
      attempts++;
      const completedJobs = new Set<string>();

      for (const [jobId, url] of jobIds.entries()) {
        try {
          const response = await fetch(`/api/phone-enrichment-status/${jobId}`);
          const data = await response.json();

          if (data.status === 'completed') {
            completedJobs.add(jobId);

            // Merge phone data into enrichedResults
            setEnrichedResults((prev) => {
              if (!prev) return prev;
              return prev.map((result) => {
                if (result.url === url) {
                  return {
                    ...result,
                    apolloContacts: result.apolloContacts?.map((contact) => {
                      const enriched = data.contacts.find(
                        (c: any) => c.name === contact.name
                      );
                      return enriched && enriched.phone
                        ? { ...contact, phone: enriched.phone }
                        : contact;
                    }),
                  };
                }
                return result;
              });
            });
          } else if (data.status === 'failed') {
            completedJobs.add(jobId);
            console.error(`Phone enrichment failed for job ${jobId}:`, data.error);
          }
        } catch (error) {
          console.error(`Error polling job ${jobId}:`, error);
        }
      }

      // Remove completed jobs
      completedJobs.forEach((jobId) => jobIds.delete(jobId));

      // Check completion or timeout
      if (jobIds.size === 0) {
        setPhoneEnrichmentPending(false);
        setPhoneJobIds(new Map());
        toast.success('Phone numbers enriched successfully');
      } else if (attempts >= maxAttempts) {
        setPhoneEnrichmentPending(false);
        setPhoneJobIds(new Map());
        toast.error('Phone enrichment timed out - some numbers may be missing');
      } else {
        setTimeout(poll, 2000); // Poll again in 2 seconds
      }
    };

    poll();
  }

  function handleExportCSV() {
    const dataToExport = enrichedResults || results;

    if (!dataToExport || dataToExport.length === 0) {
      toast.error('No results to export');
      return;
    }

    // Define CSV headers - one row per person
    const headers = [
      'Company Name',
      'Company URL',
      'Company Summary',
      'Company Text',
      'Company Highlights',
      'Company Author',
      'Company Published Date',
      'Company Score',
      'Contact Name',
      'Contact Email',
      'Contact Phone',
      'Contact Title',
      'Contact LinkedIn URL'
    ];

    // Convert results to CSV rows - one row per person
    const rows: string[][] = [];

    dataToExport.forEach((result) => {
      const enrichedResult = result as EnrichedExaResult;
      const contacts = enrichedResult.apolloContacts || [];

      // If no contacts, create one row with 'null' for contact fields
      if (contacts.length === 0) {
        rows.push([
          escapeCSVField(result.title),
          escapeCSVField(result.url),
          escapeCSVField(result.summary),
          escapeCSVField(result.text),
          escapeCSVField(result.highlights?.join(' | ')),
          escapeCSVField(result.author),
          escapeCSVField(result.publishedDate),
          result.score?.toString() || '',
          'null',  // Contact Name
          'null',  // Contact Email
          'null',  // Contact Phone
          'null',  // Contact Title
          'null'   // Contact LinkedIn URL
        ]);
      } else {
        // Create one row per contact
        contacts.forEach((contact) => {
          rows.push([
            escapeCSVField(result.title),
            escapeCSVField(result.url),
            escapeCSVField(result.summary),
            escapeCSVField(result.text),
            escapeCSVField(result.highlights?.join(' | ')),
            escapeCSVField(result.author),
            escapeCSVField(result.publishedDate),
            result.score?.toString() || '',
            escapeCSVField(contact.name),
            escapeCSVField(contact.email || ''),
            escapeCSVField(contact.phone || ''),
            escapeCSVField(contact.title || ''),
            escapeCSVField(contact.linkedin_url || '')
          ]);
        });
      }
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `exa-search-results-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast.success('CSV file downloaded successfully');
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Search Input Section */}
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="search-query">Search Query</FieldLabel>
          <Textarea
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            rows={3}
            className="resize-none"
            disabled={isSearching}
          />
          <FieldDescription>
            Modify the query to search for specific types of companies
          </FieldDescription>
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>

        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="w-full sm:w-auto"
        >
          {isSearching ? 'Searching...' : 'Run Search'}
        </Button>
      </div>

      {/* Apollo Enrichment Controls */}
      {results && results.length > 0 && !enrichedResults && (
        <div className="space-y-4 border rounded-lg p-6 bg-muted/50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Enrich with Apollo</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Find decision makers and their contact information for the top companies
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Number of companies to enrich
              </label>
              <span className="text-sm font-semibold">{apolloLimit}</span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[apolloLimit]}
              onValueChange={([val]) => setApolloLimit(val)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enriching top {apolloLimit} companies by relevance score
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-phones"
              checked={includePhones}
              onCheckedChange={(checked) => setIncludePhones(!!checked)}
            />
            <label
              htmlFor="include-phones"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include phone numbers (takes longer)
            </label>
          </div>
          <Button
            onClick={handleApolloEnrich}
            disabled={isEnriching}
            className="w-full sm:w-auto"
          >
            {isEnriching
              ? 'Enriching...'
              : `Enrich Top ${apolloLimit} ${apolloLimit === 1 ? 'Company' : 'Companies'}`}
          </Button>
        </div>
      )}

      {/* Results Section */}
      {(enrichedResults || results) && (enrichedResults || results)!.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Search Results ({(enrichedResults || results)!.length})
              {enrichedResults && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Enriched with Apollo)
                </span>
              )}
            </h2>
            <div className="flex flex-col items-end gap-2">
              {phoneEnrichmentPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pulling phone numbers... this may take a moment
                </div>
              )}
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="gap-2"
                disabled={phoneEnrichmentPending}
              >
                <Download className="h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {(enrichedResults || results)!.map((result, index) => {
              const enrichedResult = result as EnrichedExaResult;
              return (
              <div
                key={result.url || index}
                className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
              >
                {/* Company Name/Title */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-lg">{result.title}</h3>
                  {result.score && (
                    <span className="text-sm text-muted-foreground">
                      Score: {result.score.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* URL */}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {result.url}
                </a>

                {/* Summary */}
                {result.summary && (
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">Summary:</p>
                    <p>{result.summary}</p>
                  </div>
                )}

                {/* Highlights */}
                {result.highlights && result.highlights.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">
                      Highlights:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.highlights.map((highlight, i) => (
                        <li key={i} className="text-muted-foreground">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Text Content */}
                {result.text && (
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">Content:</p>
                    <p className="line-clamp-3 text-muted-foreground">
                      {result.text}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {result.author && <span>Author: {result.author}</span>}
                  {result.publishedDate && (
                    <span>
                      Published:{' '}
                      {new Date(result.publishedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Apollo Contacts */}
                {enrichedResult.apolloContacts &&
                  enrichedResult.apolloContacts.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="font-medium text-sm">
                          Decision Makers ({enrichedResult.apolloContacts.length})
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {enrichedResult.apolloContacts.slice(0, 5).map((contact, i) => (
                          <div
                            key={i}
                            className="bg-muted/50 rounded-md p-3 space-y-1"
                          >
                            <p className="font-semibold text-sm">{contact.name}</p>
                            {contact.title && (
                              <p className="text-xs text-muted-foreground">
                                {contact.title}
                              </p>
                            )}
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-xs text-primary hover:underline block"
                              >
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-xs text-primary hover:underline block"
                              >
                                {contact.phone}
                              </a>
                            )}
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                LinkedIn Profile
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      {enrichedResult.apolloContacts.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          + {enrichedResult.apolloContacts.length - 5} more contacts
                          (see CSV export)
                        </p>
                      )}
                    </div>
                  )}
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No results found. Try modifying your search query.
        </div>
      )}
    </div>
  );
}
