const fs = require('fs');

const indexRebuilt = fs.readFileSync('index_rebuilt.html', 'utf8'); // ends just before <div class="record-summary">
const restoredChunk = fs.readFileSync('restored_chunk.html', 'utf8');
const script3 = fs.readFileSync('script3.js', 'utf8');

// The cut point was exactly before <div class="record-summary">.
// But the restored chunk starts at <span>?????? ??????:</span> which is inside <div class="summary-item"> inside <div class="record-summary">.
// So we need to add the missing tags.
const missingTags = '<div class="record-summary">\n                            <div class="summary-item">\n';

// In the restored_chunk, we stop before the javascript starts.
const jsStart = restoredChunk.indexOf('// API Wrapper for Deno Backend');
const restoredHtml = restoredChunk.substring(0, jsStart).trim();

// Now assemble.
const fullHtml = indexRebuilt + missingTags + restoredHtml + '\n\n' + script3 + '\n</script>\n</body>\n</html>';
fs.writeFileSync('index_fixed.html', fullHtml);
console.log('Assembled index_fixed.html');
