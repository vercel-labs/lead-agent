import { z } from "zod";

/**
 * Lead schema
 */

export const formSchema = z.object({
  email: z.email("Please enter a valid email address."),
  name: z
    .string()
    .min(2, "Name is required")
    .max(50, "Name must be at most 50 characters."),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number.")
    .min(10, "Phone number must be at least 10 digits.")
    .optional()
    .or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  message: z
    .string()
    .min(10, "Message is required")
    .max(500, "Message must be less than 500 characters."),
});

export type FormSchema = z.infer<typeof formSchema>;

/**
 * Qualification schema
 */

export const qualificationCategorySchema = z.enum([
  "QUALIFIED",
  "UNQUALIFIED",
  "SUPPORT",
  "FOLLOW_UP",
]);

export const qualificationSchema = z.object({
  category: qualificationCategorySchema,
  reason: z.string(),
});

export type QualificationSchema = z.infer<typeof qualificationSchema>;

/**
 * Approval system types
 */

export const approvalModeSchema = z.enum(["slack", "terminal", "none"]);
export type ApprovalMode = z.infer<typeof approvalModeSchema>;

export const approvalRequestSchema = z.object({
  id: z.string(),
  research: z.string(),
  email: z.string(),
  qualification: qualificationSchema,
  timestamp: z.number(),
  status: z.enum(["pending", "approved", "rejected"]),
  mode: approvalModeSchema,
});
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

/**
 * Exa search types
 */

export const exaSearchRequestSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(5000, "Query must be less than 5000 characters"),
});

export type ExaSearchRequest = z.infer<typeof exaSearchRequestSchema>;

export const exaSearchResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  text: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  publishedDate: z.string().optional(),
  author: z.string().optional(),
  score: z.number().optional(),
});

export type ExaSearchResult = z.infer<typeof exaSearchResultSchema>;

export const exaSearchResponseSchema = z.object({
  results: z.array(exaSearchResultSchema),
  // autopromptString: z.string().optional()
});

export type ExaSearchResponse = z.infer<typeof exaSearchResponseSchema>;

/**
 * Apollo API types
 */

export const apolloContactSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  linkedin_url: z.string().optional(),
  organization_name: z.string().optional(),
});

export type ApolloContact = z.infer<typeof apolloContactSchema>;

export const apolloEnrichRequestSchema = z.object({
  companies: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
    })
  ),
  limit: z.number().min(1).max(20).default(10),
  includePhones: z.boolean().optional(),
});

export type ApolloEnrichRequest = z.infer<typeof apolloEnrichRequestSchema>;

export const apolloEnrichResponseSchema = z.object({
  results: z.array(
    z.object({
      company: z.string(),
      url: z.string(),
      contacts: z.array(apolloContactSchema),
      error: z.string().optional(),
    })
  ),
});

export type ApolloEnrichResponse = z.infer<typeof apolloEnrichResponseSchema>;

export const enrichedExaResultSchema = exaSearchResultSchema.extend({
  apolloContacts: z.array(apolloContactSchema).optional(),
});

export type EnrichedExaResult = z.infer<typeof enrichedExaResultSchema>;
