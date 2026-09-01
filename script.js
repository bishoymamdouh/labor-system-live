const text = await Deno.readTextFile('diff_content.txt');
const lines = text.split('\n');
let insideDiff = false;
let recovered = [];

for (const line of lines) {
    if (line.startsWith('@@ ')) {
        insideDiff = true;
        continue;
    }
    if (insideDiff) {
        if (line.startsWith('-')) {
            recovered.push(line.substring(1));
        } else if (line.startsWith(' ')) {
            recovered.push(line.substring(1));
        } else if (line.startsWith('+')) {
            // ignore additions
        } else if (line.startsWith('[diff_block_end]')) {
            break;
        } else {
            // maybe empty line? if it's empty context, unified diff usually has just ' ' or ''
            if (line === '') recovered.push('');
        }
    }
}

await Deno.writeTextFile('recovered.txt', recovered.join('\n'));
console.log('Recovered ' + recovered.length + ' lines');
