#!/bin/sh

set -eu
./prepare-aws-env.js
yarn prisma migrate deploy
yarn start:prod