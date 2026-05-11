const fs = require('fs');
const path = require('path');

const iconsDir = 'c:\\Users\\lpfon\\Downloads\\icons';
const jsonFile = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\assets\\system-icons\\icons\\ids_download.json';
const outputFile = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\assets\\system-icons\\icons\\ids_download_filtered.json';

// 1. Ler os slugs dos arquivos baixados
const files = fs.readdirSync(iconsDir);
const downloadedSlugs = files.map(file => {
    // craftpix-net-ID-SLUG.zip
    const match = file.match(/craftpix-net-\d+-(.+)\.zip/);
    return match ? match[1] : null;
}).filter(Boolean);

console.log(`Arquivos baixados detectados: ${downloadedSlugs.length}`);

// 2. Ler a lista completa
const allItems = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

// 3. Filtrar
const filteredItems = allItems.filter(item => {
    // URL: https://craftpix.net/product/SLUG/ ou https://craftpix.net/freebies/SLUG/
    const urlParts = item.url.split('/').filter(Boolean);
    const slug = urlParts[urlParts.length - 1];
    
    // Verifica se o slug está na lista de baixados
    const isDownloaded = downloadedSlugs.includes(slug);
    
    if (isDownloaded) {
        console.log(`Removendo item já baixado: ${slug}`);
    }
    
    return !isDownloaded;
});

fs.writeFileSync(outputFile, JSON.stringify(filteredItems, null, 2));

console.log(`\nItens restantes para baixar: ${filteredItems.length}`);
