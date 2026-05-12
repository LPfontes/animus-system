import { compilePack } from "@foundryvtt/foundryvtt-cli";
import path from "path";

async function run() {
  const src = path.resolve("packs/_source/acoes");
  const dest = path.resolve("packs/acoes");
  console.log(`Compiling ${src} to ${dest}...`);
  try {
    await compilePack(src, dest, { yaml: true, log: true });
    console.log("Success!");
  } catch (err) {
    console.error("Failure:", err);
  }
}

run();
