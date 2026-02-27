# Party Forever

Monorepo for [Party Protocol](https://www.party.app/) — a platform for group coordination onchain.

## Project Structure

```
apps/
  party-protocol/   Main dashboard — manage parties, crowdfunds, distributions
  create/           Party and token creation interface
  partybid/         PartyBid V1 marketplace for collective NFT bidding
  landing/          Marketing site and terms of service

packages/
  contracts/        Smart contract ABIs and TypeScript wrapper classes
  ui/               Shared React components (Button, Dialog, Card, etc.)
  externals/        External API clients (Alchemy, OpenSea, ENS, etc.)
  scripts/          Contract ABI generation (see below)
```

## Tech Stack

- **Framework:** React 18 + React Router 7
- **Build:** Vite 7, Turborepo, Yarn Workspaces
- **Ethereum:** Viem, Wagmi, RainbowKit
- **Styling:** Tailwind CSS 4, Radix UI
- **Testing:** Vitest
- **Deployment:** Cloudflare Pages (via Wrangler)
- **Language:** TypeScript (strict mode)

## Getting Started

Each app and package that needs configuration has a `.env.sample` file. Copy it to `.env` and fill in your values:

```sh
cp apps/party-protocol/.env.sample apps/party-protocol/.env
# repeat for apps/create, apps/partybid, packages/contracts, packages/scripts
```

Then install and run:

```sh
yarn install
yarn dev        # Start all dev servers
```

## Configuration

The RPC URLs, Alchemy API key, and DB API URL set in `.env` are used as defaults by the frontend. Users can override these at runtime in the **Settings** page of each web app without needing to rebuild.

### Developer Mode

The Settings page also has a developer mode toggle. When enabled, it adds an RPC call counter for identifying unnecessary calls and verifying that multicalls are batched properly, and Tenderly simulation links next to transaction actions so you can preview execution before sending onchain.

## Deployment

All apps are static front-end SPAs — the build output is plain HTML/JS/CSS that can be hosted anywhere. The repo is currently configured to deploy to Cloudflare Pages via Wrangler, but any static hosting provider will work.

The only backend service is the DB API (`apps/db_api`), which is optional. A publicly hosted instance is available at https://api.partydao.org/ (already set in the `.env.sample` files). If you want to run your own, see `apps/db_api` for instructions.

## Contract Generation

`packages/scripts` contains a `generate_contracts` script that pulls ABIs from the `party-addresses` git submodule and generates the TypeScript bindings in `packages/contracts`. The generated contracts are already checked into the repo, so most developers won't need to run this — it's only necessary when the underlying smart contracts change.

## Contributing

See [CLAUDE.md](./CLAUDE.md) for coding conventions, file naming rules, and architectural guidelines. If you run into any issues reach out at [support@partydao.org](mailto:support@partydao.org).

## IPFS

Images for parties created on party-protocol and on create.party.app were uploaded and pinned to IPFS.  Additional details on the preservation of these IPFS images is available at the [PartyDAO/ipfs-forever](https://github.com/PartyDAO/ipfs-forever) repo.
