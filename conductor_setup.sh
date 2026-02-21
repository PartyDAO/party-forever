#!/bin/bash
set -e

echo "Copying node_modules from root project..."
rsync -a "$CONDUCTOR_ROOT_PATH/node_modules/" ./node_modules/ || true
rsync -a "$CONDUCTOR_ROOT_PATH/packages/contracts/node_modules/" ./packages/contracts/node_modules/ || true
rsync -a "$CONDUCTOR_ROOT_PATH/packages/scripts/node_modules/" ./packages/scripts/node_modules/ || true
rsync -a "$CONDUCTOR_ROOT_PATH/apps/party-protocol/node_modules/" ./apps/party-protocol/node_modules/ || true
rsync -a "$CONDUCTOR_ROOT_PATH/apps/create/node_modules/" ./apps/create/node_modules/ || true
rsync -a "$CONDUCTOR_ROOT_PATH/apps/partybid/node_modules/" ./apps/partybid/node_modules/ || true

echo "Installing dependencies..."
yarn

echo "Symlinking env files..."
ln -sf "$CONDUCTOR_ROOT_PATH/packages/scripts/.env" ./packages/scripts/.env
ln -sf "$CONDUCTOR_ROOT_PATH/packages/contracts/.env" ./packages/contracts/.env
ln -sf "$CONDUCTOR_ROOT_PATH/apps/party-protocol/.env" ./apps/party-protocol/.env
ln -sf "$CONDUCTOR_ROOT_PATH/apps/create/.env" ./apps/create/.env
ln -sf "$CONDUCTOR_ROOT_PATH/apps/partybid/.env" ./apps/partybid/.env

echo "Initializing submodules..."
git submodule update --init --recursive

unset GH_TOKEN

echo "Setup complete!"
