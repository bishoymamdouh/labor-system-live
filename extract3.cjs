const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Bishoy Heshmat/.gemini/antigravity/brain/86f54fac-b6c3-4eac-b4ba-d1c523ab99f9/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'TOOL_RESPONSE' && data.content && data.content.includes('The following changes were made by the multi_replace_file_content tool')) {
          fs.appendFileSync('all_diffs.txt', '\n\n--- DIFF ---\n\n' + data.content);
      }
    } catch(e) {}
  }
}
processLineByLine();
