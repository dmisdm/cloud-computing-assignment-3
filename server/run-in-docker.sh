#!/bin/sh

set -eu

export POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"


yarn prisma migrate deploy
yarn prisma generate
yarn prisma db seed --preview-feature
yarn workspace server build
yarn start:prod