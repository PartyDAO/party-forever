# Party Create

A Vite app that exposes Party Swap token pages: view tokens, buy/sell during an active crowdfund, or link to Uniswap when the token has graduated.

## Behavior

- **Search**: Enter token address to open a token page (Base only).
- **Active crowdfund**: Buy (contribute) and Sell (withdraw for refund) use **on-chain contract calls** (Party Token Launcher). The user signs transactions with their wallet. Allowlisted crowdfunds are not supported for buy; use create.party.app for those.
- **Launched (graduated to Uniswap)**: Only a “Trade on Uniswap” link is shown.

## Setup

1. Copy `.env.sample` to `.env` and set:
   - `VITE_WALLETCONNECT_PROJECT_ID` – WalletConnect project ID
   - `VITE_RPC_URL_BASE` – Base RPC URL

2. From repo root: `yarn install` then `yarn workspace create dev` (or from this directory: `yarn dev`).

## Contracts

The app reads from and writes to the Party Token Launcher contract on Base (`0x418FBe3309cc2f7b9218C9f4A675A431FB0FaB60`). No create.party.app API is required; all data and transaction building use viem and the contract ABI.

## Routes

- `/` – Search (token address)
- `/:address` – Token details (e.g. `/0x7ce580b845954a4d5ca8f77b193916e6c27e5484`)
