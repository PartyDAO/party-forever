export type Filters = Record<string, string | number>;

export class DatasetteClient<TableTypes> {
  protected readonly baseUrl: string;

  constructor(apiUrl: string, database: string) {
    this.baseUrl = `${apiUrl.replace(/\/$/, "")}/${database}`;
  }

  async query<T extends keyof TableTypes & string>(
    table: T,
    filters: Filters = {},
    opts: { sort_desc?: string; limit?: number; next?: string } = {}
  ): Promise<{ rows: TableTypes[T][]; next: string | null }> {
    const params = new URLSearchParams({ _shape: "objects" });

    for (const [k, v] of Object.entries(filters)) params.set(k, String(v));
    if (opts.sort_desc) params.set("_sort_desc", opts.sort_desc);
    if (opts.limit) params.set("_size", String(opts.limit));
    if (opts.next) params.set("_next", opts.next);

    const res = await fetch(`${this.baseUrl}/${table}.json?${params}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json();
    return { rows: data.rows, next: data.next ?? null };
  }
}
