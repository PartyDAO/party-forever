### Party DB API

A lightweight API of Party Protocol data, based on a snapshot and static sqlite files.

### Set up

```bash
git lfs pull
brew install flyctl
flyctl auth login
fly apps create party-db-api --org your-org-here   # only if the app doesn't exist yet
```

> If you hit `This repository exceeded its LFS budget`, download the two `.db` files
> from the GitHub web UI ([apps/db_api/data](https://github.com/PartyDAO/party-forever/tree/main/apps/db_api/data))
> and drop them into `apps/db_api/data/`, replacing the pointer files.

### Deploy

After completing 'Set up', from `apps/db_api`:

```bash
fly deploy
```

`fly deploy` reads `fly.toml` and builds the `Dockerfile`, which bakes
`./data/party_protocol.db` and `./data/party_bid.db` into the image and serves them
with `datasette serve -i ...`.
