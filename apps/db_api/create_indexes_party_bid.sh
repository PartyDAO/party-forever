#!/bin/bash
DB="./data/party_bid.db"

# party
sqlite-utils create-index $DB party partyAddress --if-not-exists
sqlite-utils create-index $DB party createdBy --if-not-exists
sqlite-utils create-index $DB party nftContractAddress --if-not-exists
sqlite-utils create-index $DB party partyType --if-not-exists

# party_contribution
sqlite-utils create-index $DB party_contribution partyAddress --if-not-exists
sqlite-utils create-index $DB party_contribution contributedBy --if-not-exists

# party_created
sqlite-utils create-index $DB party_created partyAddress --if-not-exists
sqlite-utils create-index $DB party_created createdBy --if-not-exists

# party_finalized
sqlite-utils create-index $DB party_finalized partyAddress --if-not-exists
sqlite-utils create-index $DB party_finalized result --if-not-exists

echo "Done creating indexes."
