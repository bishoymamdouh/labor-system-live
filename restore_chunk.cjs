const fs = require('fs');
const diff = fs.readFileSync('target_diff.txt', 'utf8');
const data = JSON.parse(diff);
const lines = data.content.split('\n');

let insideDiff = false;
let recovered = '';
for (const line of lines) {
    if (line.startsWith('@@')) { insideDiff = true; continue; }
    if (line === '[diff_block_end]') { insideDiff = false; continue; }
    if (insideDiff) {
        if (line.startsWith('-') || line.startsWith(' ')) {
            recovered += line.substring(1) + '\n';
        }
    }
}
fs.writeFileSync('restored_chunk.html', recovered);
