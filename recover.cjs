const fs = require('fs');

const dataStr = fs.readFileSync('target_diff.txt', 'utf8');
const data = JSON.parse(dataStr);
const content = data.content;

// The content looks like:
// The following changes were made...
// [diff_block_start]
// @@ -988,1299 +988,1498 @@
//  unchanged line
// -deleted line
// +added line

const lines = content.split('\n');
let insideDiff = false;
const recoveredLines = [];

for (const line of lines) {
    if (line.startsWith('@@')) {
        insideDiff = true;
        continue;
    }
    if (line === '[diff_block_end]') {
        insideDiff = false;
        continue;
    }
    if (insideDiff) {
        if (line.startsWith('-')) {
            recoveredLines.push(line.substring(1));
        } else if (line.startsWith(' ')) {
            // we skip unchanged lines? wait, the unchanged lines were in the original file!
            // I should include them if they were part of the removed block.
            // Actually, the removed block consists of BOTH - and   lines?
            // No, the diff format: - means it was in the original and removed.   means it was in both.
            // If I just take - and   and combine them, I get the ORIGINAL block!
            recoveredLines.push(line.substring(1));
        }
    }
}

fs.writeFileSync('recovered_lines.html', recoveredLines.join('\n'));
