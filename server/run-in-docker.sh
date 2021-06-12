#!/bin/sh

set -eu

yarn workspace prisma-client migrate
yarn start:prod