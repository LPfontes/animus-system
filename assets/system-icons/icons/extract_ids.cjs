const fs = require('fs');

const inputFile = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\assets\\system-icons\\icons\\alvo.md';
const outputFile = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\assets\\system-icons\\icons\\ids_download.json';

const content = fs.readFileSync(inputFile, 'utf8');
const regex = /post-(\d+).*?href="(https:\/\/craftpix\.net\/(product|freebies)\/[^"]+)"/g;

const results = [];
let match;

while ((match = regex.exec(content)) !== null) {
    results.push({
        id: match[1],
        url: match[2]
    });
}

// Remover duplicatas baseadas no ID
const uniqueResults = Array.from(new Set(results.map(r => r.id)))
    .map(id => results.find(r => r.id === id));

fs.writeFileSync(outputFile, JSON.stringify(uniqueResults, null, 2));

console.log(`Extraídos ${uniqueResults.length} IDs únicos.`);
