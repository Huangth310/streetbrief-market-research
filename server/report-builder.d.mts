export function classifyMarketOpportunity(input: {
  directCompetitorCount: number;
  coverage: number;
  anchorCount: number;
}): "gap" | "mature_entry" | "insufficient";

export function isRelevantWebResult(
  competitor: { name: string },
  poi: { address: string },
  result: { title?: string; content?: string },
): boolean;

export function matchesCategory(
  poi: { name?: string; type?: string; typecode?: string },
  category: string,
): boolean;
