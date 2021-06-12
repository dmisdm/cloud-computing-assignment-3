#!/usr/bin/env yarn ts-node
import { exec } from "shelljs";
import path from "path";
exec("./gradlew clean shadowJar", {
  cwd: path.resolve(__dirname, "./mapreducer"),
});
