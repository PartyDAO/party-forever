import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Button, ErrorDisplay, Input, Loading } from "@party-forever/ui";
import { searchByName, type SearchResult } from "@/lib/search_results.ts";

const SEARCH_LIMIT = 100;

export const PartyNameSearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const doSearch = useCallback(async (name: string) => {
    setLoading(true);
    setSearched(true);
    setSearchError(false);
    try {
      setResults(await searchByName(name, SEARCH_LIMIT));
    } catch {
      setResults([]);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      doSearch(queryParam);
    }
  }, [queryParam, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchParams(new URLSearchParams({ q: trimmed }));
  };

  return (
    <div className="md:px-6 px-3 py-6 flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-3 w-full">
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Button type="submit" className="shrink-0" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {loading && <Loading message="Searching…" />}

      {searchError && !loading && (
        <ErrorDisplay
          message="The indexer API may be down, but all other functionality should continue to work."
          backLink="/"
          backLabel="Back to Search"
        />
      )}

      {searched && !loading && !searchError && (
        <div className="w-full flex flex-col gap-1">
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center">
              No results found for &ldquo;{queryParam}&rdquo;
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {results.length >= SEARCH_LIMIT ? `Top ${SEARCH_LIMIT}` : results.length} result
                {results.length !== 1 ? "s" : ""} for &ldquo;{queryParam}&rdquo;
              </p>
              {results.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center gap-3 rounded border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium truncate flex-1">{r.name}</span>
                  <span className="text-xs text-muted-foreground capitalize shrink-0">
                    {r.networkName}
                  </span>
                  {r.partyAddress && (
                    <Link to={`/party/${r.networkName}/${r.partyAddress}`}>
                      <Button variant="outline" size="sm">
                        View Party
                      </Button>
                    </Link>
                  )}
                  {r.crowdfundAddress && (
                    <Link to={`/crowdfund/${r.networkName}/${r.crowdfundAddress}`}>
                      <Button variant="outline" size="sm">
                        View Crowdfund
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
