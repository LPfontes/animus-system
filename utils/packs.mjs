import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import fs from "fs";

const PACK_SRC = "packs/_source";
const PACK_DEST = "packs";

/**
 * Compile source files into LevelDB packs.
 */
async function compile() {
  const packs = fs.readdirSync(PACK_SRC);
  for (const pack of packs) {
    const src = path.join(PACK_SRC, pack);
    const dest = path.join(PACK_DEST, pack);
    
    console.log(`Compiling ${pack}...`);
    await compilePack(src, dest, { 
      recursive: true, 
      yaml: true,
      log: true 
    });
  }
}

/**
 * Extract LevelDB packs into source files.
 */
async function extract() {
  const packs = fs.readdirSync(PACK_DEST).filter(p => p !== "_source");
  for (const pack of packs) {
    const src = path.join(PACK_DEST, pack);
    const dest = path.join(PACK_SRC, pack);
    console.log(`Extracting ${pack}...`);
    await extractPack(src, dest, { 
      yaml: true, 
      folders: true,
      recursive: true,
      log: true,
      omitVolatile: true
    });
  }
}

yargs(hideBin(process.argv))
  .command("compile", "Compile source YAML files into LevelDB packs", {}, compile)
  .command("extract", "Extract LevelDB packs into source YAML files", {}, extract)
  .demandCommand(1, "You must provide a command")
  .help()
  .argv;
