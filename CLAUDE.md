## party-forever

Monorepo for Party Protocol contracts UI.

- `apps/party-protocol`: main React app
- `apps/create`, `apps/landing`, `apps/partybid`: other UIs
- `packages/contracts`: ABIs and contract logic
- `packages/scripts`: misc scripts

### party-addresses Submodule

`packages/scripts/party-addresses` is a git submodule. Do not import from it—only used by `generate_contracts` script.

### File Naming

snake_case for non-components (`proposal_data.ts`). CamelCase for components (`Button.tsx`).

### Imports

Use `.ts` extensions in imports (not `.js`).

### Viem

- Use `formatUnits`/`parseUnits` and `formatEther`/`parseEther`—never manual `/ 10 ** decimals`
- Always use `as const` for `functionName` and `eventName` in viem calls
- Batch multiple `readContract` calls into a single `multicall` when possible
- Use `allowFailure: false` and destructure into named variables: `const [name, symbol] = await client.multicall({ contracts: [...], allowFailure: false })`
- Only use `allowFailure: true` when individual calls may legitimately fail and you need graceful fallbacks—still destructure into named results (e.g. `[nameResult, symbolResult]`)

### Contract Classes

- Provide static `create()` factory methods using `findImplementation`
- Always accept optional `client` parameter and pass through
- Frontend must pass its own client from `@/lib/client.ts`—never rely on default
- Use instance ABI (`this.partyAbi.abi`)—never inline ABI definitions

### Frontend

- External APIs go in `apps/party-protocol/src/external/`
- Helpers go in `apps/party-protocol/src/lib/` (format.ts, constants.ts, client.ts)
- Use `react-hook-form` for forms, UI components in `@/components/ui/`
- Display full Ethereum addresses using `EtherscanLink` component
- Never use array index as React `key`
- No cancelled/aborted flags in useEffect—React handles unmount
- Radix Dialog: import from `@/components/ui/Dialog.tsx`
- **Class names:** Use the `cn` utility (from the app’s `lib/utils.ts` or `@party-forever/ui`) instead of string concatenation or template literals for `className`. Use `cn(...)` for conditional classes and merging with props (e.g. `className={cn("base", className)}`). Keeps Tailwind/twMerge working and class logic readable.

### Error Handling

Let errors propagate. Only catch at UI boundary to display to user.

### Type Safety

No `as any`. Let TS infer types. Exception: `as const` for viem string params.

### Layout

Flexbox with `gap`/`padding`. Avoid `margin`/`float` for layout.

### Copy: Party

Capitalize "Party" whenever it is used as a noun or adjective (e.g. "Party card", "Party membership", "the Party's token holdings"). Do not capitalize when it is part of a code identifier (e.g. `partyAddress`, `PartyContract`).

### Cursor Rules

Follow `.cursor/rules/` for component organization, arrow function components, flexbox layout, and yarn usage.

### DbPartyProtocolClient

`DbPartyProtocolClient` (`packages/externals/src/db_party_protocol_client.ts`) is only for the profile page. Do not use elsewhere.

### PartyBidApiClient

`PartyBidApiClient` (`packages/externals/src/party_bid_api_client.ts`) is only for the partybid profile page. Do not use elsewhere.

### Before Committing

Run `yarn verify` (prettier + lint + build + test).
