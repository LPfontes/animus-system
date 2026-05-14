import fs from 'fs';
import path from 'path';

const targetDir = './packs/_source/Animus/regras/regras/Talentos';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "ações" with "PAs"
    content = content.replace(/ações/g, 'PAs');
    content = content.replace(/Ações/g, 'PAs');
    
    // Replace "ação" with "PA"
    // Avoid replacing inside words if possible, but in descriptions it's usually clear
    // We'll use word boundaries or lookaheads to be safe
    content = content.replace(/\bação\b/g, 'PA');
    content = content.replace(/\bAção\b/g, 'PA');
    
    // Special case for the span content which might not have word boundaries in some cases
    content = content.replace(/>ação</g, '>PA<');
    content = content.replace(/>ações</g, '>PAs<');
    content = content.replace(/>Ação</g, '>PA<');
    content = content.replace(/>Ações</g, '>PAs<');

    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.yml')) {
            replaceInFile(fullPath);
            console.log(`Processed: ${file}`);
        }
    }
}

console.log('Starting replacement...');
processDirectory(targetDir);
console.log('Finished replacement.');
