import fs from "fs";
import path from "path";

const PACK_SRC = "packs/_source/Animus";

const ENCODING_MAP = {
  "__o": "ção",
  "__e": "ções",
  "__a": "ção",
  "_o": "ão",
  "_a": "ã",
  "_i": "í",
  "_e": "ê",
  "_u": "ú",
  "Personaliza__o": "Personalização",
  "Secund_rios": "Secundários",
  "Esp_ritos": "Espíritos",
  "Aberra__es": "Aberrações",
  "Ascend_ncias": "Ascendências",
  "A__es": "Ações",
  "Condi__es": "Condições",
  "Ilumina__o": "Iluminação",
  "Explora__o": "Exploração",
  "Utilit_rios": "Utilitários",
  "Caracter_sticas": "Características",
  "M_sticos": "Místicos",
  "T_tico": "Tático"
};

function cleanName(name) {
  let newName = name;
  // Remove ID suffixes (16 hex chars at the end, preceded by _)
  // Example: Armas_e5c8a80452bc9a5e -> Armas
  // Also handles some custom ones like _fldbest...
  newName = newName.replace(/_[a-z0-9]{16}$/i, "");
  newName = newName.replace(/_fld[a-z0-9]+$/i, "");
  newName = newName.replace(/_equipament[0-9]+$/i, "");
  newName = newName.replace(/_personalizacao[0-9]+$/i, "");
  newName = newName.replace(/_secundarios[0-9]+$/i, "");
  newName = newName.replace(/_regrashub[0-9]+$/i, "");

  // Fix encoding
  for (const [key, value] of Object.entries(ENCODING_MAP)) {
    if (newName.includes(key)) {
      newName = newName.replace(new RegExp(key, 'g'), value);
    }
  }

  // Final cleanup of remaining double underscores or weird patterns
  newName = newName.replace(/__/g, " ");
  newName = newName.replace(/_/g, " ");
  
  return newName.trim();
}

function mergeDirs(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      mergeDirs(srcPath, destPath);
    } else {
      // If file exists, the one in "messy" folder might be newer (if it came from recent unpack)
      // but let's just copy it over.
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function deleteDirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

function processDir(basePath) {
  if (!fs.existsSync(basePath)) return;

  const folders = fs.readdirSync(basePath);
  for (const folder of folders) {
    const fullPath = path.join(basePath, folder);
    if (!fs.lstatSync(fullPath).isDirectory()) continue;

    const cleaned = cleanName(folder);
    const targetPath = path.join(basePath, cleaned);

    if (fullPath !== targetPath) {
      console.log(`Cleaning: ${folder} -> ${cleaned}`);
      mergeDirs(fullPath, targetPath);
      deleteDirRecursive(fullPath);
      // Recursively process the cleaned directory
      processDir(targetPath);
    } else {
      // Just process children
      processDir(fullPath);
    }
  }
}

console.log("Starting pack cleanup...");
processDir(PACK_SRC);
console.log("Cleanup complete!");
