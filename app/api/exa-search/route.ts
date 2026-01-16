import { exaSearchRequestSchema } from "@/lib/types";
import { exa } from "@/lib/exa";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const parsedBody = exaSearchRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.message },
        { status: 400 }
      );
    }

    // Call Exa API with searchAndContents method
    const searchResults = await exa.searchAndContents(parsedBody.data.query, {
      numResults: 100, // Per spec: list of 100 companies
      type: "auto", // Let Exa decide best search type
      category: "company", // Filter for company results
      summary: {
        // Request summaries
        query: parsedBody.data.query,
      },
      text: {
        // Request text content
        maxCharacters: 1000,
      },
      highlights: {
        // Request highlights
        query: parsedBody.data.query,
        numSentences: 3,
      },
    });

    return NextResponse.json({
      results: searchResults.results,
      // autopromptString: searchResults.autopromptString
    });
  } catch (error) {
    console.error("Exa search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
