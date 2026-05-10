import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const mapping = {
  "Arremessável": "81fe7f652bc0929d",
  "Arremesso Pesado": "a238b499073172db",
  "Atordoante": "7944041d483c69fe",
  "Defensiva": "137bf484554c9811",
  "Duas Mãos": "536af86533972d7a",
  "Dupla": "789b704f11658a19",
  "Encurvada": "07927275b7bc657f",
  "Especializada": "9117dfc9d9dac21b",
  "Fio afiado": "056e799afe1f437c",
  "Flexível": "5ce6affee935b0c8",
  "Híbrida": "2ae7b39b59b806ff",
  "Leve": "d978b9b4127302a4",
  "Ocultável": "2177bb04aa37a26d",
  "Penetrante": "9635d512fe57fcb0",
  "Sequente": "a432b51bedef3fbc",
  "Serrilhada": "9a708dc8fd92e69e",
  "Silenciosa": "a61e062fca2a8ecd",
  "Equilibrada": "8c604befa23e226c",
  "Estratégica": "9184fe3ab9f9fff5",
  "Peculiar": "229aefa5a301884f",
  "Reforçada": "0fab2866691b3327"
};

const dir = 'packs/_source/itens/Armas';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.yml')) results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let data = yaml.load(content);

  if (data.type !== 'weapon') return;

  const desc = data.system.description || "";
  const props = [];

  for (const [name, id] of Object.entries(mapping)) {
    if (desc.includes(name)) {
      props.push(id);
    }
  }

  data.system.properties = props;
  
  fs.writeFileSync(file, yaml.dump(data, { indent: 2 }));
  console.log(`Updated ${data.name}`);
});
