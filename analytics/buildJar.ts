#!/usr/bin/env yarn ts-node
import { exec } from "shelljs";
import path from "path";
exec("./gradlew clean shadowJar", {
  cwd: path.resolve(__dirname, "./mapreducer"),
});
exec(
  "cp ./mapreducer/build/libs/mapreducer-1.0-SNAPSHOT-all.jar ./mapreducer.jar"
);
