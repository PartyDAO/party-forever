## Data

The SQLite files are stored in Git LFS. After cloning, run:

```bash
git lfs pull
```

## Deploying

Datasette can be deployed anywhere that runs Docker — a VPS, any cloud provider, etc. Below is an example using Fly.io since it's affordable and easy.

### Fly.io

```bash
brew install flyctl
flyctl auth login
pipx install datasette
pipx inject datasette datasette-publish-fly
datasette publish fly ./data/party_protocol.db ./data/party_bid.db \
  --app="party-db-api" \
  --extra-options="--cors --port 8080" \
  --org="your-org-here" \
  -m datasette.yml
```
