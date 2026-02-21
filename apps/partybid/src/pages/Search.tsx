import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Button, Input, Loading } from "@party-forever/ui";
import { getPartyBidApiClient } from "@/lib/party_bid_api_client.ts";

const SEARCH_LIMIT = 100;

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<{ name: string; partyAddress: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (name: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const rows = await getPartyBidApiClient().searchParties(name, { limit: SEARCH_LIMIT });
      setResults(rows.map((r) => ({ name: r.name || "Unnamed", partyAddress: r.partyAddress })));
    } catch {
      setResults([]);
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

      {searched && !loading && (
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
                  key={r.partyAddress}
                  className="flex items-center gap-3 rounded border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium truncate flex-1">{r.name}</span>
                  <Link to={`/party/${r.partyAddress}`}>
                    <Button variant="outline" size="sm">
                      View PartyBid
                    </Button>
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
