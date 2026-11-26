#!/bin/sh
set -eu
mkdir -p /app/dist-server/backend/data
chown -R node:node /app/dist-server/backend/data
exec gosu node node dist-server/backend/server.js
