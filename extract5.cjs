const fs = require('fs');

const data = fs.readFileSync('all_diffs.txt', 'utf8');

// The diff is inside a JSON string, so we need to parse it or just use regex to extract the diff block.
// Let's parse JSON objects line by line if we can, or just find the one that has '-                            <i class="fas fa-calendar-check"></i>'

let targetDiff = '';
const blocks = data.split('--- DIFF ---');
for (const block of blocks) {
    if (block.includes('fa-calendar-check') && block.includes('1299')) {
        targetDiff = block;
    }
}

fs.writeFileSync('target_diff.txt', targetDiff);
