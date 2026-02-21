# Migrating from Postgres to SQLite

## Prerequisites

```bash
brew install pipx
pipx install 'db-to-sqlite[postgresql]'
pipx install sqlite-utils
```

## party_protocol

```bash
db-to-sqlite $BOTTLE_SERVICE_DATABASE_URL ./data/party_protocol.db \
  --table=CrowdfundContribution \
  --table=Crowdfund \
  --table=CrowdfundStatusUpdate \
  --table=Party \
  --table=ManualPartyMember
./create_indexes_party_protocol.sh
```

## party_bid

```bash
db-to-sqlite $PARTY_BID_DATABASE_URL ./data/party_bid.db \
  --table=party \
  --table=party_contribution \
  --table=party_created \
  --table=party_finalized
./create_indexes_party_bid.sh
```
