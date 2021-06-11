import path = require("path");

export const fromRoot = (...relativeParts: string[]) =>
  path.resolve(process.cwd(), "../", ...relativeParts);
