import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import fs from "fs";

const PACK_SRC = "packs/_source/Animus";
const PACK_DEST = "packs";

/**
 * Compile source files into LevelDB packs.
 */
async function compile() {
  const systemJson = JSON.parse(fs.readFileSync("system.json", "utf8"));
  const packs = systemJson.packs;

  for (const pack of packs) {
    const packName = pack.name;
    // Mapeamento para a nova estrutura física dentro de Animus/
    let srcName = packName;
    if (packName === "itens") srcName = "itens";
    if (packName === "regras") srcName = "regras";
    if (packName === "bestiario") srcName = path.join("bestiario", "Criaturas");
    if (packName === "talentos-criaturas") srcName = path.join("bestiario", "Talentos");

    const src = path.join(PACK_SRC, srcName);
    const dest = path.join(PACK_DEST, packName);
    
    if (!fs.existsSync(src)) {
      console.warn(`Source for pack ${packName} not found at ${src}. Skipping.`);
      continue;
    }

    console.log(`Compiling ${packName} from ${src}...`);
    try {
      await compilePack(src, dest, { 
        recursive: true, 
        yaml: true,
        log: true 
      });
      console.log(`Finished compiling ${packName}.`);
    } catch (err) {
      if (err.code === 'LEVEL_ITERATOR_NOT_OPEN') {
        console.warn(`Warning: Iterator error on ${packName}, but pack seems completed.`);
        continue;
      }
      console.error(`Error compiling ${packName}:`, err);
      throw err;
    }
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
