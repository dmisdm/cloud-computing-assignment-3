#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function run() {
  const { username, password, host, port, dbInstanceIdentifier } = JSON.parse(
    process.env.POSTGRES_SECRET_JSON,
  );
  const dotenvFileString = `
POSTGRES_URL="postgresql://${username}:${password}@${host}:${port}/${dbInstanceIdentifier}?schema=public"
  `;
  const outputPath = path.resolve(__dirname, '.env');
  fs.writeFileSync(outputPath, dotenvFileString);
  console.log('Wrote .env file to ' + outputPath);
}

run();
