#!/bin/bash
DB="./data/party_protocol.db"

# CrowdfundContribution
sqlite-utils create-index $DB CrowdfundContribution networkId --if-not-exists
sqlite-utils create-index $DB CrowdfundContribution crowdfundAddress --if-not-exists
sqlite-utils create-index $DB CrowdfundContribution contributor --if-not-exists
sqlite-utils create-index $DB CrowdfundContribution delegate --if-not-exists
sqlite-utils create-index $DB CrowdfundContribution networkId crowdfundAddress --if-not-exists

# Crowdfund
sqlite-utils create-index $DB Crowdfund networkId --if-not-exists
sqlite-utils create-index $DB Crowdfund crowdfundAddress --if-not-exists
sqlite-utils create-index $DB Crowdfund creator --if-not-exists
sqlite-utils create-index $DB Crowdfund crowdfundType --if-not-exists
sqlite-utils create-index $DB Crowdfund networkId crowdfundAddress --if-not-exists

# CrowdfundStatusUpdate
sqlite-utils create-index $DB CrowdfundStatusUpdate networkId --if-not-exists
sqlite-utils create-index $DB CrowdfundStatusUpdate crowdfundAddress --if-not-exists
sqlite-utils create-index $DB CrowdfundStatusUpdate crowdfundStatus --if-not-exists
sqlite-utils create-index $DB CrowdfundStatusUpdate partyAddress --if-not-exists
sqlite-utils create-index $DB CrowdfundStatusUpdate networkId crowdfundAddress --if-not-exists

# Party
sqlite-utils create-index $DB Party networkId --if-not-exists
sqlite-utils create-index $DB Party address --if-not-exists
sqlite-utils create-index $DB Party creator --if-not-exists
sqlite-utils create-index $DB Party networkId address --if-not-exists

# ManualPartyMember
sqlite-utils create-index $DB ManualPartyMember networkId --if-not-exists
sqlite-utils create-index $DB ManualPartyMember partyAddress --if-not-exists
sqlite-utils create-index $DB ManualPartyMember member --if-not-exists
sqlite-utils create-index $DB ManualPartyMember networkId partyAddress --if-not-exists

echo "Done creating indexes."
