const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /async loadEngineerData\(\) \{([\s\S]*?const records = await db\.getRecordsWithDetails[\s\S]*?)\}/;
const match = html.match(regex);
if (match) {
    fs.writeFileSync('temp_load_eng.js', match[0], 'utf8');
}
