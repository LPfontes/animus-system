import fs from "fs";
import path from "path";

const PACK_SRC = "packs/_source/Animus";

const ENCODING_MAP = {
  "Aberra__es": "Aberrações",
  "A__es": "Ações",
  "Condi__es": "Condições",
  "Personaliza__o": "Personalização",
  "Secund_rios": "Secundários",
  "Esp_ritos": "Espíritos",
  "Ascend_ncias": "Ascendências",
  "Ilumina__o": "Iluminação",
  "Explora__o": "Exploração",
  "Utilit_rios": "Utilitários",
  "Caracter_sticas": "Características",
  "M_sticos": "Místicos",
  "T_tico": "Tático",
  "__o": "ção",
  "__e": "ções",
  "__a": "ção",
  "_o": "ão",
  "_a": "ã",
  "_i": "í",
  "_u": "ú",
  // Handled separately for connectors
  "_e_": " e ",
  " _e ": " e ",
  "_a_": " a ",
  " _a ": " a "
};

function cleanName(name) {
  let newName = name;
  
  // 1. Remove ID suffixes first
  newName = newName.replace(/_[a-z0-9]{16}$/i, "");
  newName = newName.replace(/_fld[a-z0-9]+$/i, "");
  newName = newName.replace(/_equipament[0-9]+$/i, "");
  newName = newName.replace(/_personalizacao[0-9]+$/i, "");
  newName = newName.replace(/_secundarios[0-9]+$/i, "");
  newName = newName.replace(/_regrashub[0-9]+$/i, "");
  newName = newName.replace(/_talentoshub[0-9]+$/i, "");
  newName = newName.replace(/_acoeshub[0-9]+$/i, "");
  newName = newName.replace(/_elementoshub[0-9]+$/i, "");

  // 2. Fix encoding using the map (Specific to General)
  for (const [key, value] of Object.entries(ENCODING_MAP)) {
    if (newName.includes(key)) {
      newName = newName.replace(new RegExp(key, 'g'), value);
    }
  }

  // 3. Final cleanup of remaining underscores
  newName = newName.replace(/__/g, " ");
  newName = newName.replace(/_/g, " ");
  
  // Trim and ensure no double spaces
  return newName.replace(/\s+/g, " ").trim();
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
