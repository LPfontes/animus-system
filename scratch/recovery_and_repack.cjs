const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packsDir = 'packs';
const sourceDir = 'packs/_source';
const tempRecoverDir = 'packs/_source_recovered';

try {
    // 1. Extract existing packs for recovery
    console.log('Extracting existing packs for recovery...');
    if (fs.existsSync(tempRecoverDir)) fs.rmSync(tempRecoverDir, { recursive: true, force: true });
    fs.mkdirSync(tempRecoverDir, { recursive: true });

    const builtPacks = fs.readdirSync(packsDir).filter(p => p !== '_source' && fs.lstatSync(path.join(packsDir, p)).isDirectory());
    
    const { extractPack } = require("@foundryvtt/foundryvtt-cli");
    
    for (const pack of builtPacks) {
        console.log(`Attempting to extract pack: ${pack}...`);
        try {
            const src = path.join(packsDir, pack);
            const dest = path.join(tempRecoverDir, pack);
            // We use the library directly to avoid shell overhead and get better errors
            // But we need to await it, so let's wrap in an async IIFE if needed or just use execSync
            // Actually, let's just use execSync for simplicity in this script
            execSync(`npx -y @foundryvtt/foundryvtt-cli pack extract ${src} --dest ${dest} --yaml --folders`, { stdio: 'inherit' });
            console.log(`Successfully extracted ${pack}`);
        } catch (e) {
            console.error(`FAILED to extract pack ${pack}. Skipping...`);
        }
    }
    
    console.log('Recovery files extracted to _source_recovered.');

    // 2. Generate base sources from dados.json
    console.log('Regenerating base sources...');
    execSync('node scratch/generate_final_sources.cjs', { stdio: 'inherit' });

    // 3. Restore folders not present in dados.json (like acoes, condicoes, etc)
    console.log('Restoring extra folders (acoes, etc)...');
    const recoveredPacks = fs.readdirSync(tempRecoverDir);
    recoveredPacks.forEach(pack => {
        const packPath = path.join(sourceDir, pack);
        if (!fs.existsSync(packPath)) {
            console.log(`Restoring missing pack: ${pack}`);
            fs.renameSync(path.join(tempRecoverDir, pack), packPath);
        } else {
            // Special case: if it exists but is empty (like acoes might be after generate_final_sources)
            const files = fs.readdirSync(packPath);
            if (files.length === 0) {
                 console.log(`Pack ${pack} was empty, restoring from recovery...`);
                 fs.rmSync(packPath, { recursive: true });
                 fs.renameSync(path.join(tempRecoverDir, pack), packPath);
            }
        }
    });

    // 4. Run rune scripts
    console.log('Running rune expansion scripts...');
    execSync('node scratch/expand_runes.cjs', { stdio: 'inherit' });
    execSync('node scratch/create_shield_runes.cjs', { stdio: 'inherit' });
    execSync('node scratch/create_weapon_runes.cjs', { stdio: 'inherit' });

    // 5. Final Build
    console.log('Performing final build...');
    execSync('npm run build:packs', { stdio: 'inherit' });

    // Cleanup
    if (fs.existsSync(tempRecoverDir)) fs.rmSync(tempRecoverDir, { recursive: true, force: true });

    console.log('DONE! All packs recovered, regenerated and built.');

} catch (err) {
    console.error('Error during recovery:', err);
}
